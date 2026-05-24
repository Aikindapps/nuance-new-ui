import { $getRoot, type LexicalEditor } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { hardenLinks } from "../../../lib/htmlSanitize";

// Serialize the editor body to sanitized HTML for the canister `content` field
// (decision #36). $generateHtmlFromNodes runs inside a read; hardenLinks adds
// rel="noopener noreferrer" to target links, matching the read renderer and
// the legacy markup. The read side still DOMPurify-sanitizes (security
// boundary) — this is the clean-emit side.
export function serializeEditorHtml(editor: LexicalEditor): string {
  let html = "";
  editor.getEditorState().read(() => {
    html = $generateHtmlFromNodes(editor, null);
  });
  return hardenLinks(html);
}

// True when the body has no text and no block content (just an empty
// paragraph) — the canister rejects an empty body.
export function isEditorEmpty(editor: LexicalEditor): boolean {
  return editor.getEditorState().read(() => {
    const root = $getRoot();
    return root.getTextContent().trim() === "" && root.getChildrenSize() <= 1;
  });
}
