import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { mergeRegister } from "@lexical/utils";
import { IconBold } from "../../../../components/ui/icons/IconBold";
import { IconItalic } from "../../../../components/ui/icons/IconItalic";
import { IconLink } from "../../../../components/ui/icons/IconLink";
import { IconHeading2 } from "../../../../components/ui/icons/IconHeading2";
import { IconHeading3 } from "../../../../components/ui/icons/IconHeading3";
import { IconList } from "../../../../components/ui/icons/IconList";
import { IconListOrdered } from "../../../../components/ui/icons/IconListOrdered";
import { ToolbarButton } from "./ToolbarButton";
import {
  $getActiveBlockType,
  $selectionInLink,
  formatText,
  toggleHeading,
  toggleList,
  type BlockType,
} from "./blockActions";

// Floating selection toolbar (Figma 1:37223) — appears over a non-empty text
// selection: Bold · Italic · Link │ H2 · H3 │ UL · OL. The AI button is
// intentionally dropped (decision #36). Positioned with fixed coords from the
// native selection rect; portalled to <body> so editor overflow can't clip it.

type State = {
  visible: boolean;
  top: number;
  left: number;
  bold: boolean;
  italic: boolean;
  block: BlockType;
};

const HIDDEN: State = {
  visible: false,
  top: 0,
  left: 0,
  bold: false,
  italic: false,
  block: "paragraph",
};

const ICON = "size-[calc(24*var(--fpx))]";

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<State>(HIDDEN);

  const update = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const root = editor.getRootElement();
      if (
        !$isRangeSelection(selection) ||
        selection.isCollapsed() ||
        !root ||
        !nativeSelection ||
        nativeSelection.rangeCount === 0 ||
        !root.contains(nativeSelection.anchorNode)
      ) {
        setState((s) => (s.visible ? HIDDEN : s));
        return;
      }
      const rect = nativeSelection.getRangeAt(0).getBoundingClientRect();
      setState({
        visible: true,
        top: rect.top,
        left: rect.left + rect.width / 2,
        bold: selection.hasFormat("bold"),
        italic: selection.hasFormat("italic"),
        block: $getActiveBlockType(),
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

  const toggleLink = () => {
    const inLink = editor.getEditorState().read(() => $selectionInLink());
    if (inLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    const url = window.prompt("Link URL");
    if (url && url.trim()) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url.trim());
    }
  };

  if (!state.visible) return null;

  return createPortal(
    <div
      // Keep the editor's selection alive while a button is clicked.
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        top: state.top,
        left: state.left,
        transform: "translate(-50%, calc(-100% - 8px))",
        zIndex: 60,
      }}
      role="toolbar"
      aria-label="Text formatting"
      className="flex items-center gap-[calc(16*var(--fpx))] rounded-[calc(8*var(--fpx))] bg-ink px-[calc(16*var(--fpx))] py-[calc(10*var(--fpx))] shadow-purple-glow"
    >
      <ToolbarButton
        label="Bold"
        active={state.bold}
        onClick={() => formatText(editor, "bold")}
      >
        <IconBold className={ICON} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={state.italic}
        onClick={() => formatText(editor, "italic")}
      >
        <IconItalic className={ICON} />
      </ToolbarButton>
      <ToolbarButton label="Link" onClick={toggleLink}>
        <IconLink className={ICON} />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        label="Heading 2"
        active={state.block === "h2"}
        onClick={() => toggleHeading(editor, "h2", state.block === "h2")}
      >
        <IconHeading2 className={ICON} />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={state.block === "h3"}
        onClick={() => toggleHeading(editor, "h3", state.block === "h3")}
      >
        <IconHeading3 className={ICON} />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        label="Bulleted list"
        active={state.block === "ul"}
        onClick={() => toggleList(editor, "ul", state.block === "ul")}
      >
        <IconList className={ICON} />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={state.block === "ol"}
        onClick={() => toggleList(editor, "ol", state.block === "ol")}
      >
        <IconListOrdered className={ICON} />
      </ToolbarButton>
    </div>,
    document.body,
  );
}

function Divider() {
  return (
    <span className="h-[calc(16*var(--fpx))] w-px shrink-0 rounded-full bg-white/20" />
  );
}
