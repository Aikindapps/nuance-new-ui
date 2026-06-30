import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { PublishView } from "./sections/PublishView";
import {
  LEAVE_GUARD_TITLE_ID,
  LeaveGuardDialog,
} from "./sections/LeaveGuardDialog";
import { PreviewOverlay } from "./sections/PreviewOverlay";
import { Editor } from "./editor/Editor";
import { useSavePost } from "./hooks/useSavePost";
import type { EditArticleInitial } from "./hooks/useEditArticle";
import { isEditorEmpty, serializeEditorHtml } from "./lib/htmlSerialize";
import { useMyProfile } from "../../lib/useMyProfile";

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
}: {
  initial?: EditArticleInitial;
  initialPublication?: string;
}) {
  const navigate = useNavigate();
  const modal = useModal();
  const { show } = useToast();
  const saveMutation = useSavePost();

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
    if (initial?.isPublication && initial.publicationHandle) {
      return initial.publicationHandle;
    }
    if (initialPublication) {
      const lower = initialPublication.toLowerCase();
      const match = myPublications.find(
        (p) => p.publicationName.toLowerCase() === lower,
      );
      return match ? match.publicationName : null;
    }
    return null;
  }, [initial, initialPublication, myPublications]);

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

  // The single canister write. Validates body + tags (canister-enforced),
  // builds the save model (publication or personal), captures the returned
  // postId, and clears the local autosave slot. Returns the saved Post or null.
  // `pubHandle` defaults to the form-level publicationHandle state so that
  // direct (non-modal) save paths (handleSave, handleBack's onSaveDraft) work
  // without passing an explicit argument.
  const doSave = useCallback(
    async (
      isDraft: boolean,
      tags: string[],
      pubHandle: string | null = publicationHandle,
    ): Promise<Post | null> => {
      const editor = editorRef.current;
      if (!editor) return null;
      // Guard: a publication save requires a resolved author handle. If the
      // profile query hasn't resolved yet, myHandle is "" — block the submit
      // so we never send creatorHandle:"" to the canister.
      if (pubHandle && !myHandle) {
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
      const model: PostSaveModel = pubHandle
        ? {
            postId,
            title: title.trim(),
            subtitle: subtitle.trim(),
            content,
            headerImage: coverUrl,
            isDraft,
            tagIds: tags,
            category: "",
            handle: pubHandle,
            creatorHandle: myHandle,
            isPublication: true,
            isMembersOnly: false,
          }
        : {
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
      try {
        const post = await saveMutation.mutateAsync(model);
        clearDraft(postId || DRAFT_NEW_ID);
        setPostId(post.postId);
        setTagIds(tags);
        setDirty(false);
        return post;
      } catch (e) {
        show((e as Error).message || C.toasts.saveFailed, "error");
        return null;
      }
    },
    [postId, title, subtitle, coverUrl, myHandle, publicationHandle, saveMutation, show],
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
    const post = await doSave(isPublished ? false : true, tagIds);
    if (post) {
      show(isPublished ? C.toasts.changesSaved : C.toasts.savedDraft, "success");
    }
  }, [isPublished, tagIds, doSave, show, openPublish]);

  const handleBack = useCallback(() => {
    if (!dirty) {
      navigate(MY_ARTICLES);
      return;
    }
    modal.open(
      <LeaveGuardDialog
        saving={saveMutation.isPending}
        onCancel={() => modal.close()}
        onLeave={() => {
          clearDraft(autosaveId);
          modal.close();
          navigate(MY_ARTICLES);
        }}
        onSaveDraft={async () => {
          if (tagIds.length < 1) {
            modal.close();
            openPublish(isPublished ? "publish" : "draft");
            return;
          }
          const post = await doSave(isPublished ? false : true, tagIds);
          if (post) {
            show(
              isPublished ? C.toasts.changesSaved : C.toasts.savedDraft,
              "success",
            );
            modal.close();
            navigate(MY_ARTICLES);
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
    tagIds,
    doSave,
    show,
    openPublish,
    autosaveId,
    isPublished,
  ]);

  const statusText = dirty ? C.unsavedChanges : postId ? C.saved : C.notSavedYet;

  return (
    <article className="flex flex-col gap-[calc(50*var(--fpx))]">
      {/* Breadcrumb row — Back + Draft status + saved-state. */}
      <div className="flex items-center gap-3 px-6 py-3 lg:px-24">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex size-8 shrink-0 items-center justify-center rounded-[calc(4*var(--fpx))] text-brand-purple transition-colors hover:bg-brand-purple-5"
        >
          <IconBack className="size-[calc(18*var(--fpx))]" />
        </button>
        <StatusTag label={isPublished ? C.statusPublished : C.statusDraft} />
        <span className="text-body text-ink-60">{statusText}</span>
      </div>

      {/* Header — title, subtitle, cover dropzone. */}
      <div className="flex flex-col gap-[calc(32*var(--fpx))] px-6 lg:px-24">
        <AutoGrowTextarea
          value={title}
          onChange={(v) => {
            setTitle(v);
            setDirty(true);
          }}
          placeholder={C.titlePlaceholder}
          ariaLabel="Article title"
          className="text-title-md font-extrabold text-ink md:text-title-lg lg:text-title-xl"
        />
        <AutoGrowTextarea
          value={subtitle}
          onChange={(v) => {
            setSubtitle(v);
            setDirty(true);
          }}
          placeholder={C.subtitlePlaceholder}
          ariaLabel="Article subtitle"
          className="text-lg font-medium text-ink-80"
        />
        <CoverImageDropzone
          value={coverUrl}
          onChange={(url) => {
            setCoverUrl(url);
            setDirty(true);
          }}
        />
      </div>

      {/* Body — Lexical editor in .article-prose. */}
      <div className="px-6 lg:px-24">
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

      <ActionBar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPreview={handlePreview}
        onSave={handleSave}
        saveLabel={isPublished ? C.actionBar.saveChanges : C.actionBar.saveDraft}
        onContinue={() => openPublish("publish")}
        saving={saveMutation.isPending}
      />

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
          onBack={() => setPublishView(null)}
          onConfirm={async (picked, chosenPub) => {
            if (chosenPub !== publicationHandle) {
              userChangedTarget.current = true;
            }
            setPublicationHandle(chosenPub);
            const post = await doSave(
              publishView.mode === "publish" ? false : true,
              picked,
              chosenPub,
            );
            if (post) {
              if (publishView.mode === "publish") {
                // Re-publishing an already-live article = saving changes.
                show(
                  isPublished ? C.toasts.changesSaved : C.toasts.published,
                  "success",
                );
                navigate(post.url || "/");
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
