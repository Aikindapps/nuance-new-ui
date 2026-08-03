type Variant = "on-purple-band" | "on-light";

type TagProps = {
  label: string;
  href?: string;
  // Default keeps the HomeLoggedOut Hero behavior (white text + white border
  // on the brand-gradient band). "on-light" matches Figma 1:50048 — purple
  // text on purple-10% pill, used in HomeLoggedIn's white-page Topics rail.
  variant?: Variant;
  // When true, caps pill width and ellipsizes an over-long label so the pill
  // does not grow unbounded in the /explore/topics grid (NIC-139, frame 1053:6424).
  truncate?: boolean;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  "on-purple-band":
    "inline-flex items-center justify-center rounded-full border-2 border-white-60 px-4 py-1 text-body font-medium text-white transition-colors hover:bg-white-10 lg:px-6 lg:text-lg",
  "on-light":
    "inline-flex h-12 items-center justify-center rounded-full bg-brand-purple-10 px-6 py-1 text-body font-medium text-brand-purple transition-colors hover:bg-brand-purple/15 lg:text-lg",
};

export function Tag({ label, href, variant = "on-purple-band", truncate = false }: TagProps) {
  const classes = VARIANT_CLASSES[variant] + (truncate ? " max-w-[calc(260*var(--fpx))]" : "");
  if (href) {
    return (
      <a href={href} className={classes}>
        {truncate ? <span className="min-w-0 truncate">{label}</span> : label}
      </a>
    );
  }
  return (
    <span className={classes}>
      {truncate ? <span className="min-w-0 truncate">{label}</span> : label}
    </span>
  );
}
