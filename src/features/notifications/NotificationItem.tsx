import type { Notification } from "../../candid/Notifications/Notifications";
import {
  NotificationBody,
  type UserMap,
} from "./lib/notificationLabel";
import { formatRelativeTime } from "./lib/relativeTime";

// One notification row. Identical shape in foldout + /notifications route;
// `variant` only switches colors (dark surface vs light surface).
//
// Read/unread state — Figma 1:51584:
//   unread → text white-100; right edge has a 4×fill vertical white-20 pill.
//   read   → text white-60; no accent pill.
//
// `unread` is supplied by the parent (via useUnreadSnapshot), not derived from
// notification.read: opening a surface optimistically flips read=true to clear
// the bell dot, but the row's accent persists for the session (PR #10 M2/A).
//
// The pill is rendered as an absolutely-positioned element inside the row
// (rather than positioned globally by index in the panel) so re-renders /
// reorders don't desync the accent from the row it belongs to.

type Props = {
  notification: Notification;
  userMap: UserMap;
  myHandle: string | null;
  unread: boolean;
  variant: "foldout" | "route";
};

export function NotificationItem({
  notification,
  userMap,
  myHandle,
  unread,
  variant,
}: Props) {
  const isFoldout = variant === "foldout";
  const body = (
    <NotificationBody
      notification={notification}
      userMap={userMap}
      myHandle={myHandle}
    />
  );
  const time = formatRelativeTime(notification.timestamp);

  if (isFoldout) {
    return (
      <li
        className={`relative flex flex-col gap-2 rounded-md px-4 py-3 ${
          unread ? "text-white" : "text-white-60"
        }`}
      >
        <p className="text-base leading-6">{body}</p>
        <p className="text-sm leading-6 text-white-60">{time}</p>
        {unread && (
          <span
            aria-hidden
            className="absolute right-0 inset-y-3 w-1 rounded-l bg-white-20"
          />
        )}
      </li>
    );
  }

  // Route variant — light surface, larger spacing, divider below.
  return (
    <li
      className={`relative flex flex-col gap-2 border-b border-ink-border/10 px-4 py-4 last:border-b-0 md:px-6 md:py-5 ${
        unread ? "text-ink" : "text-ink-60"
      }`}
    >
      <p className="text-body leading-6">{body}</p>
      <p className="text-sm leading-6 text-ink-60">{time}</p>
      {unread && (
        <span
          aria-hidden
          className="absolute left-0 inset-y-4 w-1 rounded-r bg-brand-purple"
        />
      )}
    </li>
  );
}
