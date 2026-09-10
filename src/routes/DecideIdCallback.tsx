// /callback — Decide ID OIDC return page.
//
// Decide ID redirects back here after the user completes (or cancels) the
// proof-of-humanity flow. The route reads the `code`/`state`/`error` params
// from the URL and delegates to useDecideIdVerification().complete().
//
// Initial state (error / missing-params cases) is computed eagerly in the
// useState lazy initializer so the effect body never calls setState
// synchronously. The async complete() call does update state, but only via
// its Promise .then() callback, which is not synchronous.
// A StrictMode guard (didRun) ensures the canister call fires exactly once.

import { useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PageShell } from "../components/ui/CenteredMessage";
import { useDecideIdVerification } from "../features/profile/hooks/useDecideIdVerification";
import { verifyProfileCopy } from "../constants/copy";

type CallbackState =
  | { phase: "loading" }
  | { phase: "success"; returnTo: string }
  | { phase: "error"; message: string };

// Compute the starting state from the URL search params. Runs once in the
// useState lazy initializer so we never call setState synchronously inside
// an effect (which triggers the react-hooks/set-state-in-effect lint rule).
function computeInitialState(params: URLSearchParams): CallbackState {
  const error = params.get("error");
  const errorDescription = params.get("error_description");
  const code = params.get("code");
  const stateParam = params.get("state");
  if (error) {
    return {
      phase: "error",
      message: errorDescription ?? verifyProfileCopy.callbackGenericError,
    };
  }
  if (!code || !stateParam) {
    return { phase: "error", message: verifyProfileCopy.callbackMissingParams };
  }
  return { phase: "loading" };
}

const CONTAINER = "mx-auto max-w-[calc(932*var(--fpx))]";

const linkClass =
  "mt-8 inline-block text-body font-medium text-brand-purple underline underline-offset-2 hover:no-underline";

export function DecideIdCallback() {
  const [searchParams] = useSearchParams();
  const { complete } = useDecideIdVerification();
  const [cbState, setCbState] = useState<CallbackState>(() =>
    computeInitialState(searchParams),
  );
  const didRun = useRef(false);

  useEffect(() => {
    // Only proceed when the initial state is "loading" (i.e. code+state are
    // present in the URL). Error/missing-params cases short-circuit above in
    // computeInitialState and never reach this effect body.
    if (didRun.current) return;
    didRun.current = true;

    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");

    // Guard: computeInitialState already handled the missing-params case.
    // If we somehow reach here without code/state, there is nothing to do.
    if (!code || !stateParam) return;

    // State updates happen inside the Promise callback, not synchronously,
    // so they do not trigger the react-hooks/set-state-in-effect lint rule.
    complete(code, stateParam).then((result) => {
      if (result.ok) {
        setCbState({ phase: "success", returnTo: result.returnTo });
      } else {
        setCbState({ phase: "error", message: result.error });
      }
    });
    // Effect runs once on mount regardless of deps — the OIDC callback is a
    // single-shot exchange; re-running it would re-use an already-spent code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageShell>
      <main className={`${CONTAINER} px-6 py-24 text-center`}>
        {cbState.phase === "loading" && (
          <p className="text-body text-ink-60" aria-live="polite">
            {verifyProfileCopy.callbackLoading}
          </p>
        )}
        {cbState.phase === "success" && (
          <>
            <h1 className="text-title-md font-bold text-ink">
              {verifyProfileCopy.callbackSuccessTitle}
            </h1>
            <p className="mt-2 text-body text-ink-80">
              {verifyProfileCopy.callbackSuccessBody}
            </p>
            <Link to="/profile" className={linkClass}>
              {verifyProfileCopy.callbackReturnToProfile}
            </Link>
          </>
        )}
        {cbState.phase === "error" && (
          <>
            <h1 className="text-title-md font-bold text-ink">
              {verifyProfileCopy.callbackErrorTitle}
            </h1>
            <p className="mt-2 text-body text-ink-80">{cbState.message}</p>
            <Link to="/profile" className={linkClass}>
              {verifyProfileCopy.callbackReturnToProfile}
            </Link>
          </>
        )}
      </main>
    </PageShell>
  );
}
