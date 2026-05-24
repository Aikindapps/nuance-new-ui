import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
  type TextFormatType,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $isLinkNode } from "@lexical/link";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { $findMatchingParent, $getNearestNodeOfType } from "@lexical/utils";

// Block-transform + selection-read helpers shared by the floating toolbar and
// the "+" block menu (Chunk 4). The $-prefixed readers must run inside an
// editor.read()/update() scope; the editor-arg actions manage their own scope.

export type BlockType =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "quote"
  | "ul"
  | "ol"
  | "paragraph";

// The block type at the current selection. Call inside editor.read().
export function $getActiveBlockType(): BlockType {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return "paragraph";
  const anchorNode = selection.anchor.getNode();
  const list = $getNearestNodeOfType(anchorNode, ListNode);
  if (list && $isListNode(list)) {
    return list.getListType() === "number" ? "ol" : "ul";
  }
  const element =
    anchorNode.getKey() === "root"
      ? anchorNode
      : anchorNode.getTopLevelElementOrThrow();
  if ($isHeadingNode(element)) {
    const tag = element.getTag();
    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") return tag;
    return "h2";
  }
  if ($isQuoteNode(element)) return "quote";
  return "paragraph";
}

// True when the selection sits inside a link. Call inside editor.read().
export function $selectionInLink(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return false;
  const node = selection.anchor.getNode();
  return $isLinkNode(node) || $findMatchingParent(node, $isLinkNode) !== null;
}

export function formatText(editor: LexicalEditor, format: TextFormatType) {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
}

export function setHeading(editor: LexicalEditor, tag: HeadingTagType) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createHeadingNode(tag));
    }
  });
}

export function setQuote(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createQuoteNode());
    }
  });
}

export function setParagraph(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createParagraphNode());
    }
  });
}

// Toolbar toggles: clicking H2 when already H2 reverts to paragraph, etc.
export function toggleHeading(
  editor: LexicalEditor,
  tag: "h2" | "h3",
  active: boolean,
) {
  if (active) setParagraph(editor);
  else setHeading(editor, tag);
}

export function toggleList(
  editor: LexicalEditor,
  kind: "ul" | "ol",
  active: boolean,
) {
  if (active) {
    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
  } else {
    editor.dispatchCommand(
      kind === "ul"
        ? INSERT_UNORDERED_LIST_COMMAND
        : INSERT_ORDERED_LIST_COMMAND,
      undefined,
    );
  }
}

export function insertDivider(editor: LexicalEditor) {
  editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
}
