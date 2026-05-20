import { useEffect, useRef } from "react";
import { useActors } from "../../../contexts/useActors";

// Registers a view for an article exactly once per postId.
//
// PostCore.viewPost is a `oneway` update — fire-and-forget, no return, no auth
// gate (anonymous callers count too). It is a side effect, not data, so it
// lives in an effect rather than a query.
//
// The ref guard makes this idempotent across React StrictMode's deliberate
// double-invoke of effects in development, and across re-renders that don't
// change the postId — so a reader is counted once per article, not once per
// render. Navigating to a different article fires it again.
export function useRegisterView(postId: string | null) {
  const { viewPost } = useActors();
  const countedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!postId || countedFor.current === postId) return;
    countedFor.current = postId;
    viewPost(postId).catch((e) => {
      // A missed view count is not worth surfacing to the reader.
      console.warn("[useRegisterView] viewPost failed:", e);
    });
  }, [postId, viewPost]);
}
