import { useEffect, useRef, type RefObject } from "react";
import { Link } from "react-router-dom";
import { notificationsCopy } from "../../constants/copy";
import { useMyProfile } from "../../lib/useMyProfile";
import { NotificationItem } from "./NotificationItem";
import { NotificationsEmpty } from "./NotificationsEmpty";
import { useMarkRead } from "./hooks/useMarkRead";
import { useNotificationsFoldout } from "./hooks/useNotifications";

// Figma 1:51584 — anchored foldout that opens from the header bell button.
// Desktop only; mobile bell click navigates to /notifications instead
// (Phase 4).
//
// Behavior:
//   - Click-outside (excluding the bell anchor itself, which owns the toggle)
//     and Esc close the foldout.
//   - On open: mark every visible unread notification as read in one bulk
//     canister call (decision: PR #10 mark-read trigger).
//   - "View all" link routes to /notifications regardless of how many items
//     are loaded — the foldout intentionally only shows page 1.

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
};

export function NotificationsFoldout({ anchorRef, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const query = useNotificationsFoldout();
  const profile = useMyProfile();
  const markRead = useMarkRead();

  const firstPage = query.data?.pages[0];
  const notifications = firstPage?.notifications ?? [];
  const userMap = firstPage?.userMap ?? new Map();
  const myHandle = profile.data?.handle ?? null;

  // Bulk mark-read on first successful page load. mutate() de-dups identical
  // payloads internally; running it once per open via the ref guard avoids
  // re-firing if React Query refetches in the background while the foldout
  // is open.
  const markedRef = useRef(false);
  useEffect(() => {
    if (markedRef.current) return;
    if (!firstPage) return;
    const unreadIds = firstPage.notifications
      .filter((n) => !n.read)
      .map((n) => n.id);
    if (unreadIds.length === 0) {
      markedRef.current = true;
      return;
    }
    markedRef.current = true;
    markRead.mutate(unreadIds);
  }, [firstPage, markRead]);

  // Click-outside + Esc. The anchor (bell button) is excluded because the
  // bell owns the open/close toggle — clicking it while open should close
  // the foldout, which the parent's onClick handler already does.
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchorRef, onClose]);

  const showEmpty =
    query.isSuccess && notifications.length === 0;
  const showError = query.isError;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={notificationsCopy.title}
      className="absolute right-0 top-full z-50 mt-2 w-[355px] overflow-hidden rounded-2xl border border-ink-border/10 bg-ink p-4 shadow-[0_3px_10px_-2px_rgba(84,5,212,0.1)]"
    >
      <div className="flex flex-col gap-3">
        <div className="px-4 pt-3">
          <p className="font-bold text-lg text-white">
            {notificationsCopy.title}
          </p>
        </div>

        {query.isLoading && (
          <div className="px-4 py-12 text-center text-sm text-white-60">
            …
          </div>
        )}

        {showError && (
          <div className="px-4 py-12 text-center text-sm text-white-60">
            {notificationsCopy.loadingError}
          </div>
        )}

        {showEmpty && <NotificationsEmpty variant="foldout" />}

        {notifications.length > 0 && (
          <ul className="flex max-h-[440px] flex-col gap-3 overflow-y-auto">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                userMap={userMap}
                myHandle={myHandle}
                variant="foldout"
              />
            ))}
          </ul>
        )}

        <div className="px-4 pb-1">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block w-full rounded-md border border-white-20 px-4 py-2 text-center text-base font-medium text-white transition-colors hover:bg-white-10"
          >
            {notificationsCopy.viewAll}
          </Link>
        </div>
      </div>
    </div>
  );
}
