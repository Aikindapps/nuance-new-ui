import { useRef } from "react";
import { Link } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { ActivityError } from "../components/ActivityPrimitives";
import { useMyTags } from "../../home/hooks/useMyTags";
import { useUnfollowTag } from "../../article/hooks/useUnfollowTag";
import { useFollowTag } from "../../article/hooks/useFollowTag";
import { useToast } from "../../../services/toast";
import { IconClose } from "../../../components/ui/icons/IconClose";
import { IconStar } from "../../../components/ui/icons/IconStar";
import { activityTopicsCopy as c } from "../../../constants/copy";
import type { PostTagModel__1 } from "../../../candid/PostCore/PostCore";

// NIC-473 -- Activity hub Topics section (D-68): the topics the current user
// follows, as purple pills. Each pill = a link to the topic page (star +
// label; the star only shows that you follow it) plus a separate x button
// that unfollows. Renders inside the AccountShell content card that
// Activity.tsx provides. Design SS8.3: Populated 2825:3420, Empty 2826:5408,
// Loading 2827:5578, Overflow 2829:3278, Unfollow toaster 2830:5493.
//
// Data: useMyTags (["my-tags", principal]) in the order getMyTags returns
// (first-follow order; stable -- the back end flips an isActive flag in place
// on unfollow and on re-follow, so a re-followed topic keeps its position).
// useUnfollowTag removes the pill from the shared cache at click time and
// puts it back if the call fails; useFollowTag (Undo) re-inserts it at its
// old index via insertAt. Both invalidate ["my-tags"], which keeps the Home
// Following feed and the article-page topic pills in sync.
//
// Toaster: the app's standard toast (D-43 keeps the coloured toast; the
// frame's dark pill is not used). Shown once the unfollow succeeds, like the
// Following section, so Undo can never race an unfinished unfollow.

// Skeleton pill widths (design px) -- Loading frame 2827:5578.
const SKELETON_WIDTHS = [140, 180, 120, 160, 200, 150, 170, 130];

function fill(template: string, key: string, value: string): string {
  // Function form so "$" in a topic name is never read as a pattern.
  return template.replace(`{${key}}`, () => value);
}

// Title row, then the full-width 1px rule (NUR/Black/20%); 24 above and
// below it, as in every SS8.3 Topics frame.
function TopicsHeader({ count }: { count?: number }) {
  return (
    <>
      <div className="flex items-center gap-[calc(12*var(--fpx))]">
        <h1 className="text-[length:calc(28*var(--fpx))] font-semibold leading-[calc(34/28)] text-ink-80">
          {c.title}
        </h1>
        {count !== undefined && (
          <span
            aria-label={fill(c.countAriaLabel, "count", String(count))}
            className="inline-flex items-center justify-center rounded-full bg-brand-purple-10 px-[calc(10*var(--fpx))] py-[calc(3*var(--fpx))] text-[length:calc(14*var(--fpx))] font-semibold leading-[calc(17/14)] text-brand-purple"
          >
            {count}
          </span>
        )}
      </div>
      <div className="my-[calc(24*var(--fpx))] h-px w-full bg-ink-border/20" />
    </>
  );
}

function TopicsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={c.loadingAriaLabel}
      className="flex flex-wrap gap-[calc(16*var(--fpx))]"
    >
      {SKELETON_WIDTHS.map((w, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          sx={{
            width: `calc(${w} * var(--fpx))`,
            height: "calc(48 * var(--fpx))",
            borderRadius: "9999px",
            backgroundColor: "var(--color-ink-border-10)",
          }}
        />
      ))}
    </div>
  );
}

function TopicsEmpty() {
  return (
    <div className="flex flex-col items-center gap-[calc(12*var(--fpx))] py-[calc(48*var(--fpx))] text-center">
      {/* Grey placeholder glyph (48 circle, #202123 @20%) -- decorative. */}
      <div
        aria-hidden
        className="size-[calc(48*var(--fpx))] rounded-full bg-ink/20"
      />
      <p className="text-[length:calc(22*var(--fpx))] font-bold leading-[calc(32/22)] text-black">
        {c.emptyHeading}
      </p>
      <p className="text-[length:calc(16*var(--fpx))] leading-[calc(19/16)] text-ink-60">
        {c.emptyBody}
      </p>
      <Link
        to={c.emptyCtaHref}
        className="bg-brand-gradient-button inline-flex h-[calc(48*var(--fpx))] items-center justify-center rounded-card px-[calc(24*var(--fpx))] text-body font-medium text-white shadow-[var(--shadow-purple-glow-medium)] transition-opacity hover:opacity-90"
      >
        {c.emptyCtaLabel}
      </Link>
    </div>
  );
}

function TopicPill({
  tag,
  onUnfollow,
}: {
  tag: PostTagModel__1;
  onUnfollow: () => void;
}) {
  return (
    <li className="relative inline-flex h-[calc(48*var(--fpx))] min-w-0 max-w-full items-center gap-[calc(10*var(--fpx))] rounded-full bg-brand-purple-10 pl-[calc(24*var(--fpx))] pr-[calc(18*var(--fpx))]">
      {/* Star + label = the link; its ::after stretches over the whole pill
          so the pill body navigates. The x sits above it (z-index). */}
      <Link
        to={`/explore/topic/${encodeURIComponent(tag.tagName)}`}
        className="flex min-w-0 items-center gap-[calc(10*var(--fpx))] rounded-full text-brand-purple after:absolute after:inset-0 after:rounded-full after:content-[''] hover:underline"
      >
        {/* Filled star = "following" (the 4.8 glyph); every pill here is a
            followed topic. Display-only; the x is the only unfollow. */}
        <IconStar filled className="size-[calc(16*var(--fpx))] shrink-0" />
        <span className="min-w-0 truncate text-[length:calc(22*var(--fpx))] font-medium leading-[calc(27/22)]">
          {tag.tagName}
        </span>
      </Link>
      <button
        type="button"
        aria-label={fill(c.unfollowAria, "tag", tag.tagName)}
        onClick={(e) => {
          e.stopPropagation();
          onUnfollow();
        }}
        className="relative z-[1] -m-[calc(7*var(--fpx))] grid shrink-0 place-items-center rounded-full p-[calc(7*var(--fpx))] text-brand-purple/80 transition-colors hover:bg-brand-purple/10"
      >
        {/* 18px glyph per the frame; the 7px padding (cancelled by the
            negative margin) gives a 32px hit area without widening the pill. */}
        <IconClose className="size-[calc(18*var(--fpx))]" />
      </button>
    </li>
  );
}

export function TopicsSection() {
  const query = useMyTags();
  const unfollowTag = useUnfollowTag();
  const followTag = useFollowTag();
  const { show } = useToast();
  // Tags whose unfollow is in flight -- a second click on the same x is
  // ignored. Read and written only in event handlers.
  const pending = useRef<Set<string>>(new Set());

  const tags = query.data;

  // Error only when there is nothing to show; a failed background refetch
  // keeps the list on screen.
  if (query.isError && tags === undefined) {
    return (
      <>
        <TopicsHeader />
        <ActivityError
          title={c.errorTitle}
          body={c.errorBody}
          retryLabel={c.retryLabel}
          onRetry={() => void query.refetch()}
        />
      </>
    );
  }

  // Loading: header shows at once, count badge hidden.
  if (tags === undefined) {
    return (
      <>
        <TopicsHeader />
        <TopicsLoading />
      </>
    );
  }

  if (tags.length === 0) {
    return (
      <>
        <TopicsHeader />
        <TopicsEmpty />
      </>
    );
  }

  const handleUnfollow = (tag: PostTagModel__1, index: number) => {
    if (pending.current.has(tag.tagId)) return;
    pending.current.add(tag.tagId);
    const plain = { tagId: tag.tagId, tagName: tag.tagName };

    unfollowTag
      .mutateAsync(plain)
      .then(() => {
        show(fill(c.unfollowed, "tag", tag.tagName), "success", {
          actionLabel: c.undoLabel,
          onAction: () => {
            followTag.mutateAsync({ ...plain, insertAt: index }).catch(() => {
              // useFollowTag already rolled the cache back.
              show(fill(c.refollowError, "tag", tag.tagName), "error");
            });
          },
        });
      })
      .catch(() => {
        // useUnfollowTag already put the pill (and the count) back.
        show(fill(c.unfollowError, "tag", tag.tagName), "error");
      })
      .finally(() => {
        pending.current.delete(tag.tagId);
      });
  };

  return (
    <>
      <TopicsHeader count={tags.length} />
      <ul
        role="list"
        aria-label={c.listAriaLabel}
        className="flex flex-wrap gap-[calc(16*var(--fpx))]"
      >
        {tags.map((tag, index) => (
          <TopicPill
            key={tag.tagId}
            tag={tag}
            onUnfollow={() => handleUnfollow(tag, index)}
          />
        ))}
      </ul>
    </>
  );
}

export default TopicsSection;
