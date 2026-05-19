// A togglable pill — the interactive cousin of the display-only <Tag>.
// Used by TopicsModal's topic picker (Figma node 1:1523/1:1524).
//
// Unselected = purple-10% fill, no visible border. Selected = white fill,
// 2px purple-60 border. Both states carry border-2 (transparent when
// unselected) so toggling never reflows the layout.

type SelectableTagProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
};

export function SelectableTag({ label, selected, onToggle }: SelectableTagProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={
        "inline-flex h-12 items-center justify-center rounded-full border-2 px-6 text-lg font-medium text-brand-purple transition-colors " +
        (selected
          ? "border-brand-purple/60 bg-white"
          : "border-transparent bg-brand-purple-10 hover:bg-brand-purple/15")
      }
    >
      {label}
    </button>
  );
}
