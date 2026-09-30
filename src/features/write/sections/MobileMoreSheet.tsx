import { writeArticleCopy } from "../../../constants/copy";
import { IconPreview } from "../../../components/ui/icons/IconPreview";
import { EditorBottomSheet, EditorSheetRow } from "./EditorBottomSheet";
import { MobileActionBar } from "./MobileActionBar";
import { editorMobileCopy } from "./editorMobileCopy";

// Phone "More" sheet (NIC-539, Figma 2681:3278): Preview and Save as draft
// ("Save changes" on a published article), then Cancel. No SEO row (D-32).
// The action pill is lifted above the sheet with More highlighted; its
// More button closes the sheet again.
export function MobileMoreSheet({
  onClose,
  onPreview,
  onSave,
  saveLabel,
  saving,
  onUndo,
  onRedo,
  onContinue,
}: {
  onClose: () => void;
  onPreview: () => void;
  onSave: () => void;
  saveLabel: string;
  saving: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onContinue: () => void;
}) {
  return (
    <EditorBottomSheet
      title={editorMobileCopy.moreTitle}
      onClose={onClose}
      above={
        <div className="px-[calc(16*var(--fpx))] pb-[calc(16*var(--fpx))]">
          <MobileActionBar
            placement="raised"
            moreOpen
            onUndo={onUndo}
            onRedo={onRedo}
            onMore={onClose}
            onContinue={onContinue}
            saving={saving}
          />
        </div>
      }
    >
      <EditorSheetRow
        icon={<IconPreview className="size-[calc(24*var(--fpx))]" />}
        label={writeArticleCopy.actionBar.preview}
        onClick={onPreview}
      />
      <EditorSheetRow
        icon={<DraftIcon />}
        label={saveLabel}
        onClick={onSave}
        disabled={saving}
      />
    </EditorBottomSheet>
  );
}

// Document glyph for the Save row (Figma 2681:3278): 16x20 outline, radius
// 2, two text lines. currentColor.
function DraftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-[calc(24*var(--fpx))]"
      aria-hidden
    >
      <rect
        x="4"
        y="2"
        width="16"
        height="20"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect x="8" y="9" width="8" height="2" rx="1" fill="currentColor" />
      <rect x="8" y="13" width="8" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}
