import { useCallback, useMemo, useRef, useState } from "react";
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
import {
  PUBLISH_MODAL_TITLE_ID,
  PublishModal,
} from "./sections/PublishModal";
import {
  LEAVE_GUARD_TITLE_ID,
  LeaveGuardDialog,
} from "./sections/LeaveGuardDialog";
import { Editor } from "./editor/Editor";
import { useSavePost } from "./hooks/useSavePost";
import type { EditArticleInitial } from "./hooks/useEditArticle";
import { isEditorEmpty, serializeEditorHtml } from "./lib/htmlSerialize";

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
}: {
  initial?: EditArticleInitial;
}) {
  const navigate = useNavigate();
  const modal = useModal();
  const { show } = useToast();
  const saveMutation = useSavePost();

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

  // The single canister write. Validates body + tags (canister-enforced),
  // builds the personal-post model, captures the returned postId, and clears
  // the local autosave slot. Returns the saved Post or null.
  const doSave = useCallback(
    async (isDraft: boolean, tags: string[]): Promise<Post | null> => {
      const editor = editorRef.current;
      if (!editor) return null;
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
      const model: PostSaveModel = {
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
    [postId, title, subtitle, coverUrl, saveMutation, show],
  );

  const openPublish = useCallback(
    (mode: "draft" | "publish") => {
      modal.open(
        <PublishModal
          mode={mode}
          initialTagIds={tagIds}
          onConfirm={async (picked) => {
            const post = await doSave(mode === "publish" ? false : true, picked);
            if (post) {
              if (mode === "publish") {
                show(C.toasts.published, "success");
                navigate(post.url || "/");
              } else {
                show(C.toasts.savedDraft, "success");
              }
            }
            return post !== null;
          }}
        />,
        { ariaLabelledBy: PUBLISH_MODAL_TITLE_ID, dismissable: true },
      );
    },
    [modal, tagIds, doSave, show, navigate],
  );

  const handleSaveDraft = useCallback(async () => {
    // Drafts also need topics (canister). Route through the modal to pick them
    // the first time; once chosen, "Save as draft" saves directly.
    if (tagIds.length >= 1) {
      const post = await doSave(true, tagIds);
      if (post) show(C.toasts.savedDraft, "success");
    } else {
      openPublish("draft");
    }
  }, [tagIds, doSave, show, openPublish]);

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
            openPublish("draft");
            return;
          }
          const post = await doSave(true, tagIds);
          if (post) {
            show(C.toasts.savedDraft, "success");
            modal.close();
            navigate(MY_ARTICLES);
          }
        }}
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
        <StatusTag label={C.statusDraft} />
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
        onSaveDraft={handleSaveDraft}
        onContinue={() => openPublish("publish")}
        saving={saveMutation.isPending}
      />
    </article>
  );
}
