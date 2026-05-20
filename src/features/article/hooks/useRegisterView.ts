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

  // `viewPost` is intentionally omitted from deps. It is rebuilt inside
  // ActorsContext on every identity change (login/logout/restore); including
  // it would re-run the effect on every auth transition while the reader is
  // on an article (the countedFor guard catches the re-fire, but the wasted
  // run contradicts this hook's contract of "once per article, not once per
  // render"). Reading the current closure value at fire time is correct —
  // a view is registered against whatever identity is current at the moment
  // the article was first viewed, and is fire-and-forget anyway. PR #7
  // review M4.
  useEffect(() => {
    if (!postId || countedFor.current === postId) return;
    countedFor.current = postId;
    viewPost(postId).catch((e) => {
      // A missed view count is not worth surfacing to the reader.
      console.warn("[useRegisterView] viewPost failed:", e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);
}
