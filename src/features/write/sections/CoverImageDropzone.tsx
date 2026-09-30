import { useRef, useState } from "react";
import { writeArticleCopy, imageUploadCopy } from "../../../constants/copy";
import { useToast } from "../../../services/toast";
import { useImageUpload } from "../hooks/useImageUpload";
import { IllustrationNoImages } from "../../../components/ui/icons/IllustrationNoImages";

// Cover image dropzone (Figma NUR/Add image, node 1:37145). Click or drag/drop
// an image → Storage chunked upload (useImageUpload) → the returned URL becomes
// the article's headerImage. Once set, shows the cover with a Remove button.
// `phone` = the 393 empty dropzone (NIC-539, Figma 2676:6222): 361x119,
// radius 16, 2% fill, the two-photos illustration beside a 16/22 prompt.
// Padding is 16/48/16/24 net of the 2px border (Figma strokes sit inside).
export function CoverImageDropzone({
  value,
  onChange,
  phone = false,
}: {
  value: string;
  onChange: (url: string) => void;
  phone?: boolean;
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
      const msg = (e as Error)?.message;
      show(
        msg === writeArticleCopy.toasts.imageTooLarge
          ? msg
          : imageUploadCopy.uploadFailed,
        "error",
      );
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
        className={
          phone
            ? `flex w-full items-center gap-[calc(22*var(--fpx))] rounded-[calc(16*var(--fpx))] border-2 py-[calc(14*var(--fpx))] pl-[calc(22*var(--fpx))] pr-[calc(46*var(--fpx))] text-left transition-colors ${
                dragOver
                  ? "border-brand-purple bg-brand-purple-5"
                  : "border-ink-border-10 bg-ink-border/2"
              }`
            : `flex w-full items-center gap-[calc(22*var(--fpx))] rounded-card border-2 py-[calc(16*var(--fpx))] pl-[calc(24*var(--fpx))] pr-[calc(48*var(--fpx))] text-left transition-colors ${
                dragOver
                  ? "border-brand-purple bg-brand-purple-5"
                  : "border-ink-border-10 bg-ink-border-5"
              }`
        }
      >
        {phone && (
          <IllustrationNoImages className="h-[calc(87*var(--fpx))] w-[calc(108.75*var(--fpx))] shrink-0 text-ink-border" />
        )}
        <p
          className={
            phone
              ? "text-[length:calc(16*var(--fpx))] font-medium leading-[calc(22*var(--fpx))] text-ink-60"
              : "text-[length:calc(22*var(--fpx))] font-medium leading-[calc(32*var(--fpx))] text-ink-60"
          }
        >
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
