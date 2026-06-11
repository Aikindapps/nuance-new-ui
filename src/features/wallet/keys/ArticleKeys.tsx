import { Fragment } from "react";
import { Link } from "react-router-dom";
import { articleKeysCopy } from "../../../constants/copy";
import { useModal } from "../../../services/modal";
import { IconShare } from "../../../components/ui/icons/IconShare";
import { useArticleKeys, type ArticleKey } from "./useArticleKeys";
import { TransferKeyModal, TRANSFER_KEY_TITLE_ID } from "./TransferKeyModal";

const INERT = {
  "aria-disabled": true as const,
  title: articleKeysCopy.comingSoon,
};

function keyLabel(k: ArticleKey): string {
  const n = String(k.keyNumber).padStart(3, "0");
  return k.totalSupply != null
    ? articleKeysCopy.keyLabel
        .replace("{n}", n)
        .replace("{total}", String(k.totalSupply))
    : articleKeysCopy.keyLabelNoSupply.replace("{n}", n);
}

// Article keys (Figma 1:46454): the caller's premium-article NFT keys in a
// bordered card — count headline, one row per key (article link · "Key #042
// (of 50)" · transfer button), and the resold-key claim input. The input is a
// decision #26-style inert stub: no canister surface exists for claim-by-code
// (decision #43 sub-decision 6). The row's share-glyph button opens the
// transfer-key modal (prod parity — moving a key IS how access is shared).
export function ArticleKeys() {
  const keys = useArticleKeys();
  const modal = useModal();
  const c = articleKeysCopy;

  const openTransfer = (articleKey: ArticleKey) =>
    modal.open(
      <TransferKeyModal articleKey={articleKey} onClose={modal.close} />,
      { ariaLabelledBy: TRANSFER_KEY_TITLE_ID },
    );

  const count = keys.data?.length ?? null;

  return (
    <section className="flex flex-col gap-[calc(24*var(--fpx))]">
      <div className="flex flex-col gap-[calc(8*var(--fpx))] text-ink-80">
        <h2 className="text-lg font-bold text-ink-80">{c.heading}</h2>
        <p className="text-label leading-[var(--text-label--line-height)]">
          {c.body}
        </p>
      </div>

      <div className="flex flex-col gap-[calc(16*var(--fpx))] rounded-[calc(16*var(--fpx))] border border-ink-border-10 px-[calc(40*var(--fpx))] py-[calc(32*var(--fpx))]">
        <p className="pb-[calc(8*var(--fpx))] text-lg font-bold text-ink">
          {keys.isError
            ? c.loadError
            : count == null
              ? "…"
              : count === 1
                ? c.countOne
                : c.count.replace("{n}", String(count))}
        </p>

        {(keys.data ?? []).map((k) => (
          <Fragment key={`${k.nftCanisterId}-${k.tokenIndex}`}>
            <div className="flex items-center justify-between gap-[calc(16*var(--fpx))]">
              {k.url ? (
                <Link
                  to={k.url}
                  className="min-w-0 flex-1 truncate text-body text-brand-purple underline"
                >
                  {`/@${k.handle}/${k.title}`}
                </Link>
              ) : (
                <span className="min-w-0 flex-1 truncate text-body text-ink-80">
                  {c.unknownArticle.replace("{postId}", k.postId)}
                </span>
              )}
              <span className="w-[calc(152*var(--fpx))] shrink-0 text-body text-ink">
                {keyLabel(k)}
              </span>
              <button
                type="button"
                onClick={() => openTransfer(k)}
                aria-label={c.transferAria}
                className="flex size-[calc(32*var(--fpx))] shrink-0 items-center justify-center rounded text-brand-purple transition-colors hover:bg-brand-purple-5"
              >
                <IconShare className="size-[calc(24*var(--fpx))]" />
              </button>
            </div>
            <div className="h-px w-full bg-ink-border-5 last:hidden" />
          </Fragment>
        ))}

        {/* Resold-key claim — inert stub (no canister surface; decision #43). */}
        <div className="flex flex-col gap-[calc(6*var(--fpx))] pt-[calc(16*var(--fpx))]">
          <p className="text-label font-bold text-ink">{c.resoldLabel}</p>
          <input
            type="text"
            readOnly
            {...INERT}
            placeholder={c.resoldPlaceholder}
            className="h-[calc(48*var(--fpx))] cursor-not-allowed rounded-[calc(6*var(--fpx))] border border-ink-border-10 bg-ink-border-5 px-4 text-body italic text-ink-60 focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
}
