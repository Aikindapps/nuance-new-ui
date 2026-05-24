import { useRef, useState } from "react";
import { writeArticleCopy } from "../../../constants/copy";
import { useToast } from "../../../services/toast";
import { useImageUpload } from "../hooks/useImageUpload";

// Cover image dropzone (Figma NUR/Add image, node 1:37145). Click or drag/drop
// an image → Storage chunked upload (useImageUpload) → the returned URL becomes
// the article's headerImage. Once set, shows the cover with a Remove button.
export function CoverImageDropzone({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const upload = useImageUpload();
  const { show } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      onChange(await upload(file));
    } catch (e) {
      show("Cover upload failed. Please try again.", "error");
      console.error("[cover upload]", e);
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="relative w-full overflow-hidden rounded-card">
        <img
          src={value}
          alt="Article cover"
          className="aspect-[820/474] w-full object-cover"
        />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-[calc(12*var(--fpx))] top-[calc(12*var(--fpx))] rounded-full bg-ink/80 px-[calc(12*var(--fpx))] py-[calc(4*var(--fpx))] text-[length:calc(14*var(--fpx))] text-white"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex w-full items-center gap-[calc(22*var(--fpx))] rounded-card border-2 py-[calc(16*var(--fpx))] pl-[calc(24*var(--fpx))] pr-[calc(48*var(--fpx))] text-left transition-colors ${
          dragOver
            ? "border-brand-purple bg-brand-purple-5"
            : "border-ink-border-10 bg-ink-border-5"
        }`}
      >
        <p className="text-[length:calc(22*var(--fpx))] font-medium leading-[calc(32*var(--fpx))] text-ink-60">
          {uploading ? (
            "Uploading…"
          ) : (
            <>
              {writeArticleCopy.coverPrompt}
              <span className="text-brand-purple underline">
                {writeArticleCopy.coverChooseFile}
              </span>
            </>
          )}
        </p>
      </button>
    </>
  );
}
