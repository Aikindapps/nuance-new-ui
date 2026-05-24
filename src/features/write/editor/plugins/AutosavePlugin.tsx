import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { saveDraft } from "../../../../services/autosave/store";

const DEBOUNCE_MS = 2000;

export type AutosaveProps = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  tagIds: string[];
  // Fired on a content change so the editor's "dirty" state can update.
  onChange?: () => void;
};

// Debounced browser autosave (decision #22). On editor content changes or form
// field changes, writes the Lexical editorState JSON + the fields to
// localStorage after a short idle. Browser-only — no canister call (that's the
// explicit Save in Chunk 7). Skips writing an entirely-empty draft so opening
// /write doesn't create a junk "new" slot.
export function AutosavePlugin({
  id,
  title,
  subtitle,
  coverUrl,
  tagIds,
  onChange,
}: AutosaveProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let timer: number | null = null;

    const flush = () => {
      const editorState = editor.getEditorState();
      const isEmpty = editorState.read(() => {
        const root = $getRoot();
        return (
          root.getTextContent().trim() === "" && root.getChildrenSize() <= 1
        );
      });
      if (isEmpty && !title.trim() && !subtitle.trim() && !coverUrl) return;
      saveDraft(id, {
        title,
        subtitle,
        coverUrl,
        tagIds,
        editorStateJson: JSON.stringify(editorState.toJSON()),
      });
    };

    const schedule = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        flush();
        timer = null;
      }, DEBOUNCE_MS);
    };

    const unregister = editor.registerUpdateListener(
      ({ dirtyElements, dirtyLeaves }) => {
        // Ignore pure selection moves (no content change).
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
        onChange?.();
        schedule();
      },
    );

    // A field change re-ran this effect — schedule a save with the new values.
    schedule();

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      unregister();
    };
  }, [editor, id, title, subtitle, coverUrl, tagIds, onChange]);

  return null;
}
