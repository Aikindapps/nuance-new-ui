import { useState } from "react";
import {
  ActivityLoading,
  ActivityError,
  ActivityEmpty,
  ShowMoreButton,
  ActivityUserRow,
  ActivityRowDivider,
} from "../components/ActivityPrimitives";
import { useMyFollowers } from "../hooks/useMyFollowers";
import { useIsFollowing } from "../../../lib/useIsFollowing";
import { useFollowAuthor } from "../../article/hooks/useFollowAuthor";
import { useUnfollowAuthor } from "../../article/hooks/useUnfollowAuthor";
import { useToast } from "../../../services/toast";
import { followersCopy as c } from "../../../constants/copy";

// NIC-359 / NIC-372 — the Followers section (people who follow the current
// user). Renders inside the AccountShell content card that Activity.tsx
// provides, so this is inner content only. §8.3 frames desktop `1735:4335` /
// `1735:6781`, phone `1739:2830`.

const INITIAL_VISIBLE = 10;
const PAGE_SIZE = 10;

// Per-row secondary-outlined follow toggle. The label follows the caller's
// live follow relationship with this handle: "Follow back" when not following,
// "Following" when already following. The optimistic label swap and the
// error revert are automatic — useFollowAuthor / useUnfollowAuthor patch the
// shared ["my-profile"] cache that useIsFollowing reads, and roll it back on
// error — so no extra optimistic state lives here. Visual mirrors the §8.3
// secondary button (#5405d4 1.5px stroke, radius 8).
function FollowBackButton({ handle }: { handle: string }) {
  const state = useIsFollowing(handle);
  const followMutation = useFollowAuthor();
  const unfollowMutation = useUnfollowAuthor();
  const { show } = useToast();

  const isPending = followMutation.isPending || unfollowMutation.isPending;
  const isFollowing = state === "following";

  let label: string;
  if (isPending) {
    label = isFollowing ? c.unfollowingLabel : c.followingProgressLabel;
  } else if (isFollowing) {
    label = c.followingLabel;
  } else {
    label = c.followBackLabel;
  }

  const onClick = () => {
    if (isPending || state === "unknown") return;
    if (isFollowing) {
      unfollowMutation.mutate(handle, {
        onSuccess: () => show(`Unfollowed @${handle}`, "success"),
        onError: (err) => show(err.message || "Could not unfollow", "error"),
      });
    } else {
      followMutation.mutate(handle, {
        onSuccess: () => show(`Following @${handle}`, "success"),
        onError: (err) => show(err.message || "Could not follow", "error"),
      });
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending || state === "unknown"}
      aria-label={isFollowing ? `Unfollow @${handle}` : `Follow @${handle}`}
      className="shrink-0 rounded-card border-[1.5px] border-brand-purple bg-white px-[calc(22*var(--fpx))] py-[calc(12*var(--fpx))] text-[length:calc(16*var(--fpx))] font-semibold leading-[calc(19/16)] text-brand-purple transition-colors hover:bg-brand-purple/5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export function FollowersSection() {
  const { data, isLoading, isError, refetch } = useMyFollowers();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  if (isLoading) return <ActivityLoading />;

  if (isError) {
    return (
      <ActivityError
        title={c.errorTitle}
        body={c.errorBody}
        retryLabel={c.retryLabel}
        onRetry={() => void refetch()}
      />
    );
  }

  const followers = data ?? [];
  if (followers.length === 0) {
    return <ActivityEmpty heading={c.emptyHeading} body={c.emptyBody} />;
  }

  const slice = followers.slice(0, visible);

  return (
    <div role="list" aria-label={c.listAriaLabel}>
      {slice.map((user, idx) => (
        <div key={user.handle} role="listitem">
          {idx > 0 && <ActivityRowDivider />}
          <ActivityUserRow
            user={user}
            subLine={`@${user.handle}`}
            right={<FollowBackButton handle={user.handle} />}
          />
        </div>
      ))}
      {followers.length > visible && (
        <ShowMoreButton
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          label={c.showMore}
        />
      )}
    </div>
  );
}

export default FollowersSection;
