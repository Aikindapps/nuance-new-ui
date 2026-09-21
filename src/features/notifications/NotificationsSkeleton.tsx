// NotificationsSkeleton -- mobile-only loading placeholder (Figma 2303:3097).
// 5 skeleton rows inside the same card container as the real list.
// aria-busy on the container; bars are aria-hidden decorative elements.

type Props = { className?: string };

export function NotificationsSkeleton({ className = "" }: Props) {
  return (
    <div
      aria-busy="true"
      className={`overflow-hidden rounded-card border border-ink-border/10 bg-white ${className}`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-[6px] border-b border-ink-border/10 px-4 py-4 last:border-b-0"
        >
          <div aria-hidden className="h-4 w-[230px] max-w-full animate-pulse rounded bg-ink-border/10" />
          <div aria-hidden className="h-3 w-[90px] animate-pulse rounded bg-ink-border/10" />
        </div>
      ))}
    </div>
  );
}
