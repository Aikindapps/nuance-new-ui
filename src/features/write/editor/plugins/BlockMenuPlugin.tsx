import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { IconPlus } from "../../../../components/ui/icons/IconPlus";
import { IconHeading2 } from "../../../../components/ui/icons/IconHeading2";
import { IconHeading3 } from "../../../../components/ui/icons/IconHeading3";
import { IconQuote } from "../../../../components/ui/icons/IconQuote";
import { IconImage } from "../../../../components/ui/icons/IconImage";
import { IconDivider } from "../../../../components/ui/icons/IconDivider";
import { IconList } from "../../../../components/ui/icons/IconList";
import { IconListOrdered } from "../../../../components/ui/icons/IconListOrdered";
import { insertDivider, setHeading, setQuote, toggleList } from "./blockActions";
import { INSERT_IMAGE_COMMAND } from "../nodes/ImageNode";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useToast } from "../../../../services/toast";

// "+" block-insert menu (Figma 1:37480) — a "+" in the left gutter, aligned to
// the caret's block, opens the dark foldout: Heading 2 · Heading 3 · Quote ·
// Insert image · Divider · Unordered list · Ordered list. "Insert image" is
// stubbed (disabled) until Chunk 5 wires the Storage upload. Rendered inside
// the editor's `relative` wrapper so the absolute "+" tracks the block.

const ICON = "size-[calc(24*var(--fpx))]";

export function BlockMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [pos, setPos] = useState<{ visible: boolean; top: number }>({
    visible: false,
    top: 0,
  });
  const [open, setOpen] = useState(false);
  const upload = useImageUpload();
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const url = await upload(file);
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: "" });
    } catch (e) {
      show("Image upload failed. Please try again.", "error");
      console.error("[image upload]", e);
    }
  };

  const update = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const root = editor.getRootElement();
      const wrapper = root?.parentElement ?? null;
      if (!$isRangeSelection(selection) || !root || !wrapper) {
        setPos((p) => (p.visible ? { ...p, visible: false } : p));
        return;
      }
      const anchorNode = selection.anchor.getNode();
      const topEl =
        anchorNode.getKey() === "root"
          ? null
          : anchorNode.getTopLevelElementOrThrow();
      const dom = topEl ? editor.getElementByKey(topEl.getKey()) : null;
      if (!dom) {
        setPos((p) => (p.visible ? { ...p, visible: false } : p));
        return;
      }
      const blockRect = dom.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      setPos({ visible: true, top: blockRect.top - wrapperRect.top });
    });
  }, [editor]);

  useEffect(() => editor.registerUpdateListener(() => update()), [editor, update]);

  // Close on any outside mousedown (e.g. clicking back into the text).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-block-menu]")) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!pos.visible) return null;

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <div
      data-block-menu
      className="absolute"
      style={{ top: pos.top, left: "calc(-44 * var(--fpx))" }}
    >
      <button
        type="button"
        aria-label="Insert block"
        aria-expanded={open}
        // Preserve the editor selection so the chosen block transform applies.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="flex size-[calc(32*var(--fpx))] items-center justify-center rounded-[calc(8*var(--fpx))] text-brand-purple transition-colors hover:bg-brand-purple-5"
      >
        <IconPlus className="size-[calc(20*var(--fpx))]" />
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleImageFile(e.target.files?.[0])}
      />

      {open && (
        <ul className="absolute left-0 top-[calc(40*var(--fpx))] z-50 flex w-[calc(284*var(--fpx))] flex-col gap-[calc(4*var(--fpx))] rounded-[calc(16*var(--fpx))] bg-ink p-[calc(20*var(--fpx))] shadow-purple-glow">
        <MenuItem label="Heading 2" onClick={() => run(() => setHeading(editor, "h2"))}>
          <IconHeading2 className={ICON} />
        </MenuItem>
        <MenuItem label="Heading 3" onClick={() => run(() => setHeading(editor, "h3"))}>
          <IconHeading3 className={ICON} />
        </MenuItem>
        <MenuItem label="Quote" onClick={() => run(() => setQuote(editor))}>
          <IconQuote className={ICON} />
        </MenuItem>
        <MenuItem
          label="Insert image"
          onClick={() => {
            setOpen(false);
            fileRef.current?.click();
          }}
        >
          <IconImage className={ICON} />
        </MenuItem>
        <MenuItem label="Divider" onClick={() => run(() => insertDivider(editor))}>
          <IconDivider className={ICON} />
        </MenuItem>
        <MenuItem label="Unordered list" onClick={() => run(() => toggleList(editor, "ul", false))}>
          <IconList className={ICON} />
        </MenuItem>
        <MenuItem label="Ordered list" onClick={() => run(() => toggleList(editor, "ol", false))}>
          <IconListOrdered className={ICON} />
        </MenuItem>
        </ul>
      )}
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        // Preserve the editor selection while clicking a menu item.
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={`flex w-full items-center gap-[calc(16*var(--fpx))] rounded-[calc(6*var(--fpx))] px-[calc(16*var(--fpx))] py-[calc(13*var(--fpx))] text-left text-[length:calc(18*var(--fpx))] leading-[calc(28*var(--fpx))] text-white ${
          disabled
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-brand-purple-fluor"
        }`}
      >
        <span className="shrink-0">{children}</span>
        {label}
      </button>
    </li>
  );
}
