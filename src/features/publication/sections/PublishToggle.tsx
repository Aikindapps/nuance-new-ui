import { manageArticlesCopy } from "../../../constants/copy";
import { usePublishToggle } from "../hooks/usePublishToggle";
import type { ManageArticleRow } from "../hooks/useManageArticles";

type Props = {
  handle: string;
  row: ManageArticleRow;
};

// Live cell — toggle switch or NFT badge.
//
// NFT rows (article.hasNft === true): display-only badge; no mutation.
// All other rows: toggle switch mapping Live ON <-> isDraft:false (published).
//
// Touch target is met via the outer <button>'s min-h/min-w [44px] wrapper
// containing the smaller visual track (h-6 w-11).
export function PublishToggle({ handle, row }: Props) {
  const mutation = usePublishToggle();

  if (row.article.hasNft) {
    return (
      <span
        className="inline-flex items-center rounded-card border border-brand-purple px-2 py-0.5 text-xs font-medium text-brand-purple"
        aria-label={manageArticlesCopy.nftBadge}
      >
        {manageArticlesCopy.nftBadge}
      </span>
    );
  }

  // Live ON = published = isDraft:false.
  const isPublished = !row.isDraft;
  const isPending =
    mutation.isPending && mutation.variables?.postId === row.postId;

  const handleClick = () => {
    if (isPending) return;
    mutation.mutate({
      handle,
      bucketCanisterId: row.bucketCanisterId,
      postId: row.postId,
      newIsDraft: !row.isDraft,
    });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPublished}
      aria-label={
        isPublished
          ? manageArticlesCopy.toggleAriaUnpublish
          : manageArticlesCopy.toggleAriaPublish
      }
      onClick={handleClick}
      disabled={isPending}
      className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
    >
      {/* Visual track + sliding thumb */}
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          isPublished ? "bg-brand-purple" : "bg-ink-border/20"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            isPublished ? "left-1 translate-x-5" : "left-1 translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
