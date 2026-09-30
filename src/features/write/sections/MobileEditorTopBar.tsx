import { IconBack } from "../../../components/ui/icons/IconBack";
import { StatusTag } from "./StatusTag";

// Phone editor top bar (NIC-539, Figma 2676:6222): the focused writing mode
// replaces the site header with Back, the status tag and the save-state
// caption. 64 high including a 1px bottom hairline; Back is a 48 tap target
// whose icon lines up with the 16 content inset.
export function MobileEditorTopBar({
  onBack,
  backLabel,
  status,
  caption,
}: {
  onBack: () => void;
  backLabel: string;
  status: string;
  caption: string;
}) {
  return (
    <div className="flex h-[calc(64*var(--fpx))] items-center gap-[calc(12*var(--fpx))] border-b border-ink-border/20 bg-white px-[calc(4*var(--fpx))]">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="flex size-[calc(48*var(--fpx))] shrink-0 items-center justify-center rounded-[calc(8*var(--fpx))] text-brand-purple transition-colors hover:bg-brand-purple-5"
      >
        <IconBack className="size-[calc(18*var(--fpx))]" />
      </button>
      <StatusTag label={status} />
      <span className="min-w-0 truncate text-[length:calc(14*var(--fpx))] leading-[calc(20*var(--fpx))] text-ink-60">
        {caption}
      </span>
    </div>
  );
}
