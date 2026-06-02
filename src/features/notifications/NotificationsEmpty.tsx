import { notificationsCopy } from "../../constants/copy";

// Empty state shown in both surfaces (foldout + /notifications route).
// No illustration — the Figma is a draft and shows none, and the route
// can shoulder a simple text-only empty state.

export function NotificationsEmpty({ variant }: { variant: "foldout" | "route" }) {
  const isFoldout = variant === "foldout";
  return (
    <div
      className={
        isFoldout
          ? "flex flex-col items-center gap-1 px-4 py-12 text-center"
          : "flex flex-col items-center gap-2 px-4 py-16 text-center"
      }
    >
      <p
        className={
          isFoldout
            ? "font-bold text-base text-white"
            : "font-bold text-lg text-ink"
        }
      >
        {notificationsCopy.emptyTitle}
      </p>
      <p
        className={
          isFoldout ? "text-sm text-white-60" : "text-body text-ink-60"
        }
      >
        {notificationsCopy.emptyHint}
      </p>
    </div>
  );
}
