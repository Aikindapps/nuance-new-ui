import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { useAuth } from "../contexts/useAuth";
import { PageShell, CenteredMessage } from "../components/ui/CenteredMessage";
import { Avatar } from "../components/ui/Avatar";
import { useMyTags } from "../features/home/hooks/useMyTags";
import { useMyFollows } from "../features/following/hooks/useMyFollows";
import { useUnfollowAuthor } from "../features/article/hooks/useUnfollowAuthor";
import { useFollowAuthor } from "../features/article/hooks/useFollowAuthor";
import { useUnfollowTag } from "../features/article/hooks/useUnfollowTag";
import { useFollowTag } from "../features/article/hooks/useFollowTag";
import { useToast } from "../services/toast";
import { followingManageCopy as c } from "../constants/copy";
import { formatCount } from "../lib/formatCount";
import type { UserListItem } from "../candid/User/User";
import type { PostTagModel__1 } from "../candid/PostCore/PostCore";

// NIC-173 — /following/manage
// Reader Following management surface: 3-group tab view (Topics / Writers /
// Publications) with optimistic unfollow + Undo toaster.

type Tab = "topics" | "writers" | "publications";

const INITIAL_VISIBLE = 10;
const PAGE_SIZE = 10;

// ── Tab bar ────────────────────────────────────────────────────────────────

type TabBarProps = {
  active: Tab;
  onSelect: (t: Tab) => void;
  topicsCount: number;
  writersCount: number;
  publicationsCount: number;
};

function FollowingTabBar({
  active,
  onSelect,
  topicsCount,
  writersCount,
  publicationsCount,
}: TabBarProps) {
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "topics", label: c.tabTopics, count: topicsCount },
    { id: "writers", label: c.tabWriters, count: writersCount },
    { id: "publications", label: c.tabPublications, count: publicationsCount },
  ];

  return (
    <div className="flex flex-col">
      <div
        role="tablist"
        aria-label="Following groups"
        className="flex items-center gap-[calc(40*var(--fpx))]"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(tab.id)}
              className={[
                "relative flex flex-col items-start gap-[calc(14*var(--fpx))] pb-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Label row */}
              <span className="flex items-center gap-2">
                <span
                  className={[
                    "text-[length:calc(18*var(--fpx))] font-semibold leading-[calc(22/18)]",
                    isActive ? "text-brand-purple" : "text-ink/60",
                  ].join(" ")}
                >
                  {tab.label}
                </span>
                {/* Count badge */}
                <span
                  className={[
                    "inline-flex items-center justify-center rounded-full px-2 py-px text-[length:calc(14*var(--fpx))] font-semibold leading-[calc(17/14)]",
                    isActive
                      ? "bg-brand-purple/10 text-brand-purple"
                      : "bg-ink/[0.06] text-ink/50",
                  ].join(" ")}
                >
                  {tab.count}
                </span>
              </span>
              {/* Active underline bar */}
              <span
                aria-hidden
                className={[
                  "absolute bottom-0 left-0 h-[3px] rounded-[2px] transition-all",
                  isActive ? "w-full bg-brand-purple/60" : "w-px bg-transparent",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>
      {/* Full-width divider below the tab list */}
      <div className="mt-0 h-px w-full bg-[#373A49]/20" />
    </div>
  );
}

// ── Following button ───────────────────────────────────────────────────────
// Fix #4: aria-label per handle; Fix #5: border-[1.5px]; Fix #6: rounded-card

type FollowingButtonProps = {
  onClick: () => void;
  handle: string;
};

function FollowingButton({ onClick, handle }: FollowingButtonProps) {
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

// ── Topics group ───────────────────────────────────────────────────────────

type TopicsGroupProps = {
  tags: PostTagModel__1[];
  removedIds: Set<string>;
  onUnfollow: (tag: PostTagModel__1) => void;
};

function TopicsGroup({ tags, removedIds, onUnfollow }: TopicsGroupProps) {
  const visible = tags.filter((t) => !removedIds.has(t.tagId));

  if (visible.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[length:calc(18*var(--fpx))] font-semibold text-ink">
          {c.topicsEmptyHeading}
        </p>
        <p className="mt-2 text-[length:calc(16*var(--fpx))] text-ink-80">
          {c.topicsEmptyBody}
        </p>
        <Link
          to={c.topicsEmptyCtaHref}
          className="mt-4 inline-block text-[length:calc(16*var(--fpx))] font-medium text-brand-purple underline underline-offset-2 hover:no-underline"
        >
          {c.topicsEmptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-[calc(16*var(--fpx))]"
      role="list"
      aria-label={c.tabTopics}
    >
      {visible.map((tag) => (
        <div
          key={tag.tagId}
          role="listitem"
          className="inline-flex h-[calc(48*var(--fpx))] items-center gap-[calc(10*var(--fpx))] rounded-full bg-brand-purple/10 pl-[calc(24*var(--fpx))] pr-[calc(18*var(--fpx))]"
        >
          {/* Star (following indicator) */}
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0 text-brand-purple"
          >
            <path
              d="M8 1.5l1.854 3.756 4.146.603-3 2.924.708 4.127L8 10.75l-3.708 1.96.708-4.127-3-2.924 4.146-.603L8 1.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          {/* Tag name */}
          <span className="text-[length:calc(22*var(--fpx))] font-medium leading-[calc(27/22)] text-brand-purple">
            {tag.tagName}
          </span>
          {/* Fix #7: 44px touch target on ✕ button; Fix #4: aria-label per tag */}
          <button
            type="button"
            aria-label={`Unfollow ${tag.tagName}`}
            onClick={() => onUnfollow(tag)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-[length:calc(18*var(--fpx))] font-medium leading-[calc(22/18)] text-brand-purple/80 transition-opacity hover:opacity-60"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Writer/Publication row ─────────────────────────────────────────────────

type AuthorRowProps = {
  user: UserListItem;
  isPublication?: boolean;
  onUnfollow: (user: UserListItem) => void;
};

function AuthorRow({ user, isPublication = false, onUnfollow }: AuthorRowProps) {
  const name = user.displayName || user.handle;
  const profilePath = isPublication
    ? `/publication/${user.handle.toLowerCase()}`
    : `/${user.handle.toLowerCase()}`;

  // Fix #1: formatCount already emits the unit ("128K") — no literal "k" suffix.
  // Design: "Weekly tech · 128k readers" where formatCount(128000) = "128K".
  let subText: string;
  if (isPublication) {
    const category = user.bio ? user.bio.split("\n")[0].trim() : "";
    const readers = formatCount(user.followersCount);
    subText = category
      ? `${category} · ${readers} ${c.readersLabel}`
      : `${readers} ${c.readersLabel}`;
  } else {
    subText = `@${user.handle}`;
  }

  return (
    <div className="flex items-center gap-[calc(16*var(--fpx))] py-[calc(16*var(--fpx))]">
      {/* Avatar */}
      <Link to={profilePath} className="shrink-0" tabIndex={-1} aria-hidden>
        {isPublication ? (
          <Avatar
            src={user.avatar}
            label={name}
            sizeClass="size-[calc(48*var(--fpx))]"
            textClass="text-[length:calc(20*var(--fpx))]"
            rounded="card"
          />
        ) : (
          <Avatar
            src={user.avatar}
            label={name}
            sizeClass="size-[calc(48*var(--fpx))]"
            textClass="text-[length:calc(20*var(--fpx))]"
          />
        )}
      </Link>

      {/* Text block */}
      <div className="flex min-w-0 flex-1 flex-col gap-[calc(3*var(--fpx))]">
        <Link
          to={profilePath}
          className="truncate text-[length:calc(18*var(--fpx))] font-semibold leading-[calc(22/18)] text-ink hover:underline"
        >
          {name}
        </Link>
        <span className="truncate text-[length:calc(16*var(--fpx))] leading-[calc(19/16)] text-ink-60">
          {subText}
        </span>
      </div>

      {/* Fix #4: pass handle for aria-label */}
      <FollowingButton handle={user.handle} onClick={() => onUnfollow(user)} />
    </div>
  );
}

// ── Writers group ──────────────────────────────────────────────────────────

type WritersGroupProps = {
  writers: UserListItem[];
  removedHandles: Set<string>;
  // Fix #3: undoned items to show even after query re-ran without them
  undoneItems: UserListItem[];
  onUnfollow: (user: UserListItem) => void;
};

function WritersGroup({ writers, removedHandles, undoneItems, onUnfollow }: WritersGroupProps) {
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  // Items from the live query, minus optimistically removed
  const fromQuery = writers.filter((w) => !removedHandles.has(w.handle.toLowerCase()));
  // Items from local stash: shown when undo was clicked but refetch hasn't
  // re-added the item yet (not already in fromQuery, not still removed)
  const liveHandles = new Set(fromQuery.map((w) => w.handle.toLowerCase()));
  const fromStash = undoneItems.filter(
    (u) => !removedHandles.has(u.handle.toLowerCase()) && !liveHandles.has(u.handle.toLowerCase()),
  );
  const filtered = [...fromQuery, ...fromStash];
  const slice = filtered.slice(0, visible);

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[length:calc(18*var(--fpx))] font-semibold text-ink">
          {c.writersEmptyHeading}
        </p>
        <p className="mt-2 text-[length:calc(16*var(--fpx))] text-ink-80">
          {c.writersEmptyBody}
        </p>
        <Link
          to={c.writersEmptyCtaHref}
          className="mt-4 inline-block text-[length:calc(16*var(--fpx))] font-medium text-brand-purple underline underline-offset-2 hover:no-underline"
        >
          {c.writersEmptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div role="list" aria-label={c.tabWriters}>
      {slice.map((writer, idx) => (
        <div key={writer.handle} role="listitem">
          {idx > 0 && <div className="h-px w-full bg-[#373A49]/[0.14]" />}
          <AuthorRow user={writer} onUnfollow={onUnfollow} />
        </div>
      ))}
      {filtered.length > visible && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex h-10 items-center justify-center rounded-card border border-ink-border/20 px-6 text-sm font-medium text-ink-80 transition-colors hover:border-ink-border/40 hover:text-ink"
          >
            {c.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Publications group ─────────────────────────────────────────────────────

type PublicationsGroupProps = {
  publications: UserListItem[];
  removedHandles: Set<string>;
  // Fix #3: undoned items to show even after query re-ran without them
  undoneItems: UserListItem[];
  onUnfollow: (user: UserListItem) => void;
};

function PublicationsGroup({
  publications,
  removedHandles,
  undoneItems,
  onUnfollow,
}: PublicationsGroupProps) {
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const fromQuery = publications.filter((p) => !removedHandles.has(p.handle.toLowerCase()));
  const liveHandles = new Set(fromQuery.map((p) => p.handle.toLowerCase()));
  const fromStash = undoneItems.filter(
    (u) => !removedHandles.has(u.handle.toLowerCase()) && !liveHandles.has(u.handle.toLowerCase()),
  );
  const filtered = [...fromQuery, ...fromStash];
  const slice = filtered.slice(0, visible);

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[length:calc(18*var(--fpx))] font-semibold text-ink">
          {c.publicationsEmptyHeading}
        </p>
        <p className="mt-2 text-[length:calc(16*var(--fpx))] text-ink-80">
          {c.publicationsEmptyBody}
        </p>
        <Link
          to={c.publicationsEmptyCtaHref}
          className="mt-4 inline-block text-[length:calc(16*var(--fpx))] font-medium text-brand-purple underline underline-offset-2 hover:no-underline"
        >
          {c.publicationsEmptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div role="list" aria-label={c.tabPublications}>
      {slice.map((pub, idx) => (
        <div key={pub.handle} role="listitem">
          {idx > 0 && <div className="h-px w-full bg-[#373A49]/[0.14]" />}
          <AuthorRow user={pub} isPublication onUnfollow={onUnfollow} />
        </div>
      ))}
      {filtered.length > visible && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex h-10 items-center justify-center rounded-card border border-ink-border/20 px-6 text-sm font-medium text-ink-80 transition-colors hover:border-ink-border/40 hover:text-ink"
          >
            {c.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Skeleton loaders ───────────────────────────────────────────────────────

function TagsSkeleton() {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" sx={{ height: 48, width: 120 + (i % 4) * 30, borderRadius: 9999 }} />
      ))}
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" sx={{ height: 80, borderRadius: "var(--radius-card)", mb: "4px" }} />
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export function FollowingManage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("topics");

  // Data hooks
  const tagsQuery = useMyTags();
  const follows = useMyFollows();

  // Optimistic removal sets (local layer — cleared on Undo)
  const [removedTagIds, setRemovedTagIds] = useState<Set<string>>(new Set());
  const [removedHandles, setRemovedHandles] = useState<Set<string>>(new Set());

  // Fix #3: stash removed UserListItems so rows stay visible on Undo
  // until the re-follow refetch re-adds them to follows.writers/publications.
  // Map<lowercaseHandle, { user, isPublication }>
  const [undoneUsers, setUndoneUsers] = useState<
    Map<string, { user: UserListItem; isPublication: boolean }>
  >(new Map());

  // Mutations
  const unfollowAuthor = useUnfollowAuthor();
  const followAuthor = useFollowAuthor();
  const unfollowTag = useUnfollowTag();
  const followTag = useFollowTag();

  // Auth guard
  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  const tags = tagsQuery.data ?? [];
  const isLoading = follows.isLoading || tagsQuery.isLoading;

  const visibleTags = tags.filter((t) => !removedTagIds.has(t.tagId));
  const visibleWriters = follows.writers.filter(
    (w) => !removedHandles.has(w.handle.toLowerCase()),
  );
  const visiblePubs = follows.publications.filter(
    (p) => !removedHandles.has(p.handle.toLowerCase()),
  );

  // Fix #3: derive undone lists per group
  const undoneWriters = [...undoneUsers.values()]
    .filter(({ isPublication }) => !isPublication)
    .map(({ user }) => user);
  const undonePubs = [...undoneUsers.values()]
    .filter(({ isPublication }) => isPublication)
    .map(({ user }) => user);

  const allEmpty =
    !isLoading &&
    visibleTags.length === 0 &&
    visibleWriters.length === 0 &&
    visiblePubs.length === 0 &&
    undoneWriters.filter((u) => !removedHandles.has(u.handle.toLowerCase())).length === 0 &&
    undonePubs.filter((u) => !removedHandles.has(u.handle.toLowerCase())).length === 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUnfollowTag = (tag: PostTagModel__1) => {
    // Optimistic removal
    setRemovedTagIds((prev) => new Set([...prev, tag.tagId]));

    unfollowTag.mutate(tag, {
      onSuccess: () => {
        show(
          c.unfollowedTag.replace("{tag}", tag.tagName),
          "success",
          {
            actionLabel: c.undoLabel,
            onAction: () => {
              // Undo: re-follow + restore row
              setRemovedTagIds((prev) => {
                const next = new Set(prev);
                next.delete(tag.tagId);
                return next;
              });
              followTag.mutate(tag);
            },
          },
        );
      },
      onError: (err) => {
        // Revert optimistic removal
        setRemovedTagIds((prev) => {
          const next = new Set(prev);
          next.delete(tag.tagId);
          return next;
        });
        show(
          c.unfollowErrorTag.replace("{tag}", tag.tagName) +
            (err?.message ? ` (${err.message})` : ""),
          "error",
        );
      },
    });
  };

  const handleUnfollowAuthor = (user: UserListItem, isPublication: boolean) => {
    const lcHandle = user.handle.toLowerCase();
    // Optimistic removal
    setRemovedHandles((prev) => new Set([...prev, lcHandle]));
    // Fix #3: stash the UserListItem so Undo can re-show it before refetch
    setUndoneUsers((prev) => new Map([...prev, [lcHandle, { user, isPublication }]]));

    unfollowAuthor.mutate(user.handle, {
      onSuccess: () => {
        show(
          c.unfollowedAuthor.replace("{handle}", user.handle),
          "success",
          {
            actionLabel: c.undoLabel,
            onAction: () => {
              // Undo: clear from removed set — stash item stays visible
              setRemovedHandles((prev) => {
                const next = new Set(prev);
                next.delete(lcHandle);
                return next;
              });
              followAuthor.mutate(user.handle);
            },
          },
        );
      },
      onError: (err) => {
        // Revert optimistic removal + drop stash
        setRemovedHandles((prev) => {
          const next = new Set(prev);
          next.delete(lcHandle);
          return next;
        });
        setUndoneUsers((prev) => {
          const next = new Map(prev);
          next.delete(lcHandle);
          return next;
        });
        show(
          c.unfollowErrorAuthor.replace("{handle}", user.handle) +
            (err?.message ? ` (${err.message})` : ""),
          "error",
        );
      },
    });
  };

  // Fix #2: Error state — Retry button wired to both refetch handles.
  if (follows.isError) {
    return (
      <CenteredMessage
        heading={c.errorHeading}
        body={c.errorBody}
        actionLabel={c.retryLabel}
        onAction={() => {
          follows.refetch();
          void tagsQuery.refetch();
        }}
      />
    );
  }

  // ── All-empty first-run ────────────────────────────────────────────────────
  // Fix #8: design shows the tab bar even in the all-empty state.

  if (allEmpty) {
    return (
      <PageShell>
        <title>{c.metaTitle}</title>
        <main>
          <div className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 md:px-8 lg:px-14">
            <div className="mt-8 flex flex-col gap-[calc(32*var(--fpx))] rounded-[calc(16*var(--fpx))] bg-white px-[calc(64*var(--fpx))] py-[calc(56*var(--fpx))] md:mt-10 lg:mt-12">
              <h1 className="text-[length:calc(28*var(--fpx))] font-semibold leading-[calc(34/28)] text-ink/80">
                {c.pageTitle}
              </h1>
              {/* Tab bar visible even in all-empty state */}
              <FollowingTabBar
                active={activeTab}
                onSelect={setActiveTab}
                topicsCount={visibleTags.length}
                writersCount={visibleWriters.length}
                publicationsCount={visiblePubs.length}
              />
              <div className="py-24 text-center">
                <p className="text-[length:calc(20*var(--fpx))] font-semibold text-ink">
                  {c.allEmptyHeading}
                </p>
                <p className="mt-2 text-[length:calc(16*var(--fpx))] text-ink-80">
                  {c.allEmptyBody}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  <Link
                    to="/explore/topics"
                    className="text-[length:calc(16*var(--fpx))] font-medium text-brand-purple underline underline-offset-2 hover:no-underline"
                  >
                    {c.allEmptyTopicsCta}
                  </Link>
                  <Link
                    to="/explore/writers"
                    className="text-[length:calc(16*var(--fpx))] font-medium text-brand-purple underline underline-offset-2 hover:no-underline"
                  >
                    {c.allEmptyWritersCta}
                  </Link>
                  <Link
                    to="/explore/publications"
                    className="text-[length:calc(16*var(--fpx))] font-medium text-brand-purple underline underline-offset-2 hover:no-underline"
                  >
                    {c.allEmptyPublicationsCta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </PageShell>
    );
  }

  // ── Populated page ─────────────────────────────────────────────────────────

  return (
    <PageShell>
      <title>{c.metaTitle}</title>
      <main>
        <div className="mx-auto max-w-[calc(1312*var(--fpx))] px-4 md:px-8 lg:px-14">
          <div className="mt-8 flex flex-col gap-[calc(32*var(--fpx))] rounded-[calc(16*var(--fpx))] bg-white px-[calc(64*var(--fpx))] py-[calc(56*var(--fpx))] md:mt-10 lg:mt-12">
            {/* Page heading */}
            <h1 className="text-[length:calc(28*var(--fpx))] font-semibold leading-[calc(34/28)] text-ink/80">
              {c.pageTitle}
            </h1>

            {/* Tab bar */}
            <FollowingTabBar
              active={activeTab}
              onSelect={setActiveTab}
              topicsCount={visibleTags.length}
              writersCount={visibleWriters.length}
              publicationsCount={visiblePubs.length}
            />

            {/* Active tab content */}
            {isLoading ? (
              activeTab === "topics" ? (
                <TagsSkeleton />
              ) : (
                <RowsSkeleton />
              )
            ) : (
              <>
                {activeTab === "topics" && (
                  <TopicsGroup
                    tags={tags}
                    removedIds={removedTagIds}
                    onUnfollow={handleUnfollowTag}
                  />
                )}
                {activeTab === "writers" && (
                  <WritersGroup
                    writers={follows.writers}
                    removedHandles={removedHandles}
                    undoneItems={undoneWriters}
                    onUnfollow={(user) => handleUnfollowAuthor(user, false)}
                  />
                )}
                {activeTab === "publications" && (
                  <PublicationsGroup
                    publications={follows.publications}
                    removedHandles={removedHandles}
                    undoneItems={undonePubs}
                    onUnfollow={(user) => handleUnfollowAuthor(user, true)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}

export default FollowingManage;
