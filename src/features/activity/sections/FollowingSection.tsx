import { useState } from "react";
import {
  ActivityLoading,
  ActivityError,
  ActivityEmpty,
  ShowMoreButton,
  ActivityUserRow,
  ActivityRowDivider,
} from "../components/ActivityPrimitives";
import { useMyFollows } from "../../following/hooks/useMyFollows";
import { useUnfollowAuthor } from "../../article/hooks/useUnfollowAuthor";
import { useFollowAuthor } from "../../article/hooks/useFollowAuthor";
import { useToast } from "../../../services/toast";
import { formatCount } from "../../../lib/formatCount";
import { followingCopy as c } from "../../../constants/copy";
import type { UserListItem } from "../../../candid/User/User";

// NIC-354 - Activity hub Following section (writers + publications the current
// user follows, combined into one list). Each row carries a "Following"
// secondary-outlined button; clicking it unfollows with an optimistic remove +
// Undo toaster + stash-on-undo + onError-revert, ported verbatim from
// src/routes/FollowingManage.tsx (handleUnfollowAuthor). Renders inside the
// AccountShell content card that Activity.tsx provides, so this is inner
// content only. Design SS8.3 canonical `1734:4704`; Following + unfollow
// toaster `1734:5140`.

const INITIAL_VISIBLE = 10;
const PAGE_SIZE = 10;

type FollowItem = { user: UserListItem; isPublication: boolean };

// Per-row unfollow toggle. The user is (by construction) already followed here,
// so the button reads "Following"; clicking it unfollows. Visual mirrors the
// SS8.3 secondary-outlined button (#5405d4 1.5px stroke, radius 8) - the same
// component FollowingManage uses.
function UnfollowButton({
  handle,
  onClick,
}: {
  handle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Unfollow @${handle}`}
      className="shrink-0 rounded-card border-[1.5px] border-brand-purple bg-white px-[calc(22*var(--fpx))] py-[calc(12*var(--fpx))] text-[length:calc(16*var(--fpx))] font-semibold leading-[calc(19/16)] text-brand-purple transition-colors hover:bg-brand-purple/5"
    >
      {c.followingLabel}
    </button>
  );
}

function subLineFor(item: FollowItem): string {
  if (!item.isPublication) return `@${item.user.handle}`;
  // Publications: "<category> \u00b7 <readers> readers" (category = first line of
  // bio), mirroring FollowingManage's AuthorRow. formatCount already emits the
  // unit ("128K"), so no literal "k" suffix. The middle dot is written as the
  // \u00b7 escape to keep the source pure ASCII.
  const category = item.user.bio ? item.user.bio.split("\n")[0].trim() : "";
  const readers = formatCount(item.user.followersCount);
  return category
    ? `${category} \u00b7 ${readers} ${c.readersLabel}`
    : `${readers} ${c.readersLabel}`;
}

export function FollowingSection() {
  const { writers, publications, isLoading, isError, refetch } = useMyFollows();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  // Optimistic removal set (lowercased handles) - cleared on Undo / revert.
  const [removedHandles, setRemovedHandles] = useState<Set<string>>(new Set());
  // Stash removed items so a row stays visible on Undo until the re-follow
  // refetch re-adds it to writers/publications (FollowingManage Fix #3).
  const [undoneUsers, setUndoneUsers] = useState<Map<string, FollowItem>>(
    new Map(),
  );

  const unfollowAuthor = useUnfollowAuthor();
  const followAuthor = useFollowAuthor();
  const { show } = useToast();

  if (isLoading) return <ActivityLoading />;

  if (isError) {
    return (
      <ActivityError
        title={c.errorTitle}
        body={c.errorBody}
        retryLabel={c.retryLabel}
        onRetry={() => refetch()}
      />
    );
  }

  // Combine writers + publications into one list (writers first, then pubs).
  const combined: FollowItem[] = [
    ...writers.map((user) => ({ user, isPublication: false })),
    ...publications.map((user) => ({ user, isPublication: true })),
  ];

  // Live query minus optimistically removed, then re-add stashed (undone)
  // items not yet reflected by the query (FollowingManage fromQuery + fromStash).
  const fromQuery = combined.filter(
    (i) => !removedHandles.has(i.user.handle.toLowerCase()),
  );
  const liveHandles = new Set(fromQuery.map((i) => i.user.handle.toLowerCase()));
  const fromStash = [...undoneUsers.values()].filter(
    (i) =>
      !removedHandles.has(i.user.handle.toLowerCase()) &&
      !liveHandles.has(i.user.handle.toLowerCase()),
  );
  const filtered = [...fromQuery, ...fromStash];

  if (filtered.length === 0) {
    return (
      <ActivityEmpty
        heading={c.emptyHeading}
        body={c.emptyBody}
        ctaLabel={c.emptyCtaLabel}
        ctaHref={c.emptyCtaHref}
      />
    );
  }

  const slice = filtered.slice(0, visible);

  const handleUnfollow = (user: UserListItem, isPublication: boolean) => {
    const lc = user.handle.toLowerCase();
    // Optimistic removal + stash for Undo.
    setRemovedHandles((prev) => new Set([...prev, lc]));
    setUndoneUsers((prev) => new Map([...prev, [lc, { user, isPublication }]]));

    unfollowAuthor.mutate(user.handle, {
      onSuccess: () => {
        show(c.unfollowedAuthor.replace("{handle}", user.handle), "success", {
          actionLabel: c.undoLabel,
          onAction: () => {
            // Undo: clear from removed set (stash keeps the row visible) +
            // re-follow.
            setRemovedHandles((prev) => {
              const next = new Set(prev);
              next.delete(lc);
              return next;
            });
            followAuthor.mutate(user.handle);
          },
        });
      },
      onError: (err) => {
        // Revert optimistic removal + drop stash.
        setRemovedHandles((prev) => {
          const next = new Set(prev);
          next.delete(lc);
          return next;
        });
        setUndoneUsers((prev) => {
          const next = new Map(prev);
          next.delete(lc);
          return next;
        });
        show(
          c.unfollowError.replace("{handle}", user.handle) +
            (err?.message ? ` (${err.message})` : ""),
          "error",
        );
      },
    });
  };

  return (
    <div role="list" aria-label={c.listAriaLabel}>
      {slice.map((item, idx) => (
        <div key={item.user.handle} role="listitem">
          {idx > 0 && <ActivityRowDivider />}
          <ActivityUserRow
            user={item.user}
            isPublication={item.isPublication}
            subLine={subLineFor(item)}
            right={
              <UnfollowButton
                handle={item.user.handle}
                onClick={() => handleUnfollow(item.user, item.isPublication)}
              />
            }
          />
        </div>
      ))}
      {filtered.length > visible && (
        <ShowMoreButton
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          label={c.showMore}
        />
      )}
    </div>
  );
}

export default FollowingSection;
