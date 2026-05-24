import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { LexicalEditor } from "lexical";
import { EDITOR_NODES } from "./nodes";

export const EDITOR_NAMESPACE = "nuance-write";

// The editor content area is wrapped in `.article-prose` (src/index.css),
// which styles by element selector (p, h2, blockquote, ul, a, strong, em …) —
// the SAME CSS the published ReadArticle body uses. So the write view is a
// true WYSIWYG of the published article, and the Lexical theme map stays
// empty: HeadingNode renders <h2>, QuoteNode <blockquote>, bold <strong>,
// etc. by default and `.article-prose` styles them. Classes get added here
// only if a later chunk needs editor-only state an element selector can't
// express.
const editorTheme = {};

export function createEditorConfig(
  onError: (error: Error) => void,
  initialStateJson?: string,
): InitialConfigType {
  return {
    namespace: EDITOR_NAMESPACE,
    nodes: [...EDITOR_NODES],
    theme: editorTheme,
    onError,
    // Restore from a saved editorState JSON — a browser autosave, or an edited
    // article's HTML→JSON. Loaded via the function form wrapped in try/catch so
    // a stale or unreadable saved state can NEVER crash the editor; it just
    // falls back to the default empty document. null = start empty.
    editorState: initialStateJson
      ? (editor: LexicalEditor) => {
          try {
            editor.setEditorState(editor.parseEditorState(initialStateJson));
          } catch (err) {
            console.warn("[editor] ignoring unreadable saved draft:", err);
          }
        }
      : null,
  };
}
