import { useEffect, useRef, useState, type ReactNode } from "react";
import Button from "@mui/material/Button";
import FocusTrap from "@mui/material/Unstable_TrapFocus";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../../components/ui/modalButtons";
import { writeArticleCopy } from "../../../constants/copy";
import type { PublicationObject } from "../../../candid/User/User";
import { TopicPicker } from "./TopicPicker";
import { IconChevronDown } from "../../../components/ui/icons/IconChevronDown";
import { IconChevronLeft } from "../../../components/ui/icons/IconChevronLeft";
import { publishAccessCopy } from "./publishAccessCopy";
import { useSubscriptionAvailable } from "../hooks/useSubscriptionAvailable";
import { publishScheduleCopy } from "./publishScheduleCopy";
import { PublishScheduleField } from "./PublishScheduleField";
import {
  localDateISO,
  scheduleMsIfFuture,
} from "../lib/publishSchedule";
import { useIsMobileViewport } from "../../../lib/useIsMobileViewport";
import { PREMIUM_MINT_VIEW_TITLE_ID } from "./PremiumMintView";
import { PublishCategoryField } from "./PublishCategoryField";
import { publishSheetCopy } from "./publishSheetCopy";

export const PUBLISH_VIEW_TITLE_ID = "publish-view-title";

// §6.2 Publish / Save-as-draft view (Figma nodes 1:41875 / 1:41888 / 1:41907).
// Full-surface overlay (fixed inset-0, bg-white) rendered over the still-
// mounted Lexical editor — editor state is preserved; onBack returns to the
// editor with no canister call. Replaces the old PublishModal (de-modal rework
// per UAT defect NIC-71).
export function PublishView({
  mode,
  initialTagIds,
  publications,
  initialPublicationHandle,
  onBack,
  onConfirm,
  coverPresent,
  onMintPremium,
  articleSavedToCanister,
  savedPublicationHandle,
  initialMembersOnly,
  alreadyPublished,
  lockedPublication,
  mintStep,
  initialCategory,
}: {
  mode: "draft" | "publish";
  initialTagIds: string[];
  publications: PublicationObject[];
  initialPublicationHandle: string | null;
  onBack: () => void;
  onConfirm: (
    tagIds: string[],
    publicationHandle: string | null,
    submitForReview: boolean,
    isMembersOnly: boolean,
    scheduledPublishedDate: bigint | null,
    retry: () => void,
    category: string,
  ) => Promise<boolean>;
  coverPresent?: boolean;
  onMintPremium?: (
    tagIds: string[],
    publicationHandle: string,
    category: string,
  ) => void;
  articleSavedToCanister?: boolean;
  savedPublicationHandle?: string | null;
  initialMembersOnly?: boolean;
  alreadyPublished?: boolean;
  // An existing publication article: "Publish to" is locked to its own
  // publication (label = the picker's label for it) and names the credited
  // writer in the helper line (D-111, NIC-547 item 4). null = live picker.
  lockedPublication?: { label: string; writerHandle: string } | null;
  // Desktop only: the limited-edition mint setup step (PremiumMintView),
  // shown IN PLACE of this view's content -- same white surface, same 666
  // column, no pop-up. This component stays mounted, so tags, publication,
  // date/time and access are still set when the step's Back clears it.
  // null/undefined = the normal Publish content. Ignored on phone, where
  // the mint setup is a bottom sheet opened through the modal service.
  mintStep?: ReactNode;
  // The article's category in the publication it is being saved to
  // (NIC-536), exactly as stored; "" = none.
  initialCategory?: string;
}) {
  const c = writeArticleCopy.publish;
  const cp = writeArticleCopy.premium;
  const isMobile = useIsMobileViewport();
  const [selected, setSelected] = useState<string[]>(initialTagIds);
  const [pickedPubHandle, setPubHandle] = useState<string | null>(initialPublicationHandle);
  const pubHandle = lockedPublication
    ? lockedPublication.label
    : pickedPubHandle;
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(initialCategory ?? "");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [membersOnly, setMembersOnly] = useState(initialMembersOnly ?? false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [pubDate, setPubDate] = useState(() =>
    localDateISO(new Date()),
  );
  const [pubTime, setPubTime] = useState<string | null>(null);
  const [timeOpen, setTimeOpen] = useState(false);
  const mintShown = !isMobile && mintStep != null;

  const selectedPub = publications.find((p) => p.publicationName === pubHandle);
  const premiumEligible =
    mode === "publish" &&
    pubHandle !== null &&
    selectedPub?.isEditor === true &&
    coverPresent === true &&
    onMintPremium != null &&
    (lockedPublication != null ||
      articleSavedToCanister !== true ||
      savedPublicationHandle === pubHandle);

  // Writers (non-editor members of the selected publication) can't publish —
  // only editors can. A writer submits the article to the publication's editor
  // review queue instead (saved as a publication draft), so the primary action
  // reads "Submit to publication" and routes as isDraft:true. Without this the only
  // action is "Publish", which the canister rejects with Unauthorized (NIC-269).
  const submitForReview =
    mode === "publish" &&
    pubHandle !== null &&
    selectedPub !== undefined &&
    selectedPub.isEditor === false;

  // Access (Everyone / Only subscribers) is a publish-time setting: the
  // canister stores isMembersOnly only on a published save and clears it on
  // any draft save, and a writer's submit-for-review is a draft the editor
  // manages inside the publication. So the field is publish-mode only.
  const showAccess = mode === "publish" && !submitForReview;
  // Category (NIC-536): only an editor of the selected publication files
  // the article; a writer's submission is filed later by the editor, and
  // My profile has no categories. The field hides itself when the
  // publication has none.
  const showCategory = pubHandle !== null && selectedPub?.isEditor === true;
  // Publish date & time (NIC-418): hidden in Draft mode, hidden for a
  // writer's "Submit to publication", and hidden when editing an already
  // published article - a future date there would rewrite the live
  // publish date and pull the article out of every feed.
  const showSchedule =
    mode === "publish" && !submitForReview && alreadyPublished !== true;
  const scheduledMs = showSchedule
    ? scheduleMsIfFuture(pubDate, pubTime, new Date())
    : null;
  // The canister rejects isMembersOnly:true unless the target (own profile,
  // or the publication) has subscriptions switched on. undefined = resolving.
  const subscriptionAvailable = useSubscriptionAvailable(pubHandle);
  const accessRef = useRef<HTMLDivElement>(null);
  const accessListId = "publish-access-listbox";

  // When the selected target has no subscriptions, treat membersOnly as false
  // (derived, not mutated) so the display and confirm payload both reset to
  // Everyone without a separate effect-driven setState.
  const effectiveMembersOnly = subscriptionAvailable === false ? false : membersOnly;

  // Ref wrapping the publish-to field + foldout panel for outside-click close.
  const publishToRef = useRef<HTMLDivElement>(null);
  const listId = "publish-to-listbox";

  // Escape: close foldout first; if already closed, call onBack (close the view).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // The mint step handles its own Escape (= its Back).
        if (mintShown) return;
        if (accessOpen) {
          setAccessOpen(false);
        } else if (timeOpen) {
          setTimeOpen(false);
        } else if (open) {
          setOpen(false);
        } else if (categoryOpen) {
          setCategoryOpen(false);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, accessOpen, timeOpen, categoryOpen, onBack, mintShown]);

  // Swapping to the mint step starts it at the top of the page; coming
  // Back puts focus on "Mint as premium" again (which also scrolls it
  // into view), since the step's own Back button is gone.
  const overlayRef = useRef<HTMLDivElement>(null);
  const mintButtonRef = useRef<HTMLButtonElement>(null);
  const wasMintShown = useRef(false);
  useEffect(() => {
    if (mintShown) {
      if (overlayRef.current) overlayRef.current.scrollTop = 0;
    } else if (wasMintShown.current) {
      mintButtonRef.current?.focus();
    }
    wasMintShown.current = mintShown;
  }, [mintShown]);

  // Close foldout on outside mousedown (mirror NotificationsFoldout pattern).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (publishToRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!accessOpen) return;
    const onDown = (e: MouseEvent) => {
      if (accessRef.current?.contains(e.target as Node)) return;
      setAccessOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [accessOpen]);

  const inFlightRef = useRef(false);
  const confirm = async () => {
    if (selected.length < 1 || inFlightRef.current) return;
    inFlightRef.current = true;
    setSaving(true);
    // Recompute at submit time: the pick can go stale while the panel
    // stays open, and a stale (past) pick must publish immediately.
    const ms = showSchedule
      ? scheduleMsIfFuture(pubDate, pubTime, new Date())
      : null;
    try {
      const ok = await onConfirm(
        selected,
        pubHandle,
        submitForReview,
        showAccess && effectiveMembersOnly,
        ms === null ? null : BigInt(ms),
        confirm,
        pubHandle === null ? "" : category,
      );
      if (ok) onBack();
    } finally {
      setSaving(false);
      inFlightRef.current = false;
    }
  };

  // Phone-only: keep the open foldout's listbox in view inside the sheet's
  // scroll region (the sheet is height-capped, unlike the desktop overlay).
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isMobile) return;
    if (!open && !accessOpen && !timeOpen && !categoryOpen) return;
    const listbox = scrollRef.current?.querySelector('[role="listbox"]');
    listbox?.scrollIntoView({ block: "nearest" });
  }, [isMobile, open, accessOpen, timeOpen, categoryOpen]);

  const displayLabel = pubHandle ?? c.personalOption;

  // A long name in a picker row (and in the Publish-to field itself,
  // below) ends in an ellipsis instead of wrapping (NIC-413 phone,
  // NIC-674 desktop).
  const pickerText = (text: string) => (
    <span className="min-w-0 truncate">{text}</span>
  );

  // A writer's submission keeps the "Publish" title (frames 2308:5902 /
  // 1:38254); only the primary button says what happens.
  const titleText = mode === "publish" ? c.titlePublish : c.titleDraft;

  const primaryLabel =
    mode === "publish"
      ? submitForReview
        ? c.submitForReviewButton
        : scheduledMs !== null
          ? publishScheduleCopy.scheduleButton
          : c.publishButton
      : c.saveDraftButton;

  const fields = (
    <>
      {/* Publish-to locked to the article's own publication (NIC-547 item 4):
          the existing disabled field look (same as Select category below), no
          chevron, no open state; kept in the tab order for screen readers. */}
      {lockedPublication && (
        <div className="flex flex-col gap-[calc(6*var(--fpx))]">
          <label id="publish-to-label" className="text-label font-bold text-ink">
            {c.publishToLabel}
          </label>
          <div
            role="combobox"
            aria-disabled="true"
            aria-expanded="false"
            aria-labelledby="publish-to-label"
            aria-describedby="publish-to-helper"
            tabIndex={0}
            className="flex h-[calc(48*var(--fpx))] w-full cursor-not-allowed select-none items-center justify-between rounded-[calc(6*var(--fpx))] border-2 border-ink-border-10 bg-ink-border-5 px-[calc(16*var(--fpx))] text-body text-ink-60 opacity-50"
          >
            <span>{lockedPublication.label}</span>
          </div>
          <p
            id="publish-to-helper"
            className="text-[length:calc(14*var(--fpx))] text-ink-60 mt-[calc(4*var(--fpx))]"
          >
            {c.lockedPublicationHelper
              .replace("{writer}", () => lockedPublication.writerHandle)
              .replace("{publication}", () => lockedPublication.label)}
          </p>
        </div>
      )}

      {/* Publish-to dropdown — hidden for personal-only users (NIC-72) */}
      {!lockedPublication && publications.length > 0 && (
        <div className="flex flex-col gap-[calc(6*var(--fpx))]">
          <label className="text-label font-bold text-ink">
            {c.publishToLabel}
          </label>
          {/* Relative wrapper for the foldout */}
          <div className="relative" ref={publishToRef}>
            <button
              type="button"
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => setOpen((o) => !o)}
              className={[
                "flex h-[calc(48*var(--fpx))] w-full items-center justify-between rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] text-body text-ink-80",
                open
                  ? "border-2 border-brand-purple bg-brand-purple-5"
                  : "border-2 border-ink-border-10 bg-ink-border-5",
              ].join(" ")}
            >
              <span className="min-w-0 truncate">{displayLabel}</span>
              <IconChevronDown className="size-[calc(24*var(--fpx))] shrink-0 text-ink-80" />
            </button>

            {/* Dark foldout panel (Figma 1:41888 — applied to Publish-to field) */}
            {open && (
              <ul
                id={listId}
                role="listbox"
                className={[
                  "absolute left-0 z-10 mt-[calc(8*var(--fpx))] w-full rounded-[calc(16*var(--fpx))] bg-ink p-[calc(20*var(--fpx))] shadow-purple-glow flex flex-col gap-[calc(4*var(--fpx))]",
                  // A long publication list scrolls inside the foldout
                  // (NIC-413 phone, NIC-674 desktop); 320 shows My
                  // profile + heading + 3 rows.
                  "max-h-[calc(320*var(--fpx))] overflow-y-auto",
                ].join(" ")}
              >
                {/* "My profile" option */}
                <li role="option" aria-selected={pubHandle === null}>
                  <button
                    type="button"
                    onClick={() => { setPubHandle(null); setCategory(""); setOpen(false); }}
                    className={[
                      "flex w-full items-center gap-[calc(16*var(--fpx))] rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white",
                      pubHandle === null
                        ? "bg-brand-purple-fluor-80 font-medium"
                        : "hover:bg-brand-purple-fluor-80",
                    ].join(" ")}
                  >
                    {pickerText(c.personalOption)}
                  </button>
                </li>
                {/* Muted "Publications (N)" heading: phone frame 2307:5902
                    (NIC-413), desktop frame 1:38249 (NIC-674). Visual
                    only - each option already names its publication, so
                    screen readers skip it. */}
                <li
                  role="presentation"
                  aria-hidden="true"
                  className={
                    isMobile
                      ? "flex h-[calc(44*var(--fpx))] shrink-0 items-center px-[calc(16*var(--fpx))] text-[length:calc(14*var(--fpx))] leading-[calc(17*var(--fpx))] font-medium text-white/50"
                      : "flex h-[calc(44*var(--fpx))] shrink-0 items-center px-[calc(16*var(--fpx))] pt-[calc(16*var(--fpx))] pb-[calc(4*var(--fpx))] text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] font-medium text-white/60"
                  }
                >
                  {publishSheetCopy.publicationsHeading.replace(
                    "{count}",
                    String(publications.length),
                  )}
                </li>
                {publications.map((pub) => (
                  <li
                    key={pub.publicationName}
                    role="option"
                    aria-selected={pubHandle === pub.publicationName}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        // Another publication = another category list.
                        if (pub.publicationName !== pubHandle) setCategory("");
                        setPubHandle(pub.publicationName);
                        setOpen(false);
                      }}
                      className={[
                        "flex w-full items-center gap-[calc(16*var(--fpx))] rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white",
                        pubHandle === pub.publicationName
                          ? "bg-brand-purple-fluor-80 font-medium"
                          : "hover:bg-brand-purple-fluor-80",
                      ].join(" ")}
                    >
                      {pickerText(pub.publicationName)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Writer submitting: what submitting means + a help link,
              link 8 below the text. Phone (NIC-413, frame 2308:5902):
              12 below the field, regular 60%. Desktop (NIC-674, frame
              1:38258): 32 below the field, medium 80%. */}
          {submitForReview && (
            <div
              className={
                isMobile
                  ? "mt-[calc(6*var(--fpx))] flex flex-col gap-[calc(8*var(--fpx))]"
                  : "mt-[calc(26*var(--fpx))] flex flex-col gap-[calc(8*var(--fpx))]"
              }
            >
              <p
                className={
                  isMobile
                    ? "text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] text-ink-60"
                    : "text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] font-medium text-ink-80"
                }
              >
                {publishSheetCopy.submitExplainer}
              </p>
              <a
                href={publishSheetCopy.moreOnPublicationsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[calc(32*var(--fpx))] items-center self-start text-[length:calc(16*var(--fpx))] leading-[calc(28*var(--fpx))] font-medium text-brand-purple hover:underline"
              >
                {publishSheetCopy.moreOnPublications}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Category (NIC-536, Figma 890:6572): editors of the selected
          publication only; hidden when it has no categories. Remounted per
          publication so its list and any in-flight add belong to one. */}
      {showCategory && pubHandle !== null && (
        <PublishCategoryField
          key={pubHandle}
          handle={pubHandle}
          value={category}
          onChange={setCategory}
          open={categoryOpen}
          onOpenChange={setCategoryOpen}
        />
      )}

      {/* Divider — hidden for personal-only users (NIC-72) */}
      {(lockedPublication || publications.length > 0) && (
        <hr className="w-full border-t border-ink-border/20" />
      )}

      {/* Topics block */}
      <div className="flex flex-col gap-[calc(6*var(--fpx))]">
        <span className="text-label font-bold text-ink">{c.topicsLabel}</span>
        {/* Tags helper. Desktop (NIC-675, frames 1:38254 / 1:38058 /
            1:38072): medium 16/24 80%, same as the submit explainer.
            Phone 14 / 60%. Spacing at every width (NIC-677): the
            column's 6 gap only, label -> helper 6 and helper -> field
            6, as drawn. */}
        <p
          className={
            isMobile
              ? "text-[length:calc(14*var(--fpx))] text-ink-60"
              : "text-[length:calc(16*var(--fpx))] leading-[calc(24*var(--fpx))] font-medium text-ink-80"
          }
        >
          {c.topicsDescription}
        </p>
        <TopicPicker selected={selected} onChange={setSelected} />
      </div>

      {/* Divider before the schedule row (frame 1:38058). */}
      {showSchedule && (
        <hr className="w-full border-t border-ink-border/20" />
      )}

      {/* Publish date & time (NIC-418). Publish mode only, and */}
      {/* not for an already-published article (see showSchedule). */}
      {showSchedule && (
        <PublishScheduleField
          date={pubDate}
          time={pubTime}
          onDateChange={setPubDate}
          onTimeChange={setPubTime}
          open={timeOpen}
          onOpenChange={setTimeOpen}
          scheduledMs={scheduledMs}
        />
      )}

      {/* Access: Everyone / Only subscribers (NIC-419). Publish mode only. */}
      {showAccess && (
        <div className="flex flex-col gap-[calc(6*var(--fpx))]">
          <label className="text-label font-bold text-ink">
            {publishAccessCopy.label}
          </label>
          <div className="relative" ref={accessRef}>
            <button
              type="button"
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={accessOpen}
              aria-controls={accessListId}
              onClick={() => setAccessOpen((o) => !o)}
              className={[
                "flex h-[calc(48*var(--fpx))] w-full items-center justify-between rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] text-body text-ink-80",
                accessOpen
                  ? "border-2 border-brand-purple bg-brand-purple-5"
                  : "border-2 border-ink-border-10 bg-ink-border-5",
              ].join(" ")}
            >
              <span>{effectiveMembersOnly ? publishAccessCopy.subscribersOnly : publishAccessCopy.everyone}</span>
              <IconChevronDown className="size-[calc(24*var(--fpx))] shrink-0 text-ink-80" />
            </button>
            {accessOpen && (
              <ul
                id={accessListId}
                role="listbox"
                className="absolute left-0 z-10 mt-[calc(8*var(--fpx))] w-full rounded-[calc(16*var(--fpx))] bg-ink p-[calc(20*var(--fpx))] shadow-purple-glow flex flex-col gap-[calc(4*var(--fpx))]"
              >
                <li role="option" aria-selected={!effectiveMembersOnly}>
                  <button
                    type="button"
                    onClick={() => { setMembersOnly(false); setAccessOpen(false); }}
                    className={[
                      "flex w-full items-center gap-[calc(16*var(--fpx))] rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white",
                      !effectiveMembersOnly
                        ? "bg-brand-purple-fluor-80 font-medium"
                        : "hover:bg-brand-purple-fluor-80",
                    ].join(" ")}
                  >
                    {publishAccessCopy.everyone}
                  </button>
                </li>
                <li role="option" aria-selected={effectiveMembersOnly} aria-disabled={subscriptionAvailable === false}>
                  <button
                    type="button"
                    disabled={subscriptionAvailable === false}
                    onClick={() => { setMembersOnly(true); setAccessOpen(false); }}
                    className={[
                      "flex w-full items-center gap-[calc(16*var(--fpx))] rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white",
                      subscriptionAvailable === false
                        ? "cursor-not-allowed text-white/50"
                        : effectiveMembersOnly
                          ? "bg-brand-purple-fluor-80 font-medium"
                          : "hover:bg-brand-purple-fluor-80",
                    ].join(" ")}
                  >
                    {publishAccessCopy.subscribersOnly}
                  </button>
                </li>
              </ul>
            )}
          </div>
          {subscriptionAvailable === false && (
            <p className="text-[length:calc(14*var(--fpx))] text-ink-60 mt-[calc(4*var(--fpx))]">
              {publishAccessCopy.subscribersUnavailable}
            </p>
          )}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        {/* Scrim - NUR/Overlay, ink @ 40% (matches the frame exactly). */}
        <div
          className="absolute inset-0 bg-ink/40"
          aria-hidden
          onClick={onBack}
        />
        <FocusTrap open>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={PUBLISH_VIEW_TITLE_ID}
            className="relative flex max-h-[85vh] flex-col rounded-t-[calc(16*var(--fpx))] bg-white"
          >
            {/* Drag handle */}
            <div
              aria-hidden
              className="mx-auto mt-[calc(12*var(--fpx))] h-[calc(4*var(--fpx))] w-[calc(36*var(--fpx))] rounded-[calc(2*var(--fpx))] bg-ink-border/20"
            />
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-[calc(24*var(--fpx))] pt-[calc(24*var(--fpx))] pb-[calc(24*var(--fpx))] flex flex-col gap-[calc(24*var(--fpx))]"
            >
              <h1
                id={PUBLISH_VIEW_TITLE_ID}
                className="text-lg font-bold text-ink"
              >
                {titleText}
              </h1>
              {fields}
            </div>
            {/* Footer - pinned below the scroll region. Mint (D-24, when
                shown) renders full-width above the Back|Primary pair. */}
            <div className="flex flex-col gap-[calc(12*var(--fpx))] px-[calc(24*var(--fpx))] pb-[calc(24*var(--fpx))]">
              {premiumEligible && !effectiveMembersOnly && (
                <Button
                  sx={{ ...secondaryButtonSx, width: "100%" }}
                  disabled={selected.length < 1 || saving}
                  onClick={() => {
                    if (selected.length >= 1 && pubHandle !== null) {
                      onMintPremium!(selected, pubHandle, category);
                    }
                  }}
                >
                  {cp.mintCta}
                </Button>
              )}
              <div className="flex w-full flex-wrap gap-x-[calc(15*var(--fpx))] gap-y-[calc(12*var(--fpx))]">
                <Button
                  sx={{ ...secondaryButtonSx, flex: "1 0 auto", whiteSpace: "nowrap" }}
                  startIcon={<IconChevronLeft className="size-[calc(24*var(--fpx))]" />}
                  onClick={onBack}
                >
                  {c.backToArticle}
                </Button>
                <Button
                  sx={{ ...primaryButtonSx, flex: "1 0 auto", whiteSpace: "nowrap" }}
                  disabled={selected.length < 1 || saving}
                  onClick={confirm}
                >
                  {primaryLabel}
                </Button>
              </div>
            </div>
          </div>
        </FocusTrap>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      ref={overlayRef}
      aria-labelledby={
        mintShown ? PREMIUM_MINT_VIEW_TITLE_ID : PUBLISH_VIEW_TITLE_ID
      }
      className="fixed inset-0 z-50 overflow-y-auto bg-white"
    >
      {/* Centered 666px column */}
      <div className="mx-auto flex w-full max-w-[calc(666*var(--fpx))] flex-col gap-[calc(32*var(--fpx))] px-6 pb-[calc(80*var(--fpx))] pt-12 lg:px-0 lg:pt-20">

        {mintShown ? (
          mintStep
        ) : (
          <>
            {/* Title */}
            <h1
              id={PUBLISH_VIEW_TITLE_ID}
              className="text-lg font-bold text-ink"
            >
              {titleText}
            </h1>

            {fields}

            {/* Buttons row */}
            <div className="flex w-full flex-col gap-[calc(12*var(--fpx))] lg:flex-row lg:items-center lg:justify-between">
              <Button
                sx={{ ...secondaryButtonSx, width: { xs: "100%", lg: "auto" } }}
                startIcon={<IconChevronLeft className="size-[calc(24*var(--fpx))]" />}
                onClick={onBack}
              >
                {c.backToArticle}
              </Button>
              <div className="flex flex-col gap-[calc(8*var(--fpx))] lg:flex-row lg:items-center">
                {premiumEligible && !effectiveMembersOnly && (
                  <Button
                    ref={mintButtonRef}
                    sx={{ ...secondaryButtonSx, width: { xs: "100%", lg: "auto" } }}
                    disabled={selected.length < 1 || saving}
                    onClick={() => {
                      if (selected.length >= 1 && pubHandle !== null) {
                        onMintPremium!(selected, pubHandle, category);
                      }
                    }}
                  >
                    {cp.mintCta}
                  </Button>
                )}
                <Button
                  sx={{ ...primaryButtonSx, width: { xs: "100%", lg: "auto" } }}
                  disabled={selected.length < 1 || saving}
                  onClick={confirm}
                >
                  {primaryLabel}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
