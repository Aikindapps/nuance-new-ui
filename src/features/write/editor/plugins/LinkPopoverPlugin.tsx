import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";

// Link popover — appears when the caret sits inside a link. Shows the URL with
// Edit / Open / Remove. Editing uses window.prompt rather than an inline input
// to avoid the contenteditable selection-restoration dance; the buttons
// preventDefault on mousedown so the editor keeps the link selection while the
// command applies. Portalled to <body>.

type State = { visible: boolean; top: number; left: number; url: string };
const HIDDEN: State = { visible: false, top: 0, left: 0, url: "" };

export function LinkPopoverPlugin() {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<State>(HIDDEN);

  const update = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const root = editor.getRootElement();
      const nativeSelection = window.getSelection();
      if (
        !$isRangeSelection(selection) ||
        !root ||
        !nativeSelection ||
        nativeSelection.rangeCount === 0 ||
        !root.contains(nativeSelection.anchorNode)
      ) {
        setState((s) => (s.visible ? HIDDEN : s));
        return;
      }
      const node = selection.anchor.getNode();
      const linkNode = $isLinkNode(node)
        ? node
        : $findMatchingParent(node, $isLinkNode);
      if (!linkNode || !$isLinkNode(linkNode)) {
        setState((s) => (s.visible ? HIDDEN : s));
        return;
      }
      const rect = nativeSelection.getRangeAt(0).getBoundingClientRect();
      setState({
        visible: true,
        top: rect.bottom,
        left: rect.left,
        url: linkNode.getURL(),
      });
    });
  }, [editor]);

  useEffect(() => {
    const reposition = () => update();
    const cleanup = mergeRegister(
      editor.registerUpdateListener(() => update()),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          update();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      cleanup();
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [editor, update]);

  if (!state.visible) return null;

  const edit = () => {
    const next = window.prompt("Link URL", state.url);
    if (next === null) return; // cancelled
    editor.dispatchCommand(
      TOGGLE_LINK_COMMAND,
      next.trim() === "" ? null : next.trim(),
    );
  };
  const remove = () => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);

  return createPortal(
    <div
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        top: state.top + 8,
        left: state.left,
        zIndex: 60,
      }}
      className="flex max-w-[calc(360*var(--fpx))] items-center gap-[calc(12*var(--fpx))] rounded-[calc(8*var(--fpx))] bg-ink px-[calc(14*var(--fpx))] py-[calc(8*var(--fpx))] text-[length:calc(14*var(--fpx))] shadow-purple-glow"
    >
      <a
        href={state.url}
        target="_blank"
        rel="noopener noreferrer"
        // Allow this one to actually navigate on click.
        onMouseDown={(e) => e.stopPropagation()}
        className="max-w-[calc(220*var(--fpx))] truncate text-white/80 underline hover:text-white"
      >
        {state.url || "(empty)"}
      </a>
      <button
        type="button"
        onClick={edit}
        className="font-medium text-brand-purple-fluor"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={remove}
        aria-label="Remove link"
        className="font-medium text-white/60 hover:text-white"
      >
        Remove
      </button>
    </div>,
    document.body,
  );
}
