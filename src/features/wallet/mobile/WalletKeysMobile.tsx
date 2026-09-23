import { useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { articleKeysCopy } from "../../../constants/copy";
import { walletMobileCopy } from "./walletMobileCopy";
import { useModal } from "../../../services/modal";
import { IconShare } from "../../../components/ui/icons/IconShare";
import {
  useArticleKeys,
  type ArticleKey,
} from "../keys/useArticleKeys";
import {
  TransferKeyModal,
  TRANSFER_KEY_TITLE_ID,
} from "../keys/TransferKeyModal";

const INERT = {
  "aria-disabled": true as const,
  title: articleKeysCopy.comingSoon,
};

// Frame 2423:4917 shows 6 rows above the "Show more" link.
const VISIBLE_KEYS = 6;
const SKELETON_ROWS = 3;

const BLOCK_CLASS = [
  "flex flex-col gap-4",
  "rounded-[calc(16*var(--fpx))]",
  "border border-ink-border-10 px-4 py-6",
].join(" ");

const LINK_CLASS =
  "min-w-0 truncate text-body text-brand-purple underline";

const ACTION_CLASS = [
  "flex size-[calc(32*var(--fpx))] shrink-0",
  "items-center justify-center rounded text-brand-purple",
  "transition-colors hover:bg-brand-purple-5",
].join(" ");

const INPUT_CLASS = [
  "h-[calc(48*var(--fpx))] w-full cursor-not-allowed",
  "rounded-[calc(6*var(--fpx))] border",
  "border-ink-border-10 bg-ink-border-5 px-4 text-body",
  "italic text-ink-60 focus:outline-none",
].join(" ");

const SKELETON_BAR =
  "h-4 animate-pulse rounded-[8px] bg-ink-border/10";

const SHOW_MORE_CLASS =
  "self-start text-body text-brand-purple underline";

function keyLabel(k: ArticleKey): string {
  const n = String(k.keyNumber).padStart(3, "0");
  return k.totalSupply != null
    ? articleKeysCopy.keyLabel
        .replace("{n}", n)
        .replace("{total}", String(k.totalSupply))
    : articleKeysCopy.keyLabelNoSupply.replace("{n}", n);
}

// Phone article keys (Figma 2419:4829). The desktop row puts the
// article link, a fixed-width key label and the transfer button on
// one line, which does not fit at 361px -- here the link sits on its
// own line, with the label + transfer action stacked beneath it
// (Figma 2419:4829). Reimplemented (not imported) since
// ArticleKeys.tsx cannot be safely edited under our diff transport.
export function WalletKeysMobile() {
  const keys = useArticleKeys();
  const modal = useModal();
  const c = articleKeysCopy;
  const [expanded, setExpanded] = useState(false);

  const openTransfer = (articleKey: ArticleKey) =>
    modal.open(
      <TransferKeyModal
        articleKey={articleKey}
        onClose={modal.close}
      />,
      { ariaLabelledBy: TRANSFER_KEY_TITLE_ID },
    );

  const count = keys.data?.length ?? null;
  const all = keys.data ?? [];
  const visible = expanded ? all : all.slice(0, VISIBLE_KEYS);
  const hasMore = !expanded && all.length > VISIBLE_KEYS;
  const isEmpty = keys.data != null && keys.data.length === 0;

  const headingWrapClass =
    "flex flex-col gap-[calc(8*var(--fpx))] text-ink-80";
  const bodyClass =
    "text-label leading-[var(--text-label--line-height)]";

  return (
    <section className="flex flex-col gap-[calc(24*var(--fpx))]">
      <div className={headingWrapClass}>
        <h2 className="text-lg font-bold text-ink-80">{c.heading}</h2>
        <p className={bodyClass}>
          {c.body}
        </p>
      </div>

      <div className={BLOCK_CLASS}>
        {keys.isPending ? (
          <div aria-busy="true" className="flex flex-col gap-4">
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <div
                key={i}
                aria-hidden
                className="flex flex-col gap-2"
              >
                <span className={`w-4/5 ${SKELETON_BAR}`} />
                <span className={`w-2/5 ${SKELETON_BAR}`} />
              </div>
            ))}
          </div>
        ) : (
          <Fragment>
            {isEmpty ? (
              <div className="flex flex-col gap-1 py-2 text-center">
                <p className="text-lg font-bold text-ink">
                  {walletMobileCopy.keysEmpty}
                </p>
                <p className="text-body text-ink-60">
                  {walletMobileCopy.keysEmptyBody}
                </p>
              </div>
            ) : (
              <p className="pb-2 text-lg font-bold text-ink">
                {keys.isError
                  ? c.loadError
                  : count == null
                    ? "\u2026"
                    : count === 1
                      ? c.countOne
                      : c.count.replace("{n}", String(count))}
              </p>
            )}

            {visible.map((k, i) => (
              <Fragment key={`${k.nftCanisterId}-${k.tokenIndex}`}>
                <div className="flex flex-col gap-2">
                  {k.url ? (
                    <Link to={k.url} className={LINK_CLASS}>
                      {`/@${k.handle}/${k.title}`}
                    </Link>
                  ) : (
                    <span
                      className="min-w-0 truncate text-body text-ink-80"
                    >
                      {c.unknownArticle.replace("{postId}", k.postId)}
                    </span>
                  )}
                  <div
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-body text-ink">
                      {keyLabel(k)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openTransfer(k)}
                      aria-label={c.transferAria}
                      className={ACTION_CLASS}
                    >
                      <IconShare
                        className="size-[calc(24*var(--fpx))]"
                      />
                    </button>
                  </div>
                </div>
                {i < visible.length - 1 && (
                  <div className="h-px w-full bg-ink-border-5" />
                )}
              </Fragment>
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={SHOW_MORE_CLASS}
              >
                {walletMobileCopy.showMore}
              </button>
            )}
          </Fragment>
        )}

        {/* Resold-key claim -- inert stub, always present (no
            canister surface exists for claim-by-code). */}
        <div className="flex flex-col gap-[calc(6*var(--fpx))] pt-4">
          <p className="text-label font-bold text-ink">
            {c.resoldLabel}
          </p>
          <input
            type="text"
            readOnly
            {...INERT}
            placeholder={c.resoldPlaceholder}
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </section>
  );
}
