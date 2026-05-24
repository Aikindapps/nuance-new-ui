import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import type { Klass, LexicalNode } from "lexical";
import { ImageNode } from "./nodes/ImageNode";

// The node set the editor (and the HTML round-trip) registers. Covers the
// full legacy-Quill tag universe probed from mainnet (decision #36):
// a, blockquote, br, em, h1/h2/h3, img, li, ol/ul, p, pre, span, strong.
//
// CodeNode/CodeHighlightNode are registered for IMPORT ONLY (never offered in
// the block menu or toolbar) so that old `pre.ql-syntax` code blocks don't
// drop their content when an existing article is re-edited.
export const EDITOR_NODES: ReadonlyArray<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  HorizontalRuleNode,
  CodeNode,
  CodeHighlightNode,
  ImageNode,
];
