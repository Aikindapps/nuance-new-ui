type Variant = "on-purple-band" | "on-light";

type TagProps = {
  label: string;
  href?: string;
  // Default keeps the HomeLoggedOut Hero behavior (white text + white border
  // on the brand-gradient band). "on-light" matches Figma 1:50048 — purple
  // text on purple-10% pill, used in HomeLoggedIn's white-page Topics rail.
  variant?: Variant;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  "on-purple-band":
    "inline-flex items-center justify-center rounded-full border-2 border-white-60 px-4 py-1 text-body font-medium text-white transition-colors hover:bg-white-10 lg:px-6 lg:text-lg",
  "on-light":
    "inline-flex h-12 items-center justify-center rounded-full bg-brand-purple-10 px-6 py-1 text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple/15 lg:text-lg",
};

export function Tag({ label, href, variant = "on-purple-band" }: TagProps) {
  const classes = VARIANT_CLASSES[variant];
  if (href) {
    return (
      <a href={href} className={classes}>
        {label}
      </a>
    );
  }
  return <span className={classes}>{label}</span>;
}
