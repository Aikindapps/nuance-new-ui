import { $getRoot, $nodesOfType, type LexicalEditor } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { hardenLinks } from "../../../lib/htmlSanitize";
import { ImageNode } from "../editor/nodes/ImageNode";

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

// True when the body has neither text nor media — the canister rejects an
// empty body. A photo-only or divider-only article counts as content (PR #9
// review M3): image and horizontal-rule nodes carry no text, so a plain
// text-empty check would wrongly block them from being saved or published.
export function isEditorEmpty(editor: LexicalEditor): boolean {
  return editor.getEditorState().read(() => {
    if ($getRoot().getTextContent().trim() !== "") return false;
    return (
      $nodesOfType(ImageNode).length === 0 &&
      $nodesOfType(HorizontalRuleNode).length === 0
    );
  });
}
