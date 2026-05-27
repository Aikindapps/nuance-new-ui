import { writeArticleCopy } from "../../../constants/copy";
import { IconUndo } from "../../../components/ui/icons/IconUndo";
import { IconRedo } from "../../../components/ui/icons/IconRedo";
import { IconPreview } from "../../../components/ui/icons/IconPreview";

// Bottom action bar (Figma NUR / Action bar, "Writing"): fixed, centered,
// purple-gradient pill. Undo · Redo │ Preview · Save · Continue. The AI "SEO"
// button is the deferred AI feature (decision #36); everything else from
// the Figma action bar is wired.
export function ActionBar({
  onUndo,
  onRedo,
  onPreview,
  onSave,
  saveLabel,
  onContinue,
  saving,
}: {
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  // Secondary save: "Save as draft" for new/draft articles, "Save changes" for
  // an already-published one (preserves published state — decision #38).
  onSave: () => void;
  saveLabel: string;
  onContinue: () => void;
  saving: boolean;
}) {
  const c = writeArticleCopy.actionBar;
  return (
    <div className="bg-brand-gradient fixed bottom-[calc(24*var(--fpx))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-[calc(16*var(--fpx))] rounded-[calc(24*var(--fpx))] border-t border-white/20 p-[calc(16*var(--fpx))] shadow-purple-glow-medium">
      <div className="flex items-center gap-[calc(4*var(--fpx))]">
        <button
          type="button"
          onClick={onUndo}
          aria-label={c.undo}
          className="flex size-[calc(48*var(--fpx))] items-center justify-center rounded-[calc(8*var(--fpx))] text-white transition-colors hover:bg-white/10"
        >
          <IconUndo className="size-[calc(24*var(--fpx))]" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          aria-label={c.redo}
          className="flex size-[calc(48*var(--fpx))] items-center justify-center rounded-[calc(8*var(--fpx))] text-white transition-colors hover:bg-white/10"
        >
          <IconRedo className="size-[calc(24*var(--fpx))]" />
        </button>
      </div>
      <button
        type="button"
        onClick={onPreview}
        className="flex h-[calc(48*var(--fpx))] items-center justify-center gap-[calc(8*var(--fpx))] rounded-[calc(8*var(--fpx))] pl-[calc(20*var(--fpx))] pr-[calc(24*var(--fpx))] text-body font-medium text-white transition-colors hover:bg-white/10"
      >
        <IconPreview className="size-[calc(24*var(--fpx))]" />
        {c.preview}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex h-[calc(48*var(--fpx))] items-center justify-center rounded-[calc(8*var(--fpx))] border border-white px-[calc(24*var(--fpx))] text-body font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saveLabel}
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={saving}
        className="flex h-[calc(48*var(--fpx))] items-center justify-center rounded-[calc(8*var(--fpx))] bg-white px-[calc(24*var(--fpx))] text-body font-medium text-brand-purple transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {c.continue}
      </button>
    </div>
  );
}
