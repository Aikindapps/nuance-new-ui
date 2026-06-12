import { useQuery } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import {
  CKBTC_INDEX_CANISTER_ID,
  NUA_INDEX_CANISTER_ID,
  USER_CANISTER_ID,
} from "../../../config/tokens";
import canisterIds from "../../../config/canister_ids.json";
import { principalToAccountIdentifier } from "../../../lib/accountIdentifier";
import { fromE8s, toBase256 } from "../../../lib/tokenMath";
import { buildArticleUrl } from "../../../lib/articleUrl";
import { historyCopy } from "../../../constants/copy";

export type HistoryRow = {
  id: string;
  timestampMs: number;
  sign: "+" | "-";
  /** Trimmed display number, e.g. "50", "0.1". */
  amount: string;
  /** "NUA" | "ICP" | "ckBTC" | "Free NUA". */
  token: string;
  /** The For/from column — an article link when hydration succeeded. */
  target: { label: string; url?: string };
  description: string;
};

const PAGE_FETCH = 100; // newest-N window per ledger index (prod fetches 100)

/** Trim trailing zeros: 8 → "8", 0.1020 → "0.102". */
function trimE8s(raw: bigint, maxDp = 8): string {
  const s = fromE8s(raw).toFixed(maxDp);
  return s.replace(/\.?0+$/, "") || "0";
}

function decodeMemo(memo?: Uint8Array): string {
  if (!memo || memo.length === 0) return "";
  try {
    return new TextDecoder().decode(memo);
  } catch {
    return "";
  }
}

// Wallet history (Figma 1:46484; decision #43). Mirrors production's
// client-side aggregation (screens/profile/wallet.tsx fetchAllActivities) with
// one deliberate change: NUA reads go through the SNS index canister instead of
// prod's full-ledger scan. Sources:
//   1. applauds (sent + received) across all PostBucket canisters
//   2. ext_v2 marketplace buys/sales of article keys (priced rows only —
//      prod's unpriced "Minted"/"Received" rows are omitted; the Figma table
//      shows priced rows exclusively)
//   3. ICP transfers via the ICP index canister
//   4. NUA transfers via the SNS index canister
//   5. ckBTC transfers via the ckBTC index canister
//   6. Free-NUA claims (deposits into the User-canister claim subaccount)
//   7. subscription payments/earnings from the Subscription canister
// Ledger rows whose counterparty is a tip-escrow subaccount, an NFT seller
// account, or the Subscription canister are dropped — those movements already
// appear as applaud/key/subscription rows (prod's dedupe, wallet.tsx 503-571).
// Every source degrades to [] on failure rather than failing the whole table.
export function useWalletHistory() {
  const actors = useActors();
  const { principal, isAuthenticated } = useAuth();
  const principalText = principal?.toText() ?? null;

  return useQuery<HistoryRow[]>({
    queryKey: ["wallet-history", principalText],
    enabled: isAuthenticated && !!principalText,
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (!principalText) return [];
      const myAccountId = principalToAccountIdentifier(principalText);

      // ---- source fetchers (each self-contained, throws → []) ----

      // 1. Applauds. Also returns the escrow addresses every tip moved
      // through, for the ledger-row dedupe.
      const fetchApplauds = async () => {
        const buckets = (await actors.getBucketCanisters()).map(([id]) => id);
        const applauds = (
          await Promise.all(
            buckets.map((b) => actors.getMyApplauds(b).catch(() => [])),
          )
        ).flat();

        // Hydrate article titles/handles bucket-by-bucket.
        const byBucket = new Map<string, Set<string>>();
        for (const a of applauds) {
          const set = byBucket.get(a.bucketCanisterId) ?? new Set<string>();
          set.add(a.postId);
          byBucket.set(a.bucketCanisterId, set);
        }
        const postById = new Map<string, { title: string; handle: string; bucket: string }>();
        await Promise.all(
          [...byBucket.entries()].map(async ([bucket, postIds]) => {
            try {
              const posts = await actors.getPostsByPostIds(bucket, [...postIds], true);
              posts.forEach((p) =>
                postById.set(p.postId, {
                  title: p.title,
                  handle: p.isPublication ? p.creatorHandle || p.handle : p.handle,
                  bucket,
                }),
              );
            } catch {
              /* row falls back to the unknown-article label */
            }
          }),
        );

        const escrow = new Set<string>();
        const rows: HistoryRow[] = applauds.map((a) => {
          const postNat = parseInt(a.postId, 10);
          if (Number.isFinite(postNat)) {
            escrow.add(
              principalToAccountIdentifier(a.bucketCanisterId, toBase256(postNat, 32)),
            );
          }
          escrow.add(a.bucketCanisterId);
          const post = postById.get(a.postId);
          const n = Number(a.numberOfApplauds);
          return {
            id: `applaud-${a.applaudId}`,
            timestampMs: parseInt(a.date, 10) || 0,
            sign: a.sender === principalText ? "-" : "+",
            amount: trimE8s(a.tokenAmount),
            token: a.currency,
            target: post
              ? {
                  label: `/@${post.handle}/${post.title}`,
                  url: buildArticleUrl({
                    handle: post.handle,
                    postId: a.postId,
                    bucketCanisterId: post.bucket,
                    title: post.title,
                  }),
                }
              : { label: historyCopy.unknownArticle.replace("{postId}", a.postId) },
            description:
              n === 1
                ? historyCopy.applaudOne
                : historyCopy.applaudMany.replace("{n}", String(n)),
          };
        });
        return { rows, escrow };
      };

      // 2. Article-key marketplace buys/sales (priced rows).
      const fetchNftActivity = async () => {
        const pairs = await actors.getAllNftCanisters();
        const sellerAccounts = new Set<string>();
        const raw: Array<{
          postId: string;
          tokenIndex: number;
          supply: number;
          priceE8s: bigint;
          timeMs: number;
          sign: "+" | "-";
        }> = [];
        await Promise.all(
          pairs.map(async ([postId, nftCanisterId]) => {
            try {
              const supply = await actors.getExtSupply(nftCanisterId);
              supply.tokenSenderAccounts.forEach((acc) => sellerAccounts.add(acc));
              sellerAccounts.add(supply.sellerAccount);
              for (const tx of supply.transactions) {
                const mine = tx.buyer === myAccountId;
                const sold = tx.seller === myAccountId;
                if (!mine && !sold) continue;
                raw.push({
                  postId,
                  tokenIndex: Number(tx.token),
                  supply: Number(supply.currentSupply),
                  priceE8s: BigInt(tx.price),
                  timeMs: Number(tx.time / 1_000_000n),
                  sign: mine ? "-" : "+",
                });
              }
            } catch {
              /* canister skipped */
            }
          }),
        );

        // Hydrate article labels for the hit posts only.
        const rows: HistoryRow[] = await Promise.all(
          raw.map(async (r) => {
            let target: HistoryRow["target"] = {
              label: historyCopy.unknownArticle.replace("{postId}", r.postId),
            };
            try {
              const kp = await actors.getPostKeyProperties(r.postId);
              if (kp.__kind__ === "ok") {
                const posts = await actors.getPostsByPostIds(
                  kp.ok.bucketCanisterId,
                  [r.postId],
                  false,
                );
                const title = posts[0]?.title;
                if (title) {
                  target = {
                    label: `/@${kp.ok.handle}/${title}`,
                    url: buildArticleUrl({
                      handle: kp.ok.handle,
                      postId: r.postId,
                      bucketCanisterId: kp.ok.bucketCanisterId,
                      title,
                    }),
                  };
                }
              }
            } catch {
              /* keep fallback label */
            }
            return {
              id: `key-${r.postId}-${r.tokenIndex}-${r.timeMs}-${r.sign}`,
              timestampMs: r.timeMs,
              sign: r.sign,
              amount: trimE8s(r.priceE8s),
              token: "ICP",
              target,
              description: historyCopy.keyLabel
                .replace("{n}", String(r.tokenIndex + 1).padStart(3, "0"))
                .replace("{total}", String(r.supply)),
            };
          }),
        );
        return { rows, sellerAccounts };
      };

      // 3. ICP via the index canister. Counterparties returned for dedupe.
      const fetchIcp = async () => {
        const res = await actors.getIcpAccountTransactions(myAccountId, PAGE_FETCH);
        if (res.__kind__ !== "Ok") return [];
        return res.Ok.transactions.flatMap((t) => {
          const op = t.transaction.operation;
          if (op.__kind__ !== "Transfer") return [];
          const isDeposit = op.Transfer.to === myAccountId;
          const counterparty = isDeposit ? op.Transfer.from : op.Transfer.to;
          return [
            {
              row: {
                id: `icp-${t.id}`,
                timestampMs: t.transaction.created_at_time
                  ? Number(t.transaction.created_at_time.timestamp_nanos / 1_000_000n)
                  : 0,
                sign: isDeposit ? ("+" as const) : ("-" as const),
                amount: trimE8s(op.Transfer.amount.e8s),
                token: "ICP",
                target: { label: counterparty },
                description: isDeposit
                  ? historyCopy.deposit
                  : historyCopy.withdrawal,
              },
              counterparty,
            },
          ];
        });
      };

      // 4 + 5. NUA / ckBTC via their ICRC index canisters.
      const fetchIcrc = async (indexCanisterId: string, token: "NUA" | "ckBTC") => {
        const res = await actors.getIcrcAccountTransactions(
          indexCanisterId,
          principalText,
          PAGE_FETCH,
        );
        if (res.__kind__ !== "Ok") return [];
        return res.Ok.transactions.flatMap((t) => {
          const tr = t.transaction.transfer;
          if (!tr) return [];
          // Subscription fees ride the NUA ledger with a "sub_…" memo — those
          // movements surface as subscription rows instead (prod parity).
          if (token === "NUA" && decodeMemo(tr.memo).startsWith("sub_")) return [];
          const isDeposit = tr.to.owner.toText() === principalText;
          const counterparty = isDeposit ? tr.from.owner.toText() : tr.to.owner.toText();
          return [
            {
              row: {
                id: `${token}-${t.id}`,
                timestampMs: Number(t.transaction.timestamp / 1_000_000n),
                sign: isDeposit ? ("+" as const) : ("-" as const),
                amount: trimE8s(tr.amount),
                token,
                target: { label: counterparty },
                description: isDeposit
                  ? historyCopy.deposit
                  : historyCopy.withdrawal,
              },
              counterparty,
            },
          ];
        });
      };

      // 6. Free-NUA claims: deposits into the caller's claim subaccount on the
      // User canister (read via the NUA index).
      const fetchClaims = async () => {
        const profile = await actors.getUserByPrincipalId(principalText);
        if (profile.__kind__ !== "ok") return [];
        const subaccount = profile.ok.claimInfo.subaccount;
        if (!subaccount) return [];
        const res = await actors.getIcrcAccountTransactions(
          NUA_INDEX_CANISTER_ID,
          USER_CANISTER_ID,
          PAGE_FETCH,
          subaccount,
        );
        if (res.__kind__ !== "Ok") return [];
        return res.Ok.transactions.flatMap((t) => {
          const tr = t.transaction.transfer;
          // Keep only transfers INTO the claim subaccount (= Free NUA drops).
          // Outbound restricted spends already appear as applaud rows. The
          // index was queried for exactly this account, so a transfer whose
          // `to` is a User-canister subaccount is a deposit into it.
          if (!tr) return [];
          const intoClaim =
            tr.to.owner.toText() === USER_CANISTER_ID && !!tr.to.subaccount;
          if (!intoClaim) return [];
          return [
            {
              id: `claim-${t.id}`,
              timestampMs: Number(t.transaction.timestamp / 1_000_000n),
              sign: "+" as const,
              amount: trimE8s(tr.amount),
              token: historyCopy.freeNuaToken,
              target: { label: historyCopy.claimSource },
              description: historyCopy.claimDescription,
            },
          ];
        });
      };

      // 7. Subscriptions (reader = paid out, writer = earned in).
      const fetchSubscriptions = async () => {
        const [reader, writer] = await Promise.all([
          actors.getReaderSubscriptionDetails(),
          actors.getWriterSubscriptionDetails(),
        ]);
        const events: Array<{ out: boolean; counterparty: string; feeE8s: bigint; timeMs: number; id: string }> = [];
        if (reader.__kind__ === "ok") {
          reader.ok.readerSubscriptions.forEach((e) =>
            events.push({
              out: true,
              counterparty: e.writerPrincipalId,
              feeE8s: BigInt(e.paymentFee || "0"),
              timeMs: Number(e.startTime),
              id: e.subscriptionEventId,
            }),
          );
        }
        if (writer.__kind__ === "ok") {
          writer.ok.writerSubscriptions.forEach((e) =>
            events.push({
              out: false,
              counterparty: e.readerPrincipalId,
              feeE8s: BigInt(e.paymentFee || "0"),
              timeMs: Number(e.startTime),
              id: e.subscriptionEventId,
            }),
          );
        }
        if (events.length === 0) return [];
        const users = await actors
          .getUsersByPrincipals([...new Set(events.map((e) => e.counterparty))])
          .catch(() => []);
        const handleByPrincipal = new Map(users.map((u) => [u.principal, u.handle]));
        return events.map((e): HistoryRow => {
          const handle = handleByPrincipal.get(e.counterparty);
          return {
            id: `sub-${e.id}-${e.out ? "r" : "w"}`,
            timestampMs: e.timeMs,
            sign: e.out ? "-" : "+",
            amount: trimE8s(e.feeE8s),
            token: "NUA",
            target: { label: handle ? `/@${handle}` : e.counterparty },
            description: historyCopy.subscription,
          };
        });
      };

      // ---- run all sources, then dedupe + merge ----
      const [applauds, nft, icp, nua, ckbtc, claims, subs] = await Promise.all([
        fetchApplauds().catch(() => ({ rows: [], escrow: new Set<string>() })),
        fetchNftActivity().catch(() => ({
          rows: [],
          sellerAccounts: new Set<string>(),
        })),
        fetchIcp().catch(() => []),
        fetchIcrc(NUA_INDEX_CANISTER_ID, "NUA").catch(() => []),
        fetchIcrc(CKBTC_INDEX_CANISTER_ID, "ckBTC").catch(() => []),
        fetchClaims().catch(() => []),
        fetchSubscriptions().catch(() => []),
      ]);

      // Drop ledger rows whose counterparty is a tip escrow, an NFT seller
      // account, or a Nuance canister handling the movement elsewhere.
      const exclude = new Set<string>([
        ...applauds.escrow,
        ...nft.sellerAccounts,
        canisterIds.Subscription.ic,
        USER_CANISTER_ID,
      ]);
      const ledgerRows = [...icp, ...nua, ...ckbtc]
        .filter((e) => !exclude.has(e.counterparty))
        .map((e) => e.row);

      return [
        ...applauds.rows,
        ...nft.rows,
        ...ledgerRows,
        ...claims,
        ...subs,
      ].sort((a, b) => b.timestampMs - a.timestampMs);
    },
  });
}
