import { useState } from "react";
import type { Notification } from "../../../candid/Notifications/Notifications";

// useUnreadSnapshot — freeze which notifications were unread the *first time*
// this surface saw them, and keep that set stable for the life of the surface.
//
// Why: opening the foldout (or the /notifications route) fires a bulk
// mark-read, whose optimistic update flips `read=true` in the cache. That's
// correct for the bell dot — but if the row styling read `notification.read`
// directly, every row would re-render as "read" within a frame of opening and
// the designed unread treatment (Figma 1:51584) would never be seen. So the
// dot clears immediately while the unread accent persists until the surface is
// closed/reopened (PR #10 review M2, option A).
//
// Implementation: the "store info from previous renders" pattern — when an id
// is seen for the first time we set state *during render*. React discards the
// in-progress render and immediately re-renders with the updated set before
// painting, so the committed render already carries the correct accents (no
// flash, no ref-during-render). `seen` guards each id, so the later optimistic
// flip never re-evaluates it and the snapshot stays frozen. Converges because
// the second render finds nothing new and skips the setState.
export function useUnreadSnapshot(notifications: Notification[]): Set<string> {
  const [snapshot, setSnapshot] = useState<{
    seen: Set<string>;
    unread: Set<string>;
  }>(() => ({ seen: new Set(), unread: new Set() }));

  const fresh = notifications.filter((n) => !snapshot.seen.has(n.id));
  if (fresh.length > 0) {
    setSnapshot((prev) => {
      const seen = new Set(prev.seen);
      const unread = new Set(prev.unread);
      for (const n of fresh) {
        seen.add(n.id);
        if (!n.read) unread.add(n.id);
      }
      return { seen, unread };
    });
  }

  return snapshot.unread;
}
