import { $getRoot, $insertNodes, createEditor } from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { EDITOR_NODES } from "../editor/nodes";

// Convert stored article HTML into a Lexical editorState JSON string, so the
// editor can restore an existing article via initialConfig.editorState — the
// same path the browser autosave uses. Headless (no React mount); the reverse
// of serializeEditorHtml. Covers the legacy-Quill tag set (decision #36).
export function htmlToEditorStateJson(html: string): string {
  const editor = createEditor({
    nodes: [...EDITOR_NODES],
    onError: (error) => {
      throw error;
    },
  });
  editor.update(
    () => {
      const dom = new DOMParser().parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.select();
      $insertNodes(nodes);
    },
    { discrete: true },
  );
  return JSON.stringify(editor.getEditorState().toJSON());
}
