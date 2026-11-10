// NIC-562 -- publication Members roster; NIC-992 adds add/remove members.
//
// Presentational: no data fetching. Renders the Members header (title +
// "Add member" + "Sort" foldout), the add panel, the member list (grouped by role
// or flat by name), loading skeleton, error block and empty (no writers)
// block. Reuses the Activity primitives' visual language (row, divider,
// skeleton, error/empty blocks) and PublishView's dark foldout listbox
// pattern for Sort.

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { SxProps, Theme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { Avatar } from "../../../components/ui/Avatar";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../../components/ui/modalButtons";
import { ButtonSpinner } from "../../../components/ui/ButtonSpinner";
import {
  CONFIRM_DIALOG_TITLE_ID,
  ConfirmDialog,
} from "../../../components/ui/ConfirmDialog";
import { IconChevronDown } from "../../../components/ui/icons/IconChevronDown";
import { IconPlus } from "../../../components/ui/icons/IconPlus";
import { IconSort } from "../../../components/ui/icons/IconSort";
import { KitIllustrationNoMembers } from "../../../components/ui/icons/KitIllustrationNoMembers";
import { KitIllustrationLoadError } from "../../../components/ui/icons/KitIllustrationLoadError";
import { formatCount } from "../../../lib/formatCount";
import { publicationMembersCopy as copy } from "../../../constants/copy";
import { useModal } from "../../../services/modal";
import { useToast } from "../../../services/toast";
import {
  normalizeMemberHandle,
  type AddMemberOutcome,
  type MemberRole,
} from "../hooks/usePublicationMemberActions";
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
  // Undefined while membership is still loading: Add buttons render disabled
  // and rows get no action.
  onAddMember?: (rawHandle: string, role: MemberRole) => Promise<AddMemberOutcome>;
  onRemoveMember?: (member: PublicationMember) => Promise<boolean>;
};

export function MembersRoster({
  members,
  isLoading,
  isError,
  onRetry,
  currentPrincipal,
  onAddMember,
  onRemoveMember,
}: MembersRosterProps) {
  const { show } = useToast();
  const modal = useModal();
  const [sort, setSort] = useState<SortMode>("role");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Add panel state.
  const panelId = useId();
  const roleListboxId = useId();
  const errorId = useId();
  const [panelOpen, setPanelOpen] = useState(false);
  const [handleText, setHandleText] = useState("");
  const [role, setRole] = useState<MemberRole>("writer");
  const [roleOpen, setRoleOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  // Synchronous in-flight guard (state alone is stale inside old closures, e.g.
  // a Retry toast) + the latest handler, so concurrent adds are impossible.
  const addingRef = useRef(false);
  const onAddMemberRef = useRef(onAddMember);
  useLayoutEffect(() => {
    onAddMemberRef.current = onAddMember;
  });
  const roleBtnRef = useRef<HTMLButtonElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Opening the panel focuses the handle field.
  useEffect(() => {
    if (panelOpen) inputRef.current?.focus();
  }, [panelOpen]);

  // Close the Role listbox on Escape or an outside mousedown.
  useEffect(() => {
    if (!roleOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRoleOpen(false);
        roleBtnRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (roleRef.current?.contains(e.target as Node)) return;
      setRoleOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [roleOpen]);

  const closePanel = () => {
    setPanelOpen(false);
    setHandleText("");
    setRole("writer");
    setRoleOpen(false);
    setAddError(null);
    addBtnRef.current?.focus();
  };

  const togglePanel = () => {
    if (addingRef.current) return;
    if (panelOpen) closePanel();
    else setPanelOpen(true);
  };

  const openAsWriter = () => {
    if (addingRef.current) return;
    setRole("writer");
    setAddError(null);
    setPanelOpen(true);
    inputRef.current?.focus();
  };

  const runAdd = async (rawHandle: string, addRole: MemberRole) => {
    const addMember = onAddMemberRef.current;
    if (!addMember || addingRef.current) return;
    if (normalizeMemberHandle(rawHandle) === "") return;
    addingRef.current = true;
    setAdding(true);
    setAddError(null);
    let outcome: AddMemberOutcome;
    try {
      outcome = await addMember(rawHandle, addRole);
    } catch {
      outcome = { kind: "failed", handle: normalizeMemberHandle(rawHandle) };
    } finally {
      addingRef.current = false;
      setAdding(false);
    }
    const h = outcome.handle;
    switch (outcome.kind) {
      case "added":
        closePanel();
        show(
          (outcome.role === "editor" ? copy.addedAsEditor : copy.addedAsWriter).replace(
            "{handle}",
            h,
          ),
          "success",
        );
        break;
      case "notFound":
        setAddError(copy.errorNotFound.replace("{handle}", h));
        break;
      case "alreadyEditor":
        setAddError(copy.errorAlreadyEditor.replace("{handle}", h));
        break;
      case "alreadyWriter":
        setAddError(copy.errorAlreadyWriter.replace("{handle}", h));
        break;
      case "failed":
        show(copy.addFailed.replace("{handle}", h), "error", {
          actionLabel: copy.retry,
          onAction: () => {
            if (addingRef.current) return;
            setHandleText(rawHandle);
            setRole(addRole);
            setPanelOpen(true);
            void runAdd(rawHandle, addRole);
          },
        });
        break;
    }
  };

  const confirmRemove = (member: PublicationMember) => {
    if (!onRemoveMember) return;
    const isEditor = member.role === "editor";
    modal.open(
      <ConfirmDialog
        title={(isEditor
          ? copy.removeEditorConfirmTitle
          : copy.revokeConfirmTitle
        ).replace("{handle}", member.handle)}
        body={(isEditor
          ? copy.removeEditorConfirmBody
          : copy.revokeConfirmBody
        ).replace("{handle}", member.handle)}
        confirmLabel={isEditor ? copy.removeEditor : copy.revokeWriter}
        cancelLabel={copy.cancel}
        closeAriaLabel={copy.close}
        busyLabel={copy.removing}
        onConfirm={async () => {
          const ok = await onRemoveMember(member);
          if (!ok) {
            show(copy.removeFailed.replace("{handle}", member.handle), "error");
            throw new Error("remove failed"); // keep the dialog open
          }
        }}
      />,
      { ariaLabelledBy: CONFIRM_DIALOG_TITLE_ID, dismissable: true },
    );
  };

  const canAdd = normalizeMemberHandle(handleText) !== "";
  const fieldDisabledSx = adding ? "opacity-50" : "";

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
          <Button
            ref={addBtnRef}
            disabled={!onAddMember}
            variant="contained"
            disableElevation
            startIcon={<IconPlus className="size-[calc(20*var(--fpx))]" />}
            sx={primaryButtonSx}
            aria-expanded={panelOpen}
            aria-controls={panelId}
            onClick={togglePanel}
          >
            {copy.addMember}
          </Button>

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

      {panelOpen && (
        <div
          id={panelId}
          className="flex flex-col gap-[calc(16*var(--fpx))] rounded-[calc(12*var(--fpx))] border border-ink-border-5 bg-white p-[calc(24*var(--fpx))]"
        >
          <div className="flex h-[calc(48*var(--fpx))] items-center justify-between">
            <h2 className="text-[length:calc(18*var(--fpx))] font-bold leading-[calc(28*var(--fpx))] text-ink-80">
              {copy.addPanelTitle}
            </h2>
            <button
              type="button"
              disabled={adding}
              onClick={closePanel}
              className={[
                "px-[calc(24*var(--fpx))] py-[calc(12*var(--fpx))] text-[length:calc(16*var(--fpx))] font-medium leading-[calc(24*var(--fpx))] text-brand-purple",
                fieldDisabledSx,
              ].join(" ")}
            >
              {copy.cancel}
            </button>
          </div>

          <div className="flex flex-wrap gap-[calc(12*var(--fpx))] lg:flex-nowrap">
            <input
              ref={inputRef}
              type="text"
              value={handleText}
              disabled={adding}
              maxLength={64}
              placeholder={copy.handlePlaceholder}
              aria-label={copy.handleAriaLabel}
              aria-invalid={addError ? true : undefined}
              aria-describedby={addError ? errorId : undefined}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              onChange={(e) => {
                setHandleText(e.target.value);
                setAddError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canAdd) void runAdd(handleText, role);
                }
              }}
              className={[
                "h-[calc(48*var(--fpx))] w-full min-w-0 rounded-[calc(6*var(--fpx))] bg-ink-border-5 px-[calc(16*var(--fpx))] py-[calc(10*var(--fpx))] text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-ink-80 outline-none placeholder:text-ink-60 lg:w-auto lg:flex-1",
                addError
                  ? "border-[1.5px] border-brand-purple"
                  : "border border-ink-border-5 focus:border-brand-purple",
                fieldDisabledSx,
              ].join(" ")}
            />

            <div
              ref={roleRef}
              className="relative min-w-0 flex-1 lg:w-[calc(150*var(--fpx))] lg:flex-none"
            >
              <button
                ref={roleBtnRef}
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={roleOpen}
                aria-controls={roleListboxId}
                aria-label={copy.roleAriaLabel}
                disabled={adding}
                onClick={() => setRoleOpen((o) => !o)}
                className={[
                  "flex h-[calc(48*var(--fpx))] w-full items-center justify-between rounded-[calc(6*var(--fpx))] border border-ink-border-5 bg-ink-border-5 px-[calc(16*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-ink-80",
                  fieldDisabledSx,
                ].join(" ")}
              >
                {role === "editor" ? copy.roleEditor : copy.roleWriter}
                <IconChevronDown className="size-[calc(24*var(--fpx))] shrink-0" />
              </button>

              {roleOpen && (
                <ul
                  id={roleListboxId}
                  role="listbox"
                  className="absolute left-0 z-10 mt-[calc(8*var(--fpx))] w-max min-w-[calc(200*var(--fpx))] rounded-[calc(16*var(--fpx))] bg-ink p-[calc(20*var(--fpx))] shadow-purple-glow flex flex-col gap-[calc(4*var(--fpx))]"
                >
                  {(
                    [
                      ["writer", copy.roleWriter],
                      ["editor", copy.roleEditor],
                    ] as const
                  ).map(([value, label]) => (
                    <li key={value} role="option" aria-selected={role === value}>
                      <button
                        type="button"
                        onClick={() => {
                          setRole(value);
                          setRoleOpen(false);
                          setAddError(null);
                        }}
                        className={[
                          "flex w-full items-center rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white",
                          role === value
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

            <Button
              variant="contained"
              disableElevation
              disabled={!canAdd || adding}
              onClick={() => void runAdd(handleText, role)}
              sx={
                [
                  primaryButtonSx,
                  {
                    height: "calc(48*var(--fpx))",
                    minWidth: 0,
                    lineHeight: "calc(28*var(--fpx))",
                    padding: "calc(10*var(--fpx)) calc(24*var(--fpx))",
                  },
                ] as SxProps<Theme>
              }
            >
              {adding ? (
                <span className="inline-flex items-center gap-[calc(8*var(--fpx))]">
                  <ButtonSpinner />
                  {copy.adding}
                </span>
              ) : (
                copy.add
              )}
            </Button>
          </div>

          {addError ? (
            <p
              id={errorId}
              role="alert"
              className="min-w-0 text-[length:calc(16*var(--fpx))] font-medium leading-[calc(24*var(--fpx))] text-brand-purple [overflow-wrap:anywhere]"
            >
              {addError}
            </p>
          ) : (
            <p className="min-w-0 text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink-80 [overflow-wrap:anywhere]">
              {copy.addHelper}
            </p>
          )}
        </div>
      )}

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
          onAddWriter={onAddMember ? openAsWriter : undefined}
          onRemove={onRemoveMember ? confirmRemove : undefined}
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
      <span className="inline-flex shrink-0 items-center rounded-full bg-brand-purple-5 px-[calc(12*var(--fpx))] py-[calc(4*var(--fpx))] text-[length:calc(16*var(--fpx))] font-medium leading-[calc(24*var(--fpx))] text-brand-purple">
        {copy.youPill}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-ink-border-5 px-[calc(12*var(--fpx))] py-[calc(4*var(--fpx))] text-[length:calc(16*var(--fpx))] font-medium leading-[calc(24*var(--fpx))] text-ink-80">
      {role === "editor" ? copy.editorPill : copy.writerPill}
    </span>
  );
}

// -- Member row -----------------------------------------------------------

function RemoveAction({
  member,
  onRemove,
  phone,
}: {
  member: PublicationMember;
  onRemove: (member: PublicationMember) => void;
  phone?: boolean;
}) {
  return (
    <Button
      variant="outlined"
      sx={
        phone
          ? [
              secondaryButtonSx,
              {
                maxWidth: "100%",
                height: "auto",
                minHeight: 48,
                whiteSpace: "normal",
                textAlign: "left",
              },
            ] as SxProps<Theme>
          : [secondaryButtonSx, { whiteSpace: "nowrap" }] as SxProps<Theme>
      }
      onClick={() => onRemove(member)}
    >
      {member.role === "editor" ? copy.removeEditor : copy.revokeWriter}
    </Button>
  );
}

function MemberRow({
  member,
  isSelf,
  onRemove,
}: {
  member: PublicationMember;
  isSelf: boolean;
  onRemove?: (member: PublicationMember) => void;
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
        {onRemove && !isSelf && (
          <div className="mt-[calc(4*var(--fpx))] flex max-w-full lg:hidden">
            <RemoveAction member={member} onRemove={onRemove} phone />
          </div>
        )}
      </div>

      {onRemove && !isSelf && (
        <div className="hidden shrink-0 lg:block">
          <RemoveAction member={member} onRemove={onRemove} />
        </div>
      )}
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
  onAddWriter,
  onRemove,
  hasMore,
  onShowMore,
}: {
  visible: PublicationMember[];
  sort: SortMode;
  editorsTotal: number;
  writersTotal: number;
  isEmptyWriters: boolean;
  currentPrincipal: string | null;
  onAddWriter?: () => void;
  onRemove?: (member: PublicationMember) => void;
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
          onRemove={onRemove}
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
          onRemove={onRemove}
        />,
      );
      lastWasRow = true;
    }
  }

  return (
    <div className="flex flex-col">
      {nodes}
      {isEmptyWriters && <EmptyWritersBlock onAddWriter={onAddWriter} />}
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

function EmptyWritersBlock({ onAddWriter }: { onAddWriter?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-[calc(16*var(--fpx))] py-[calc(56*var(--fpx))] text-center">
      <KitIllustrationNoMembers className="w-[calc(108.75*var(--fpx))] h-[calc(87*var(--fpx))]" />
      <p className="text-[length:calc(18*var(--fpx))] font-bold leading-[calc(28*var(--fpx))] text-ink-80">
        {copy.emptyHeading}
      </p>
      <p className="text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink-60">
        {copy.emptyBody}
      </p>
      <Button
        disabled={!onAddWriter}
        variant="contained"
        disableElevation
        startIcon={<IconPlus className="size-[calc(20*var(--fpx))]" />}
        sx={primaryButtonSx}
        onClick={onAddWriter}
      >
        {copy.emptyCta}
      </Button>
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
      <KitIllustrationLoadError className="w-[calc(108.75*var(--fpx))] h-[calc(87*var(--fpx))]" />
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
