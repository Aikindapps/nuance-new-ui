import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import type { RefObject } from "react";
import type { LexicalEditor } from "lexical";
import { createEditorConfig } from "./editorConfig";
import { FloatingToolbarPlugin } from "./plugins/FloatingToolbarPlugin";
import { BlockMenuPlugin } from "./plugins/BlockMenuPlugin";
import { LinkPopoverPlugin } from "./plugins/LinkPopoverPlugin";
import { ImagesPlugin } from "./plugins/ImagesPlugin";
import { AutosavePlugin, type AutosaveProps } from "./plugins/AutosavePlugin";

// The Lexical body editor. Chunk 3: typing + history + lists + links, rendered
// inside `.article-prose` so the body looks exactly like the published
// article. The floating toolbar and "+" block menu (Chunk 4), image insertion
// (Chunk 5), autosave (Chunk 6), and HTML load/save (Chunk 7) attach as
// additional plugins later.
export function Editor({
  placeholder,
  initialStateJson,
  autosave,
  editorRef,
}: {
  placeholder: string;
  initialStateJson?: string;
  autosave?: AutosaveProps;
  // Exposes the editor instance to the action bar (HTML serialize on save).
  editorRef?: RefObject<LexicalEditor | null | undefined>;
}) {
  const initialConfig = createEditorConfig((error) => {
    // Don't swallow editor errors — surface them.
    console.error("[Lexical]", error);
    throw error;
  }, initialStateJson);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label="Article body"
              className="article-prose min-h-[calc(300*var(--fpx))] outline-none"
            />
          }
          placeholder={
            <p className="pointer-events-none absolute left-0 top-0 select-none font-serif text-[length:calc(22*var(--fpx))] leading-[calc(32*var(--fpx))] text-ink-40">
              {placeholder}
            </p>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <FloatingToolbarPlugin />
        <BlockMenuPlugin />
        <LinkPopoverPlugin />
        <ImagesPlugin />
        {autosave && <AutosavePlugin {...autosave} />}
        {editorRef && <EditorRefPlugin editorRef={editorRef} />}
      </div>
    </LexicalComposer>
  );
}
