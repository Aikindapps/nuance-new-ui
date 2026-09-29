// NIC-562 -- publication Members roster (display only).
//
// Presentational: no data fetching. Renders the Members header (title +
// disabled "Add member" + "Sort" foldout), the member list (grouped by role
// or flat by name), loading skeleton, error block and empty (no writers)
// block. Reuses the Activity primitives' visual language (row, divider,
// skeleton, error/empty blocks) and PublishView's dark foldout listbox
// pattern for Sort.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { Avatar } from "../../../components/ui/Avatar";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../../components/ui/modalButtons";
import { IconPlus } from "../../../components/ui/icons/IconPlus";
import { IconSort } from "../../../components/ui/icons/IconSort";
import { KitIllustrationNoMembers } from "../../../components/ui/icons/KitIllustrationNoMembers";
import { KitIllustrationLoadError } from "../../../components/ui/icons/KitIllustrationLoadError";
import { formatCount } from "../../../lib/formatCount";
import { publicationMembersCopy as copy } from "../../../constants/copy";
import {
  sortMembers,
  type PublicationMember,
} from "../hooks/usePublicationMembers";

const PAGE_SIZE = 10;
const SKELETON_ROW_COUNT = 5;

type SortMode = "role" | "name";

export type MembersRosterProps = {
  members: PublicationMember[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  currentPrincipal: string | null;
};

export function MembersRoster({
  members,
  isLoading,
  isError,
  onRetry,
  currentPrincipal,
}: MembersRosterProps) {
  const [sort, setSort] = useState<SortMode>("role");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Close the Sort foldout on Escape or an outside mousedown.
  useEffect(() => {
    if (!sortOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (sortRef.current?.contains(e.target as Node)) return;
      setSortOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [sortOpen]);

  const pick = (mode: SortMode) => {
    setSort(mode);
    setSortOpen(false);
    // Changing the sort keeps the current visible count (no reset here).
  };

  const list = members ?? [];
  const editorsTotal = list.filter((m) => m.role === "editor").length;
  const writersTotal = list.filter((m) => m.role === "writer").length;
  const isEmptyWriters = !isLoading && !isError && writersTotal === 0;

  const sorted = sortMembers(list, sort);
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="flex flex-col gap-[calc(32*var(--fpx))]">
      {/* Header -- stays real in every state (loading/error/empty included). */}
      <div className="flex flex-col gap-[calc(32*var(--fpx))]">
        <h1 className="text-lg font-bold text-ink-80">{copy.title}</h1>

        <div className="flex flex-wrap items-center justify-between gap-[calc(16*var(--fpx))]">
          {/* Add member -- no invite flow yet (NIC-362); disabled with a
              "coming soon" hint. Disabled MUI buttons swallow pointer
              events, so the title lives on the wrapping span. */}
          <span title={copy.addMemberComingSoon} className="inline-block">
            <Button
              disabled
              variant="contained"
              disableElevation
              startIcon={<IconPlus className="size-[calc(20*var(--fpx))]" />}
              sx={primaryButtonSx}
              aria-label={`${copy.addMember} -- ${copy.addMemberComingSoon}`}
            >
              {copy.addMember}
            </Button>
          </span>

          {/* Sort -- dark foldout listbox (PublishView pattern). */}
          <div className="relative" ref={sortRef}>
            <Button
              variant="outlined"
              startIcon={<IconSort className="size-[calc(20*var(--fpx))]" />}
              sx={secondaryButtonSx}
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              aria-controls={listboxId}
              onClick={() => setSortOpen((o) => !o)}
            >
              {copy.sort}
            </Button>

            {sortOpen && (
              <ul
                id={listboxId}
                role="listbox"
                className="absolute right-0 z-10 mt-[calc(8*var(--fpx))] w-max min-w-[calc(200*var(--fpx))] rounded-[calc(16*var(--fpx))] bg-ink p-[calc(20*var(--fpx))] shadow-purple-glow flex flex-col gap-[calc(4*var(--fpx))]"
              >
                {(
                  [
                    ["role", copy.sortByRole],
                    ["name", copy.sortByName],
                  ] as const
                ).map(([mode, label]) => (
                  <li key={mode} role="option" aria-selected={sort === mode}>
                    <button
                      type="button"
                      onClick={() => pick(mode)}
                      className={[
                        "flex w-full items-center rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white",
                        sort === mode
                          ? "bg-brand-purple-fluor-80 font-medium"
                          : "hover:bg-brand-purple-fluor-80",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* List area. */}
      {isLoading ? (
        <MembersLoading />
      ) : isError ? (
        <MembersError onRetry={onRetry} />
      ) : (
        <MembersList
          visible={visible}
          sort={sort}
          editorsTotal={editorsTotal}
          writersTotal={writersTotal}
          isEmptyWriters={isEmptyWriters}
          currentPrincipal={currentPrincipal}
          hasMore={hasMore}
          onShowMore={() => setVisibleCount((n) => n + PAGE_SIZE)}
        />
      )}
    </div>
  );
}

// -- Group header ---------------------------------------------------------

function GroupHeader({
  label,
  count,
  isFirst,
}: {
  label: string;
  count: number;
  isFirst: boolean;
}) {
  return (
    <div
      className={[
        "flex items-baseline gap-[calc(6*var(--fpx))] pb-[calc(16*var(--fpx))]",
        isFirst ? "" : "pt-[calc(32*var(--fpx))]",
      ].join(" ")}
    >
      <h2 className="text-[length:calc(18*var(--fpx))] font-bold leading-[calc(28*var(--fpx))] text-ink-80">
        {label}
      </h2>
      <span className="text-[length:calc(18*var(--fpx))] font-bold leading-[calc(28*var(--fpx))] text-ink-60">
        ({count})
      </span>
    </div>
  );
}

// -- Row divider ----------------------------------------------------------

function RowDivider() {
  return <div className="h-px w-full bg-[#373A49]/10" />;
}

// -- Role pill ------------------------------------------------------------
// "You" replaces the role pill on the current principal's own row (per the
// Populated frame -- @raven shows only a "You" chip, no separate "Editor").

function RolePill({ isSelf, role }: { isSelf: boolean; role: "editor" | "writer" }) {
  if (isSelf) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-[calc(8*var(--fpx))] bg-brand-purple-10 px-[calc(10*var(--fpx))] py-[calc(2*var(--fpx))] text-[length:calc(14*var(--fpx))] font-medium leading-[calc(20*var(--fpx))] text-brand-purple">
        {copy.youPill}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-[calc(8*var(--fpx))] bg-ink-border-10 px-[calc(10*var(--fpx))] py-[calc(2*var(--fpx))] text-[length:calc(14*var(--fpx))] font-medium leading-[calc(20*var(--fpx))] text-ink-80">
      {role === "editor" ? copy.editorPill : copy.writerPill}
    </span>
  );
}

// -- Member row -----------------------------------------------------------

function MemberRow({
  member,
  isSelf,
}: {
  member: PublicationMember;
  isSelf: boolean;
}) {
  const name = member.displayName || member.handle;
  const profilePath = `/${member.handle.toLowerCase()}`;

  const followers = Number(member.followersCount || "0");
  const followersLabel = `${formatCount(member.followersCount)} ${
    followers === 1 ? copy.followerSingular : copy.followerPlural
  }`;
  const articlesLabel =
    member.publishedCount === null
      ? null
      : `${member.publishedCount} ${
          member.publishedCount === 1 ? copy.articleSingular : copy.articlePlural
        }`;
  const metaLine = articlesLabel
    ? `${followersLabel} \u00b7 ${articlesLabel}`
    : followersLabel;

  return (
    <div className="flex items-center gap-[calc(24*var(--fpx))] py-[calc(16*var(--fpx))]">
      <Link to={profilePath} className="shrink-0" tabIndex={-1}>
        <Avatar
          src={member.avatar}
          label={name}
          sizeClass="size-[calc(80*var(--fpx))]"
          textClass="text-[length:calc(28*var(--fpx))]"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-[calc(4*var(--fpx))]">
        <div className="flex min-w-0 items-center gap-[calc(8*var(--fpx))]">
          <Link
            to={profilePath}
            className="min-w-0 truncate text-[length:calc(18*var(--fpx))] font-bold leading-[calc(28*var(--fpx))] text-ink hover:underline"
          >
            @{member.handle}
          </Link>
          <RolePill isSelf={isSelf} role={member.role} />
        </div>
        <span className="truncate text-[length:calc(16*var(--fpx))] leading-[calc(19/16)] text-ink-60">
          {metaLine}
        </span>
      </div>
    </div>
  );
}

// -- List (populated + empty) --------------------------------------------

function MembersList({
  visible,
  sort,
  editorsTotal,
  writersTotal,
  isEmptyWriters,
  currentPrincipal,
  hasMore,
  onShowMore,
}: {
  visible: PublicationMember[];
  sort: SortMode;
  editorsTotal: number;
  writersTotal: number;
  isEmptyWriters: boolean;
  currentPrincipal: string | null;
  hasMore: boolean;
  onShowMore: () => void;
}) {
  const nodes: ReactNode[] = [];
  let lastWasRow = false;

  if (sort === "role") {
    let editorHeaderShown = false;
    let writerHeaderShown = false;
    for (const member of visible) {
      if (member.role === "editor" && !editorHeaderShown) {
        nodes.push(
          <GroupHeader
            key="hdr-editors"
            label={copy.editorsGroup}
            count={editorsTotal}
            isFirst
          />,
        );
        editorHeaderShown = true;
        lastWasRow = false;
      }
      if (member.role === "writer" && !writerHeaderShown) {
        nodes.push(
          <GroupHeader
            key="hdr-writers"
            label={copy.writersGroup}
            count={writersTotal}
            isFirst={!editorHeaderShown}
          />,
        );
        writerHeaderShown = true;
        lastWasRow = false;
      }
      if (lastWasRow) nodes.push(<RowDivider key={`div-${member.principal}`} />);
      nodes.push(
        <MemberRow
          key={member.principal}
          member={member}
          isSelf={member.principal === currentPrincipal}
        />,
      );
      lastWasRow = true;
    }
    // Zero writers: still show the "Writers (0)" label per the Empty frame,
    // then the empty block below (group-label rules for "role" sort apply).
    if (isEmptyWriters && !writerHeaderShown) {
      nodes.push(
        <GroupHeader
          key="hdr-writers-empty"
          label={copy.writersGroup}
          count={0}
          isFirst={!editorHeaderShown}
        />,
      );
    }
  } else {
    // "name" sort: flat list, no group labels at all.
    for (const member of visible) {
      if (lastWasRow) nodes.push(<RowDivider key={`div-${member.principal}`} />);
      nodes.push(
        <MemberRow
          key={member.principal}
          member={member}
          isSelf={member.principal === currentPrincipal}
        />,
      );
      lastWasRow = true;
    }
  }

  return (
    <div className="flex flex-col">
      {nodes}
      {isEmptyWriters && <EmptyWritersBlock />}
      {hasMore && (
        <div className="mt-[calc(16*var(--fpx))]">
          <Button
            fullWidth
            variant="outlined"
            sx={secondaryButtonSx}
            onClick={onShowMore}
          >
            {copy.showMore}
          </Button>
        </div>
      )}
    </div>
  );
}

// -- Empty (no writers) ---------------------------------------------------

function EmptyWritersBlock() {
  return (
    <div className="flex flex-col items-center gap-[calc(16*var(--fpx))] py-[calc(56*var(--fpx))] text-center">
      <KitIllustrationNoMembers className="size-[calc(87*var(--fpx))]" />
      <p className="text-[length:calc(18*var(--fpx))] font-bold leading-[calc(28*var(--fpx))] text-ink-80">
        {copy.emptyHeading}
      </p>
      <p className="text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink-60">
        {copy.emptyBody}
      </p>
      <span title={copy.addMemberComingSoon} className="inline-block">
        <Button
          disabled
          variant="contained"
          disableElevation
          startIcon={<IconPlus className="size-[calc(20*var(--fpx))]" />}
          sx={primaryButtonSx}
          aria-label={`${copy.emptyCta} -- ${copy.addMemberComingSoon}`}
        >
          {copy.emptyCta}
        </Button>
      </span>
    </div>
  );
}

// -- Error ----------------------------------------------------------------

function MembersError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-[calc(16*var(--fpx))] py-[calc(64*var(--fpx))] text-center"
    >
      <KitIllustrationLoadError className="size-[calc(87*var(--fpx))]" />
      <p className="text-[length:calc(18*var(--fpx))] font-bold leading-[calc(22*var(--fpx))] text-ink-80">
        {copy.loadErrorHeading}
      </p>
      <p className="text-[length:calc(16*var(--fpx))] leading-[calc(19*var(--fpx))] text-ink-60">
        {copy.loadErrorBody}
      </p>
      <Button variant="outlined" sx={secondaryButtonSx} onClick={onRetry}>
        {copy.retry}
      </Button>
    </div>
  );
}

// -- Loading --------------------------------------------------------------

const SKELETON_FILL = "rgba(55, 58, 73, 0.1)";

function MembersLoading() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col">
      {/* Skeleton group header (824x60: title 140x20 + helper 360x16, gap 8, pb 16). */}
      <div className="flex flex-col gap-[calc(8*var(--fpx))] pb-[calc(16*var(--fpx))]">
        <Skeleton
          variant="rounded"
          sx={{
            width: "calc(140 * var(--fpx))",
            height: "calc(20 * var(--fpx))",
            borderRadius: "6px",
            bgcolor: SKELETON_FILL,
          }}
        />
        <Skeleton
          variant="rounded"
          sx={{
            width: "calc(360 * var(--fpx))",
            height: "calc(16 * var(--fpx))",
            borderRadius: "6px",
            bgcolor: SKELETON_FILL,
          }}
        />
      </div>

      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
        <div key={i}>
          {i > 0 && <RowDivider />}
          {/* Row height matches MemberRow exactly: py-16 + 80px avatar. */}
          <div className="flex items-center gap-[calc(24*var(--fpx))] py-[calc(16*var(--fpx))]">
            <Skeleton
              variant="circular"
              sx={{
                width: "calc(80 * var(--fpx))",
                height: "calc(80 * var(--fpx))",
                flexShrink: 0,
                bgcolor: SKELETON_FILL,
              }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-[calc(6*var(--fpx))]">
              <Skeleton
                variant="rounded"
                sx={{
                  height: "calc(20 * var(--fpx))",
                  width: "40%",
                  borderRadius: "6px",
                  bgcolor: SKELETON_FILL,
                }}
              />
              <Skeleton
                variant="rounded"
                sx={{
                  height: "calc(16 * var(--fpx))",
                  width: "28%",
                  borderRadius: "6px",
                  bgcolor: SKELETON_FILL,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
