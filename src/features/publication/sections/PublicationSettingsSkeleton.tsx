// NIC-376 §6.6 — Publication settings loading skeleton (State 1, Figma 1887:7905).
//
// Full-form skeleton: page chrome + every field/control + Save row replaced by
// flat #373A49 @ 10% (bg-ink-border/10) rounded rects at the real dimensions of
// PublicationDetailsForm. No spinner, no MUI wave/shimmer — flat rects with a
// gentle pulse (the house skeleton convention; MUI <Skeleton> is intentionally
// avoided here because its themed colour is #202123@12%, not the design's
// #373A49@10%).

// A single flat skeleton rect. `className` carries the size + radius.
function Rect({ className }: { className: string }) {
  return <div className={["bg-ink-border/10 animate-pulse", className].join(" ")} aria-hidden />;
}

// One field: label rect + a control rect (or custom control node).
function FieldSkeleton({
  labelWidth,
  control,
}: {
  labelWidth: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[calc(6*var(--fpx))]">
      <Rect className={`h-[calc(16*var(--fpx))] rounded-[calc(4*var(--fpx))] ${labelWidth}`} />
      {control}
    </div>
  );
}

// Standard 48h input rect (title / subtitle / handle / social / font / colour).
function InputRect() {
  return <Rect className="h-[calc(48*var(--fpx))] w-full rounded-[calc(6*var(--fpx))]" />;
}

// Dropzone rect (header image / logo), 119h radius 16.
function DropzoneRect() {
  return <Rect className="h-[calc(119*var(--fpx))] w-full rounded-[calc(16*var(--fpx))]" />;
}

export function PublicationSettingsSkeleton() {
  return (
    <div
      className="flex flex-col gap-[calc(24*var(--fpx))]"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading publication settings</span>

      {/* Back link + page heading + intro */}
      <div className="flex flex-col gap-2">
        <Rect className="h-[calc(19*var(--fpx))] w-[calc(140*var(--fpx))] rounded-[calc(4*var(--fpx))]" />
        <Rect className="h-[calc(32*var(--fpx))] w-[calc(320*var(--fpx))] max-w-full rounded-[calc(6*var(--fpx))]" />
        <Rect className="h-[calc(24*var(--fpx))] w-[calc(448*var(--fpx))] max-w-full rounded-[calc(4*var(--fpx))]" />
        <Rect className="h-[calc(24*var(--fpx))] w-[calc(360*var(--fpx))] max-w-full rounded-[calc(4*var(--fpx))]" />
      </div>

      {/* Form column — 448px, 24px gaps */}
      <div className="flex flex-col gap-[calc(24*var(--fpx))] w-[calc(448*var(--fpx))] max-w-full">
        {/* Handle (read-only box) */}
        <FieldSkeleton labelWidth="w-[calc(140*var(--fpx))]" control={<InputRect />} />
        {/* Title */}
        <FieldSkeleton labelWidth="w-[calc(120*var(--fpx))]" control={<InputRect />} />
        {/* Subtitle */}
        <FieldSkeleton labelWidth="w-[calc(120*var(--fpx))]" control={<InputRect />} />
        {/* Description (multiline) */}
        <FieldSkeleton
          labelWidth="w-[calc(140*var(--fpx))]"
          control={<Rect className="h-[calc(162*var(--fpx))] w-full rounded-[calc(6*var(--fpx))]" />}
        />
        {/* Header image */}
        <FieldSkeleton labelWidth="w-[calc(280*var(--fpx))] max-w-full" control={<DropzoneRect />} />
        {/* Avatar: circle only (empty-avatar state) */}
        <FieldSkeleton
          labelWidth="w-[calc(160*var(--fpx))]"
          control={<Rect className="size-[calc(119*var(--fpx))] rounded-full" />}
        />

        {/* Styling group */}
        <div className="flex flex-col gap-[calc(24*var(--fpx))] pt-[calc(16*var(--fpx))]">
          <Rect className="h-[calc(20*var(--fpx))] w-[calc(90*var(--fpx))] rounded-[calc(4*var(--fpx))]" />
          <FieldSkeleton labelWidth="w-[calc(120*var(--fpx))]" control={<InputRect />} />
          <FieldSkeleton labelWidth="w-[calc(160*var(--fpx))]" control={<InputRect />} />
          <FieldSkeleton labelWidth="w-[calc(160*var(--fpx))]" control={<DropzoneRect />} />
        </div>

        {/* Social links */}
        <FieldSkeleton labelWidth="w-[calc(120*var(--fpx))]" control={<InputRect />} />
        <FieldSkeleton labelWidth="w-[calc(120*var(--fpx))]" control={<InputRect />} />
        <FieldSkeleton labelWidth="w-[calc(120*var(--fpx))]" control={<InputRect />} />

        {/* Save row */}
        <div className="flex flex-row items-center gap-[calc(12*var(--fpx))]">
          <Rect className="h-[calc(48*var(--fpx))] w-[calc(150*var(--fpx))] rounded-[calc(8*var(--fpx))]" />
          <Rect className="h-[calc(48*var(--fpx))] w-[calc(200*var(--fpx))] rounded-[calc(8*var(--fpx))]" />
        </div>
      </div>
    </div>
  );
}
