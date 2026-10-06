import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { REDO_COMMAND, UNDO_COMMAND, type LexicalEditor } from "lexical";
import { IconBack } from "../../components/ui/icons/IconBack";
import { writeArticleCopy } from "../../constants/copy";
import { useModal } from "../../services/modal";
import { useToast } from "../../services/toast";
import {
  DRAFT_NEW_ID,
  clearDraft,
  loadDraft,
} from "../../services/autosave/store";
import type { Post, PostSaveModel } from "../../candid/PostCore/PostCore";
import { AutoGrowTextarea } from "./sections/AutoGrowTextarea";
import { StatusTag } from "./sections/StatusTag";
import { CoverImageDropzone } from "./sections/CoverImageDropzone";
import { ActionBar } from "./sections/ActionBar";
import { MobileActionBar } from "./sections/MobileActionBar";
import { MobileEditorTopBar } from "./sections/MobileEditorTopBar";
import { MobileMoreSheet } from "./sections/MobileMoreSheet";
import { editorMobileCopy } from "./sections/editorMobileCopy";
import { PublishView } from "./sections/PublishView";
import {
  PremiumMintView,
  PREMIUM_MINT_VIEW_TITLE_ID,
} from "./sections/PremiumMintView";
import {
  LEAVE_GUARD_TITLE_ID,
  LeaveGuardDialog,
} from "./sections/LeaveGuardDialog";
import { PreviewOverlay } from "./sections/PreviewOverlay";
import { Editor } from "./editor/Editor";
import { useSavePost } from "./hooks/useSavePost";
import { useMigratePost } from "./hooks/useMigratePost";
import type { EditArticleInitial } from "./hooks/useEditArticle";
import { isEditorEmpty, serializeEditorHtml } from "./lib/htmlSerialize";
import { useMyProfile } from "../../lib/useMyProfile";
import { useIsMobileViewport } from "../../lib/useIsMobileViewport";
import { publishSheetCopy } from "./sections/publishSheetCopy";
import {
  clockHHMM,
  formatClock12h,
  formatGoesLive,
  localDateISO,
} from "./lib/publishSchedule";
import { publishScheduleCopy } from "./sections/publishScheduleCopy";
import { MY_ARTICLES_RETURN, type WriteReturn } from "./lib/writeReturn";

const C = writeArticleCopy;
const MY_ARTICLES = "/my-articles";

// The article authoring surface — Figma 1:37452 (editor column) + action bar.
// Handles both a new article (restored from the browser autosave) and editing
// an existing one (`initial`, loaded from the canister). Save as draft +
// Publish both require a non-empty body and 1–3 topics (the canister enforces
// it — decision #37). Title/subtitle/cover live in local state; the body lives
// in Lexical (read via editorRef on save).
export function WriteArticleForm({
  initial,
  initialPublication,
  back = MY_ARTICLES_RETURN,
}: {
  initial?: EditArticleInitial;
  initialPublication?: string;
  // Where Back and the leave guard go (NIC-548): My articles by default, the
  // publication's Manage Articles list when the editor came from there.
  back?: WriteReturn;
}) {
  const navigate = useNavigate();
  const modal = useModal();
  const { show } = useToast();
  const saveMutation = useSavePost();
  const migrateMutation = useMigratePost();
  const queryClient = useQueryClient();
  // A publication save changes that publication's Manage Articles rows
  // (status, category): mark its cached list stale so the next visit
  // re-reads it (NIC-536). The route handle may differ in case.
  const markManageArticlesStale = useCallback(
    (pub: string) =>
      void queryClient.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === "manage-articles" &&
          typeof q.queryKey[1] === "string" &&
          q.queryKey[1].toLowerCase() === pub.toLowerCase(),
      }),
    [queryClient],
  );

  // Profile — used to build the publication-write model and to populate the
  // "Publish to" selector in the dialog. myPublications is memoized to keep a
  // stable reference (avoids react-hooks/exhaustive-deps churn for useMemo /
  // useCallback that depend on it).
  const { data: me } = useMyProfile();
  const myHandle = me?.handle ?? "";
  const myPublications = useMemo(
    () => me?.publicationsArray ?? [],
    [me?.publicationsArray],
  );

  // An existing publication article stays in its publication and keeps its
  // writer (D-111, NIC-547). The save always names the post's own raw handle
  // (PostCore looks publications up by exact case; a miss turns the save into
  // a personal save that the canister refuses), the original writer, and the
  // post's category (a publication save rewrites the category every time).
  // The label shown in the Publish panel is the user's publication entry,
  // matched case-insensitively (same idiom as ?publication=).
  const lockedPubHandle =
    initial?.isPublication && initial.publicationHandle
      ? initial.publicationHandle
      : null;
  const lockedPubLabel = useMemo((): string | null => {
    if (lockedPubHandle === null) return null;
    const lower = lockedPubHandle.toLowerCase();
    const match = myPublications.find(
      (p) => p.publicationName.toLowerCase() === lower,
    );
    return match ? match.publicationName : lockedPubHandle;
  }, [lockedPubHandle, myPublications]);
  const creditHandle =
    initial?.isPublication && initial.creatorHandle
      ? initial.creatorHandle
      : myHandle;
  // The article's category in its publication (NIC-536), exactly as stored
  // (never trimmed). Seeded from an existing publication article, updated
  // when the Publish panel confirms; personal saves always send "".
  const [articleCategory, setArticleCategory] = useState(
    lockedPubHandle !== null ? (initial?.category ?? "") : "",
  );

  // Editing → seed from the loaded article. New → restore the browser autosave.
  const restored = useMemo(
    () => (initial ? null : loadDraft(DRAFT_NEW_ID)),
    [initial],
  );
  const source = initial ?? restored;
  const [title, setTitle] = useState(source?.title ?? "");
  const [subtitle, setSubtitle] = useState(source?.subtitle ?? "");
  const [coverUrl, setCoverUrl] = useState(source?.coverUrl ?? "");
  const [tagIds, setTagIds] = useState<string[]>(source?.tagIds ?? []);
  const [postId, setPostId] = useState(initial?.postId ?? "");
  // Track the publication the post is currently homed in on the canister so
  // doSave can decide whether to use the two-step migrate path (personal draft
  // → publication) or the direct publication save (new/already-pub article).
  const [savedPubHandle, setSavedPubHandle] = useState<string | null>(
    initial?.isPublication ? (initial.publicationHandle ?? null) : null,
  );
  // Access (Everyone / Only subscribers). Seeded from the loaded article;
  // the canister only keeps the flag on published articles, so a draft
  // opens as Everyone. Updated when the Publish panel confirms.
  const [membersOnly, setMembersOnly] = useState(initial?.isMembersOnly ?? false);
  // Editing starts clean (matches canister); a restored new draft starts dirty.
  const [dirty, setDirty] = useState(initial ? false : restored != null);
  // Editing a live article: save in place ("Save changes", isDraft:false) so it
  // stays published instead of being silently unpublished (decision #38). New
  // articles and drafts keep the "Save as draft" path.
  const isPublished = initial?.isPublished ?? false;

  // Resolve the initial publication target:
  //   1. Editing a publication post — use the canister-truth handle.
  //   2. A ?publication=<handle> query param — match case-insensitively against
  //      the user's publications and use the canonical publicationName.
  //   3. Default to personal (null).
  const initialTarget = useMemo((): string | null => {
    if (lockedPubLabel !== null) {
      return lockedPubLabel;
    }
    if (initialPublication) {
      const lower = initialPublication.toLowerCase();
      const match = myPublications.find(
        (p) => p.publicationName.toLowerCase() === lower,
      );
      return match ? match.publicationName : null;
    }
    return null;
  }, [lockedPubLabel, initialPublication, myPublications]);

  // Form-level publication target: null = personal ("My profile").
  const [publicationHandle, setPublicationHandle] = useState<string | null>(
    initialTarget,
  );

  // Track whether the user has explicitly chosen a destination in the modal.
  // If not, we sync publicationHandle when initialTarget resolves (i.e. when
  // the profile loads after the first render for the ?publication= flow).
  const userChangedTarget = useRef(false);

  useEffect(() => {
    if (!userChangedTarget.current && initialTarget !== null) {
      setPublicationHandle(initialTarget);
    }
  }, [initialTarget]);

  // Publish / Save-as-draft view state. null = hidden; { mode } = open.
  // Replaces the old modal.open(<PublishModal/>) pattern — the view renders
  // as a fixed full-surface overlay so the Lexical editor stays mounted.
  const [publishView, setPublishView] = useState<{ mode: "draft" | "publish" } | null>(null);
  // Desktop: the limited-edition mint setup open as a step inside the
  // Publish view (null = the Publish content). Phone uses a bottom sheet.
  const [mintTarget, setMintTarget] = useState<{
    tags: string[];
    pubH: string;
    category: string;
  } | null>(null);
  const isMobile = useIsMobileViewport();
  // Phone: the action pill's More sheet (Preview, Save) is open (NIC-539).
  const [moreOpen, setMoreOpen] = useState(false);

  // Preview snapshot — populated when the writer clicks Preview; reading the
  // editor at click time keeps the overlay decoupled from the editor's live
  // state, so opening preview doesn't re-render the editor and closing it
  // returns the writer to the same place untouched.
  const [previewSnapshot, setPreviewSnapshot] = useState<{
    title: string;
    subtitle: string;
    coverUrl: string;
    bodyHtml: string;
    modifiedMs: string;
  } | null>(null);

  const editorRef = useRef<LexicalEditor | null | undefined>(null);
  const markDirty = useCallback(() => setDirty(true), []);
  const autosaveId = postId || DRAFT_NEW_ID;

  const handleUndo = useCallback(
    () => editorRef.current?.dispatchCommand(UNDO_COMMAND, undefined),
    [],
  );
  const handleRedo = useCallback(
    () => editorRef.current?.dispatchCommand(REDO_COMMAND, undefined),
    [],
  );

  const handlePreview = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    // Snapshot the editor body as HTML at click time; PreviewOverlay renders
    // it through the same ArticleBody / .article-prose path as the published
    // read view. "Modified now" reflects that this is the current unsaved
    // state, not the canister copy.
    setPreviewSnapshot({
      title,
      subtitle,
      coverUrl,
      bodyHtml: serializeEditorHtml(editor),
      modifiedMs: String(Date.now()),
    });
  }, [title, subtitle, coverUrl]);

  // The canister write path. Validates body + tags (canister-enforced), then:
  //  • Personal post (pubHandle falsy): single PostCore.save call.
  //  • Publication post, new article (postId="") OR already a pub post
  //    (savedPubHandle≠null): single PostCore.save call with isPublication:true.
  //  • Publication post, existing personal draft (postId≠"" && savedPubHandle===null):
  //    TWO-STEP — save as personal draft first (so the canister records a bucket
  //    home), then call PostBucket.migratePostToPublication which records the
  //    creator unconditionally. This fixes the empty-byline bug (decision #36
  //    addendum): a plain update-to-publication save never sets the creator field.
  // `pubHandle` defaults to the form-level publicationHandle state so that
  // direct (non-modal) save paths (handleSave, handleBack's onSaveDraft) work
  // without passing an explicit argument.
  const doSave = useCallback(
    async (
      isDraft: boolean,
      tags: string[],
      pubHandle: string | null = publicationHandle,
      premium?: { thumbnail: string; icpPrice: bigint; maxSupply: bigint },
      isMembersOnly: boolean = false,
      scheduled: bigint | null = null,
      failure?: { message: string; retry: () => void },
      category: string = articleCategory,
    ): Promise<Post | null> => {
      const editor = editorRef.current;
      if (!editor) return null;
      // An existing publication article always saves to its own publication,
      // whatever the panel passed (NIC-547 item 4, D-138).
      const target = lockedPubHandle ?? pubHandle;
      // Guard: a publication save requires a resolved author handle. If the
      // profile query hasn't resolved yet, myHandle is "" — block the submit
      // so we never send creatorHandle:"" to the canister.
      if (target && !creditHandle) {
        show(C.toasts.saveFailed, "error");
        return null;
      }
      if (isEditorEmpty(editor)) {
        show(C.toasts.emptyBody, "error");
        return null;
      }
      const content = serializeEditorHtml(editor);
      if (content.length > 300_000) {
        show(C.toasts.tooLong, "error");
        return null;
      }
      if (tags.length < 1) {
        show(C.toasts.needTopic, "error");
        return null;
      }

      // Only ever schedule a FIRST publish: a future date on an already
      // published article rewrites its publish date and hides it.
      const scheduleMs =
        !isDraft && scheduled != null && !isPublished
          ? scheduled
          : null;

      try {
        if (target) {
          // Existing personal draft being moved into a publication for the first
          // time: two-step migrate so the creator is recorded by the bucket.
          // Premium mints always use the direct pub-save path (no migrate).
          if (postId !== "" && savedPubHandle === null && !premium) {
            const personalModel: PostSaveModel = {
              postId,
              title: title.trim(),
              subtitle: subtitle.trim(),
              content,
              headerImage: coverUrl,
              isDraft: true, // must be draft for migratePostToPublication auth check
              tagIds: tags,
              category: "",
              handle: "",
              creatorHandle: "",
              isPublication: false,
              isMembersOnly: false,
            };
            const saved = await saveMutation.mutateAsync(personalModel);
            // The canister keeps isMembersOnly only on a published save and
            // migratePostToPublication cannot set it either, so both a
            // subscribers-only publish AND a scheduled publish
            // migrate as a draft first, then publish with one
            // direct publication save that carries the flag(s)
            // (never live as public). The migrate never carries a
            // category either (NIC-536), so a chosen category takes the
            // same route; that second save keeps the requested draft state.
            const publishMembersOnly = !isDraft && isMembersOnly;
            const twoStepPublish =
              publishMembersOnly || scheduleMs != null || category !== "";
            const migrated = await migrateMutation.mutateAsync({
              bucketCanisterId: saved.bucketCanisterId,
              postId: saved.postId,
              publicationHandle: target,
              isDraft: twoStepPublish ? true : isDraft,
            });
            // PostBucket Post (migrate) and PostCore Post (save) are structurally identical here.
            const result: Post = twoStepPublish
              ? await saveMutation.mutateAsync({
                  postId: migrated.postId,
                  title: title.trim(),
                  subtitle: subtitle.trim(),
                  content,
                  headerImage: coverUrl,
                  isDraft,
                  tagIds: tags,
                  category,
                  handle: target,
                  creatorHandle: myHandle,
                  isPublication: true,
                  isMembersOnly: publishMembersOnly,
                  ...(scheduleMs != null
                    ? { scheduledPublishedDate: scheduleMs }
                    : {}),
                })
              : migrated;
            markManageArticlesStale(target);
            clearDraft(postId || DRAFT_NEW_ID);
            setPostId(result.postId);
            setTagIds(tags);
            setDirty(false);
            setSavedPubHandle(target);
            return result;
          }
          // New article (isNew) or already a publication post: direct pub save.
          // Also used for premium mints (forced, isDraft:false, isPublication:true).
          const pubModel: PostSaveModel = {
            postId,
            title: title.trim(),
            subtitle: subtitle.trim(),
            content,
            headerImage: coverUrl,
            isDraft: premium ? false : isDraft,
            tagIds: tags,
            category,
            handle: target,
            creatorHandle: creditHandle,
            isPublication: true,
            isMembersOnly,
            ...(premium ? { premium } : {}),
            ...(scheduleMs != null
              ? { scheduledPublishedDate: scheduleMs }
              : {}),
          };
          const post = await saveMutation.mutateAsync(pubModel);
          markManageArticlesStale(target);
          clearDraft(postId || DRAFT_NEW_ID);
          setPostId(post.postId);
          setTagIds(tags);
          setDirty(false);
          setSavedPubHandle(target);
          return post;
        }
        // Personal (My profile) save — unchanged.
        const personalModel: PostSaveModel = {
          postId,
          title: title.trim(),
          subtitle: subtitle.trim(),
          content,
          headerImage: coverUrl,
          isDraft,
          tagIds: tags,
          category: "",
          handle: "", // personal post — canister derives the caller's handle
          creatorHandle: "",
          isPublication: false,
          isMembersOnly: false,
        };
        const post = await saveMutation.mutateAsync({
          ...personalModel,
          // Access chosen in the Publish panel (Everyone -> false, unchanged).
          isMembersOnly,
          ...(scheduleMs != null
            ? { scheduledPublishedDate: scheduleMs }
            : {}),
        });
        clearDraft(postId || DRAFT_NEW_ID);
        setPostId(post.postId);
        setTagIds(tags);
        setDirty(false);
        setSavedPubHandle(null);
        return post;
      } catch (e) {
        if (failure) {
          show(failure.message, "error", {
            actionLabel: publishSheetCopy.retry,
            onAction: failure.retry,
          });
        } else {
          show((e as Error).message || C.toasts.saveFailed, "error");
        }
        return null;
      }
    },
    [
      postId,
      savedPubHandle,
      title,
      subtitle,
      coverUrl,
      myHandle,
      publicationHandle,
      saveMutation,
      migrateMutation,
      show,
      isPublished,
      lockedPubHandle,
      creditHandle,
      articleCategory,
      markManageArticlesStale,
    ],
  );

  const openPublish = useCallback(
    (mode: "draft" | "publish") => {
      setPublishView({ mode });
    },
    [],
  );

  const handleSave = useCallback(async () => {
    // Editing a published article saves in place and stays live (decision #38);
    // a new/draft article saves as a draft. Both need ≥1 topic (canister), so
    // route through the modal to pick topics the first time; once chosen, this
    // saves directly.
    if (tagIds.length < 1) {
      openPublish(isPublished ? "publish" : "draft");
      return;
    }
    const post = await doSave(isPublished ? false : true, tagIds, publicationHandle, undefined, isPublished && membersOnly);
    if (post) {
      show(isPublished ? C.toasts.changesSaved : C.toasts.savedDraft, "success");
    }
  }, [isPublished, tagIds, doSave, show, openPublish, publicationHandle, membersOnly]);

  // Phone Save (More sheet, NIC-539): the same save as handleSave, but a
  // failed save shows "Couldn't save changes." with Retry, which re-runs the
  // latest version of this save (Figma 2685:6296).
  const sheetSaveRef = useRef<() => void>(() => {});
  const handleSheetSave = useCallback(async () => {
    if (tagIds.length < 1) {
      openPublish(isPublished ? "publish" : "draft");
      return;
    }
    const post = await doSave(
      isPublished ? false : true,
      tagIds,
      publicationHandle,
      undefined,
      isPublished && membersOnly,
      null,
      {
        message: editorMobileCopy.saveFailedToast,
        retry: () => sheetSaveRef.current(),
      },
    );
    if (post) {
      show(isPublished ? C.toasts.changesSaved : C.toasts.savedDraft, "success");
    }
  }, [isPublished, tagIds, doSave, show, openPublish, publicationHandle, membersOnly]);
  useEffect(() => {
    sheetSaveRef.current = () => void handleSheetSave();
  }, [handleSheetSave]);

  const handleBack = useCallback(() => {
    if (!dirty) {
      navigate(back.to);
      return;
    }
    modal.open(
      <LeaveGuardDialog
        saving={saveMutation.isPending || migrateMutation.isPending}
        onCancel={() => modal.close()}
        onLeave={() => {
          clearDraft(autosaveId);
          modal.close();
          navigate(back.to);
        }}
        onSaveDraft={async () => {
          if (tagIds.length < 1) {
            modal.close();
            openPublish(isPublished ? "publish" : "draft");
            return;
          }
          const post = await doSave(isPublished ? false : true, tagIds, publicationHandle, undefined, isPublished && membersOnly);
          if (post) {
            show(
              isPublished ? C.toasts.changesSaved : C.toasts.savedDraft,
              "success",
            );
            modal.close();
            navigate(back.to);
          }
        }}
        saveLabel={isPublished ? C.actionBar.saveChanges : C.actionBar.saveDraft}
      />,
      { ariaLabelledBy: LEAVE_GUARD_TITLE_ID, dismissable: true },
    );
  }, [
    dirty,
    navigate,
    modal,
    saveMutation.isPending,
    migrateMutation.isPending,
    tagIds,
    doSave,
    show,
    openPublish,
    autosaveId,
    isPublished,
    membersOnly,
    publicationHandle,
    back.to,
  ]);

  const statusText = dirty ? C.unsavedChanges : postId ? C.saved : C.notSavedYet;
  const saving = saveMutation.isPending || migrateMutation.isPending;
  const saveLabel = isPublished ? C.actionBar.saveChanges : C.actionBar.saveDraft;
  const backLabel = back.fromPublication ? back.label : "Go back";

  // The limited-edition mint setup. Phone: bottom sheet via the modal
  // service; desktop: a step inside PublishView (mintStep). `close` leaves
  // the setup (Back); Publish = save with premium, then close, toast and
  // navigate to the article.
  const mintView = (
    tags: string[],
    pubH: string,
    category: string,
    close: () => void,
  ) => (
    <PremiumMintView
      post={{ title, subtitle, coverUrl }}
      handle={creditHandle}
      tagIds={tags}
      publicationHandle={pubH}
      onCancel={close}
      onMint={async (premium) => {
        const post = await doSave(
          false,
          tags,
          pubH,
          premium,
          false,
          null,
          undefined,
          category,
        );
        if (post) {
          close();
          setPublishView(null);
          show(C.toasts.published, "success");
          navigate(post.url || "/");
          return true;
        }
        return false;
      }}
    />
  );

  // Phone (<=1023) is the 393 layout of the same screen (NIC-539, Figma
  // 2676:6222 / 2678:6252 / 2681:3278): focused top bar, 16 inset, 34/40
  // title, the floating pill and the More sheet. Desktop markup unchanged.
  return (
    <article className={isMobile ? "flex flex-col" : "flex flex-col gap-[calc(50*var(--fpx))]"}>
      {isMobile ? (
        <MobileEditorTopBar
          onBack={handleBack}
          backLabel={backLabel}
          status={isPublished ? C.statusPublished : C.statusDraft}
          caption={statusText}
        />
      ) : (
        // Breadcrumb row: Back + Draft status + saved-state.
        <div className="flex items-center gap-3 px-6 py-3 lg:px-24">
          <button
            type="button"
            onClick={handleBack}
            aria-label={backLabel}
            className="flex size-8 shrink-0 items-center justify-center rounded-[calc(4*var(--fpx))] text-brand-purple transition-colors hover:bg-brand-purple-5"
          >
            <IconBack className="size-[calc(18*var(--fpx))]" />
          </button>
          <StatusTag label={isPublished ? C.statusPublished : C.statusDraft} />
          <span className="text-body text-ink-60">{statusText}</span>
        </div>
      )}

      {/* Header — title, subtitle, cover dropzone. */}
      <div
        className={
          isMobile
            ? "flex flex-col gap-[calc(16*var(--fpx))] px-[calc(16*var(--fpx))] pt-[calc(16*var(--fpx))]"
            : "flex flex-col gap-[calc(32*var(--fpx))] px-6 lg:px-24"
        }
      >
        <AutoGrowTextarea
          value={title}
          onChange={(v) => {
            setTitle(v);
            setDirty(true);
          }}
          placeholder={C.titlePlaceholder}
          ariaLabel="Article title"
          className={
            isMobile
              ? "text-[length:calc(34*var(--fpx))] font-extrabold leading-[calc(40*var(--fpx))] text-ink"
              : "text-title-md font-extrabold text-ink md:text-title-lg lg:text-title-xl"
          }
        />
        <AutoGrowTextarea
          value={subtitle}
          onChange={(v) => {
            setSubtitle(v);
            setDirty(true);
          }}
          placeholder={C.subtitlePlaceholder}
          ariaLabel="Article subtitle"
          className={
            isMobile
              ? "-mt-[calc(8*var(--fpx))] text-[length:calc(20*var(--fpx))] font-medium leading-[calc(28*var(--fpx))] text-ink-60"
              : "text-lg font-medium text-ink-80"
          }
          placeholderClassName="placeholder:text-ink-60"
        />
        <CoverImageDropzone
          value={coverUrl}
          onChange={(url) => {
            setCoverUrl(url);
            setDirty(true);
          }}
          phone={isMobile}
        />
      </div>

      {/* Body — Lexical editor in .article-prose. */}
      <div className={isMobile ? "px-[calc(16*var(--fpx))] pt-[calc(16*var(--fpx))]" : "px-6 lg:px-24"}>
        <Editor
          placeholder={C.bodyPlaceholder}
          initialStateJson={source?.editorStateJson}
          editorRef={editorRef}
          autosave={{
            id: autosaveId,
            title,
            subtitle,
            coverUrl,
            tagIds,
            onChange: markDirty,
          }}
        />
      </div>

      {/* Clearance so the fixed action bar never covers the last line. */}
      <div aria-hidden className="h-[calc(140*var(--fpx))]" />

      {isMobile ? (
        // Off while the Publish panel is open, so its toasts keep their
        // usual place.
        !publishView && (
          <MobileActionBar
            onUndo={handleUndo}
            onRedo={handleRedo}
            onMore={() => setMoreOpen(true)}
            moreOpen={moreOpen}
            onContinue={() => openPublish("publish")}
            saving={saving}
          />
        )
      ) : (
        <ActionBar
          onUndo={handleUndo}
          onRedo={handleRedo}
          onPreview={handlePreview}
          onSave={handleSave}
          saveLabel={saveLabel}
          onContinue={() => openPublish("publish")}
          saving={saving}
        />
      )}

      {isMobile && moreOpen && (
        <MobileMoreSheet
          onClose={() => setMoreOpen(false)}
          onPreview={() => {
            setMoreOpen(false);
            handlePreview();
          }}
          onSave={() => {
            setMoreOpen(false);
            void handleSheetSave();
          }}
          saveLabel={saveLabel}
          saving={saving}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onContinue={() => {
            setMoreOpen(false);
            openPublish("publish");
          }}
        />
      )}

      {previewSnapshot && (
        <PreviewOverlay
          {...previewSnapshot}
          isPublished={isPublished}
          onClose={() => setPreviewSnapshot(null)}
        />
      )}

      {publishView && (
        <PublishView
          mode={publishView.mode}
          initialTagIds={tagIds}
          publications={myPublications}
          initialPublicationHandle={publicationHandle}
          coverPresent={coverUrl !== ""}
          articleSavedToCanister={postId !== ""}
          savedPublicationHandle={savedPubHandle}
          initialMembersOnly={membersOnly}
          initialCategory={articleCategory}
          alreadyPublished={isPublished}
          lockedPublication={
            lockedPubLabel !== null
              ? { label: lockedPubLabel, writerHandle: creditHandle }
              : null
          }
          mintStep={
            mintTarget
              ? mintView(
                  mintTarget.tags,
                  mintTarget.pubH,
                  mintTarget.category,
                  () => setMintTarget(null),
                )
              : null
          }
          onMintPremium={(tags, pubH, category) => {
            // Guard: migrate path not needed (article is new, already in this
            // pub, or an existing publication article locked to its own pub).
            const migrateNotNeeded =
              lockedPubHandle !== null || postId === "" || savedPubHandle === pubH;
            if (!migrateNotNeeded) return;
            if (!isMobile) {
              setMintTarget({ tags, pubH, category });
              return;
            }
            modal.open(
              mintView(tags, pubH, category, () => modal.close()),
              { ariaLabelledBy: PREMIUM_MINT_VIEW_TITLE_ID, dismissable: false },
            );
          }}
          onBack={() => {
            setMintTarget(null);
            setPublishView(null);
          }}
          onConfirm={async (
            picked,
            chosenPub,
            submitForReview,
            chosenMembersOnly,
            scheduledPublishedDate,
            retry,
            chosenCategory,
          ) => {
            if (chosenPub !== publicationHandle) {
              userChangedTarget.current = true;
            }
            setPublicationHandle(chosenPub);
            setArticleCategory(chosenCategory);
            // A writer submitting into a publication routes the article to the
            // editor review queue — saved as a publication draft (isDraft:true)
            // rather than published, since only editors may publish (NIC-269).
            const isDraft =
              publishView.mode === "publish" ? submitForReview : true;
            setMembersOnly(chosenMembersOnly);
            // The "actually publishing now" path (publish mode, not an
            // already-published article being re-saved) gets the error+Retry
            // toast (NIC-412), and so does a writer's submission into a
            // publication (NIC-413) - every other path keeps today's plain
            // error toast.
            const failure =
              publishView.mode !== "publish"
                ? undefined
                : submitForReview
                  ? { message: publishSheetCopy.submitFailedToast, retry }
                  : !isPublished
                    ? { message: publishSheetCopy.publishFailedToast, retry }
                    : undefined;
            const post = await doSave(
              isDraft,
              picked,
              chosenPub,
              undefined,
              chosenMembersOnly,
              scheduledPublishedDate,
              failure,
              chosenCategory,
            );
            if (post) {
              if (publishView.mode === "publish") {
                if (submitForReview) {
                  show(C.toasts.submittedForReview, "success");
                  navigate(MY_ARTICLES);
                } else if (isPublished) {
                  // Re-publishing an already-live article = saving changes.
                  show(C.toasts.changesSaved, "success");
                  navigate(post.url || "/");
                } else {
                  const successMessage =
                    scheduledPublishedDate === null
                      ? publishSheetCopy.publishedToast
                      : publishScheduleCopy.goesLive
                          .replace(
                            "{date}",
                            formatGoesLive(
                              localDateISO(new Date(Number(scheduledPublishedDate))),
                            ),
                          )
                          .replace(
                            "{time}",
                            formatClock12h(
                              clockHHMM(new Date(Number(scheduledPublishedDate))),
                            ),
                          );
                  show(successMessage, "success");
                  navigate(post.url || "/");
                }
              } else {
                show(C.toasts.savedDraft, "success");
              }
            }
            return post !== null;
          }}
        />
      )}
    </article>
  );
}
