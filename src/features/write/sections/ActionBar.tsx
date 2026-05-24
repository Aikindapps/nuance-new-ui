import { writeArticleCopy } from "../../../constants/copy";
import { IconUndo } from "../../../components/ui/icons/IconUndo";
import { IconRedo } from "../../../components/ui/icons/IconRedo";

// Bottom action bar (Figma NUR / Action bar, "Writing"): fixed, centered,
// purple-gradient pill. Undo · Redo │ Save as draft · Continue. Preview is
// deferred and the AI "SEO" button is the deferred AI feature (decision #36).
export function ActionBar({
  onUndo,
  onRedo,
  onSaveDraft,
  onContinue,
  saving,
}: {
  onUndo: () => void;
  onRedo: () => void;
  onSaveDraft: () => void;
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
        onClick={onSaveDraft}
        disabled={saving}
        className="flex h-[calc(48*var(--fpx))] items-center justify-center rounded-[calc(8*var(--fpx))] border border-white px-[calc(24*var(--fpx))] text-body font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {c.saveDraft}
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
