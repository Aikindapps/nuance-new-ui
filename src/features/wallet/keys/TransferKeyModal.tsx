import { useMemo, useState } from "react";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Popup } from "../../../components/ui/Popup";
import { useActors } from "../../../contexts/useActors";
import { useAuth } from "../../../contexts/useAuth";
import { articleKeysCopy } from "../../../constants/copy";
import {
  accountIdBytesFromHex,
  principalToAccountIdentifier,
} from "../../../lib/accountIdentifier";
import { extTokenIdentifier } from "../../../lib/extTokenId";
import type { ArticleKey } from "./useArticleKeys";

export const TRANSFER_KEY_TITLE_ID = "transfer-key-modal-title";

function extErrText(err: { __kind__?: string; Other?: string }): string {
  switch (err?.__kind__) {
    case "InsufficientBalance":
      return "This wallet no longer holds that key.";
    case "Unauthorized":
      return "This wallet isn’t authorized to move that key.";
    case "InvalidToken":
      return "That key no longer exists.";
    case "Rejected":
      return "The NFT canister rejected the transfer.";
    case "Other":
      return err.Other ?? "Transfer failed.";
    default:
      return "Transfer failed.";
  }
}

// Transfer an article key to another wallet (prod parity: transfer-nft-modal →
// ext_transfer). EXT addresses are account-id hex; a principal receiver is
// converted to its default account id. Modal content renders above
// ToastProvider — feedback is inline + a success page, never a toast.
export function TransferKeyModal({
  articleKey,
  onClose,
}: {
  articleKey: ArticleKey;
  onClose: () => void;
}) {
  const { transferExtToken } = useActors();
  const { principal } = useAuth();
  const queryClient = useQueryClient();

  const [receiver, setReceiver] = useState("");
  const [terms, setTerms] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const c = articleKeysCopy;
  const principalText = principal?.toText() ?? "";
  const myAccountId = useMemo(
    () => (principalText ? principalToAccountIdentifier(principalText) : ""),
    [principalText],
  );

  // Resolve the receiver to an account-id hex: 64-hex passes through
  // (checksum-validated), a principal converts to its default account.
  const receiverTrimmed = receiver.trim();
  const receiverAccountId = useMemo(() => {
    if (!receiverTrimmed) return null;
    if (accountIdBytesFromHex(receiverTrimmed)) {
      return receiverTrimmed.toLowerCase();
    }
    try {
      if (Principal.fromText(receiverTrimmed).toText() === receiverTrimmed) {
        return principalToAccountIdentifier(receiverTrimmed);
      }
    } catch {
      /* not a principal */
    }
    return null;
  }, [receiverTrimmed]);

  const isSelf = receiverAccountId != null && receiverAccountId === myAccountId;
  const valid = receiverAccountId != null && !isSelf && terms;

  const transfer = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!receiverAccountId) throw new Error(c.transferErrorReceiver);
      const res = await transferExtToken(articleKey.nftCanisterId, {
        to: { __kind__: "address", address: receiverAccountId },
        from: { __kind__: "address", address: myAccountId },
        token: extTokenIdentifier(articleKey.nftCanisterId, articleKey.tokenIndex),
        amount: 1n,
        memo: new Uint8Array(0),
        notify: false,
      });
      if (res.__kind__ === "err") throw new Error(extErrText(res.err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-keys"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-history"] });
      setDone(true);
    },
    onError: (e) => setError(e.message),
  });

  const keyName = c.keyLabelNoSupply.replace(
    "{n}",
    String(articleKey.keyNumber).padStart(3, "0"),
  );

  if (done) {
    return (
      <Popup
        titleId={TRANSFER_KEY_TITLE_ID}
        title={c.transferSuccessTitle}
        onClose={onClose}
        closeAriaLabel={c.closeAria}
        footer={
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-gradient-button flex h-12 items-center justify-center rounded-card px-6 text-body font-medium text-white shadow-purple-glow-medium"
          >
            {c.transferSuccessClose}
          </button>
        }
      >
        <p className="mt-6 text-body text-ink">
          <strong>{keyName}</strong> {c.transferSuccessBody}
        </p>
      </Popup>
    );
  }

  return (
    <Popup
      titleId={TRANSFER_KEY_TITLE_ID}
      title={c.transferTitle}
      onClose={onClose}
      closeAriaLabel={c.closeAria}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-card border border-brand-purple bg-white px-6 text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple-5"
          >
            {c.transferCancel}
          </button>
          <button
            type="button"
            disabled={!valid || transfer.isPending}
            onClick={() => {
              setError(null);
              transfer.mutate();
            }}
            className="bg-brand-gradient-button flex h-12 items-center justify-center rounded-card px-6 text-body font-medium text-white shadow-purple-glow-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            {transfer.isPending ? c.transferring : c.transferLabel}
          </button>
        </>
      }
    >
      <div className="mt-6 flex flex-col gap-6">
        <p className="text-body text-ink-80">{c.transferBody}</p>

        <div className="rounded-card border border-ink-border-10 px-4 py-3">
          <p className="text-body font-medium text-ink">
            {articleKey.title ??
              c.unknownArticle.replace("{postId}", articleKey.postId)}
          </p>
          <p className="text-label text-ink-60">{keyName}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="transfer-key-receiver"
            className="text-label font-bold text-ink"
          >
            {c.transferReceiverLabel}
          </label>
          <input
            id="transfer-key-receiver"
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={receiver}
            placeholder={c.transferReceiverPlaceholder}
            onChange={(e) => setReceiver(e.target.value)}
            aria-invalid={!!receiverTrimmed && (receiverAccountId == null || isSelf)}
            aria-describedby="transfer-key-receiver-error"
            className="rounded-card border border-ink-border-10 bg-ink-border-5 px-4 py-3 text-body text-ink focus:border-brand-purple focus:outline-none"
          />
          <p
            id="transfer-key-receiver-error"
            className="text-label text-error empty:hidden"
          >
            {receiverTrimmed && receiverAccountId == null
              ? c.transferErrorReceiver
              : isSelf
                ? c.transferErrorSelf
                : null}
          </p>
        </div>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1 size-4 accent-[var(--color-brand-purple)]"
          />
          <span className="text-label text-ink-80">{c.transferTerms}</span>
        </label>

        {error && <p className="text-label text-error">{error}</p>}
      </div>
    </Popup>
  );
}
