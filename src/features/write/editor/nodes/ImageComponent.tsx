import { $getNodeByKey, type NodeKey } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

// The in-editor rendering of an ImageNode: the <img> plus a hover "remove"
// button. Lives in its own file so ImageNode.tsx exports only node values
// (react-refresh/only-export-components).
export function ImageComponent({
  src,
  altText,
  nodeKey,
}: {
  src: string;
  altText: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const remove = () => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove();
    });
  };
  return (
    <span className="group relative block">
      <img src={src} alt={altText} />
      <button
        type="button"
        onClick={remove}
        aria-label="Remove image"
        className="absolute right-[calc(12*var(--fpx))] top-[calc(12*var(--fpx))] hidden size-[calc(32*var(--fpx))] items-center justify-center rounded-full bg-ink/80 text-[length:calc(20*var(--fpx))] leading-none text-white group-hover:flex"
      >
        ×
      </button>
    </span>
  );
}
