import { useRef } from "react";
import { registerModalCopy } from "../../constants/copy";

// AvatarPicker -- NIC-272, Figma 1:1366 "Avatar image" frame.
//
// Presentational: all state is owned by the parent (RegisterModal). Shows a
// 119x119 circular area (matching the Figma "Add image" frame: radius 300,
// fill #373A49 @2%, stroke #373A49 @10% 2 px). When previewUrl is null a
// neutral image-placeholder silhouette is rendered with CSS only -- no new
// asset. When a preview is set the image fills the circle via object-cover.
//
// Clicking the circle or the "Add a profile picture" label opens the hidden
// file input. Re-picking the same file is handled by resetting input.value
// after each pick so onChange always fires.

type AvatarPickerProps = {
  previewUrl: string | null;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
};

export function AvatarPicker({
  previewUrl,
  onSelectFile,
  onRemove,
}: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset immediately so re-picking the same file re-fires onChange.
    e.target.value = "";
    if (file && file.type.startsWith("image/")) {
      onSelectFile(file);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Section label -- "Select an avatar image", Figma: 700 16/24 #202123 */}
      <span className="text-label font-bold text-ink">
        {registerModalCopy.avatarSectionLabel}
      </span>

      <div className="flex items-center gap-4">
        {/* Circular avatar area -- 119x119, Figma: fill #373A49 @2%, stroke
            #373A49 @10% 2px, radius 300 (fully circular) */}
        <button
          type="button"
          onClick={openPicker}
          aria-label={previewUrl ? registerModalCopy.avatarChangeLabel : registerModalCopy.avatarAddLabel}
          className="size-[119px] shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-ink-border-10 bg-ink-border-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-purple"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={registerModalCopy.avatarAlt}
              className="size-full object-cover"
            />
          ) : (
            // Neutral placeholder: a simple "photo" icon built from CSS/SVG
            // using the design's muted tones -- no new asset/dependency.
            <span
              aria-hidden="true"
              className="flex size-full items-center justify-center"
            >
              <svg
                width="38"
                height="38"
                viewBox="0 0 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Outer photo-frame rectangle */}
                <rect
                  x="1"
                  y="1"
                  width="36"
                  height="36"
                  rx="2.486"
                  fill="white"
                  stroke="#202123"
                  strokeWidth="1.554"
                />
                {/* Inner picture rectangle */}
                <rect
                  x="4"
                  y="7"
                  width="30"
                  height="24"
                  rx="1.864"
                  fill="white"
                  stroke="#202123"
                  strokeWidth="1.554"
                />
                {/* Mountain / landscape path */}
                <path
                  d="M4 24 L12 16 L19 22 L25 17 L34 28 L4 28 Z"
                  fill="rgba(55,58,73,0.10)"
                />
                {/* Sun / circle */}
                <circle
                  cx="11"
                  cy="14"
                  r="2.5"
                  fill="rgba(55,58,73,0.05)"
                  stroke="#202123"
                  strokeWidth="1.554"
                />
              </svg>
            </span>
          )}
        </button>

        {/* Label / action links beside the circle */}
        <div className="flex flex-col gap-1">
          {!previewUrl ? (
            <button
              type="button"
              onClick={openPicker}
              className="text-label font-medium text-brand-purple hover:underline focus-visible:underline"
            >
              {registerModalCopy.avatarAddLabel}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={openPicker}
                className="text-left text-label font-medium text-brand-purple hover:underline focus-visible:underline"
              >
                {registerModalCopy.avatarChangeLabel}
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="text-left text-label font-medium text-ink-60 hover:text-error hover:underline focus-visible:underline"
              >
                {registerModalCopy.avatarRemoveLabel}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hidden file input -- value reset after each pick (see handleChange).
          className="hidden" (display:none) removes it from the tab order; the
          circle button is the sole keyboard/SR entry point (Fix 1, NIC-272 r2). */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
