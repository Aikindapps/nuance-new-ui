import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodes, COMMAND_PRIORITY_EDITOR } from "lexical";
import { mergeRegister } from "@lexical/utils";
import {
  $createImageNode,
  ImageNode,
  INSERT_IMAGE_COMMAND,
} from "../nodes/ImageNode";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useToast } from "../../../../services/toast";

// Wires in-body images: the INSERT_IMAGE_COMMAND (inserts an ImageNode at the
// selection) plus paste-image and drop-image on the editable region. The block
// menu's "Insert image" item and the cover dropzone share the same
// useImageUpload pipeline (Storage chunked upload).
export function ImagesPlugin() {
  const [editor] = useLexicalComposerContext();
  const upload = useImageUpload();
  const { show } = useToast();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode is not registered");
    }

    const uploadAndInsert = async (file: File) => {
      try {
        const url = await upload(file);
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: "" });
      } catch (e) {
        show("Image upload failed. Please try again.", "error");
        console.error("[image upload]", e);
      }
    };

    const imageFiles = (list: FileList | undefined | null): File[] =>
      list
        ? Array.from(list).filter((f) => f.type.startsWith("image/"))
        : [];

    const onPaste = (event: ClipboardEvent) => {
      const images = imageFiles(event.clipboardData?.files);
      if (images.length === 0) return;
      event.preventDefault();
      images.forEach((f) => void uploadAndInsert(f));
    };

    const onDrop = (event: DragEvent) => {
      const images = imageFiles(event.dataTransfer?.files);
      if (images.length === 0) return;
      event.preventDefault();
      images.forEach((f) => void uploadAndInsert(f));
    };

    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    };

    const unregisterRoot = editor.registerRootListener((rootEl, prevRootEl) => {
      if (prevRootEl) {
        prevRootEl.removeEventListener("paste", onPaste);
        prevRootEl.removeEventListener("drop", onDrop);
        prevRootEl.removeEventListener("dragover", onDragOver);
      }
      if (rootEl) {
        rootEl.addEventListener("paste", onPaste);
        rootEl.addEventListener("drop", onDrop);
        rootEl.addEventListener("dragover", onDragOver);
      }
    });

    const unregisterCommand = editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        editor.update(() => {
          $insertNodes([$createImageNode(payload.src, payload.altText)]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    return mergeRegister(unregisterRoot, unregisterCommand);
  }, [editor, upload, show]);

  return null;
}
