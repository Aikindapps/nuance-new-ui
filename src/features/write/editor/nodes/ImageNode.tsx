import { createCommand, DecoratorNode } from "lexical";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import type { JSX } from "react";
import { ImageComponent } from "./ImageComponent";

export type SerializedImageNode = Spread<
  { src: string; altText: string },
  SerializedLexicalNode
>;

// Dispatched by ImagesPlugin / the block menu to insert an uploaded image.
export const INSERT_IMAGE_COMMAND: LexicalCommand<{
  src: string;
  altText: string;
}> = createCommand("INSERT_IMAGE_COMMAND");

// Block-level image node. Lexical has no built-in image node, so this is
// custom. It stores only the Storage-canister URL + alt text. `exportDOM`
// emits a bare <img> (no <figure> wrapper) so saved/round-tripped HTML matches
// the read renderer's `.article-prose img` and the legacy Quill markup
// (decision #36). `decorate` renders the editor view (ImageComponent: image +
// remove button); the upload pipeline lives in useImageUpload + ImagesPlugin.
export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  constructor(src: string, altText = "", key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (element: HTMLElement): DOMConversionOutput => {
          const img = element as HTMLImageElement;
          return {
            node: new ImageNode(
              img.getAttribute("src") ?? "",
              img.getAttribute("alt") ?? "",
            ),
          };
        },
        priority: 0,
      }),
    };
  }

  static importJSON(json: SerializedImageNode): ImageNode {
    return new ImageNode(json.src, json.altText);
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    if (this.__altText) element.setAttribute("alt", this.__altText);
    return { element };
  }

  isInline(): false {
    return false;
  }

  createDOM(): HTMLElement {
    // Block-level decorator host; the <img> is rendered by decorate().
    return document.createElement("div");
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        nodeKey={this.getKey()}
      />
    );
  }
}

export function $createImageNode(src: string, altText = ""): ImageNode {
  return new ImageNode(src, altText);
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
