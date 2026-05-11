import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AuthClient,
  type AuthClientCreateOptions,
  type OpenIdProvider,
} from "@icp-sdk/auth/client";
import type { Identity } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "./useAuth";

// Auth state lives in context state (not as a query) per decision #18 exception:
// every screen needs the answer "is the user logged in?" at minimal latency.
//
// Decision #24 — auth via @icp-sdk/auth@7.0.0, Internet Identity 2.0 with three
// OpenID providers (Google, Apple, Microsoft). Plug, NFID, Stoic, and other ICP
// wallets are out of scope.
//
// `openIdProvider` is bound at AuthClient construction time, not at signIn(),
// so each login() call constructs a fresh AuthClient with the appropriate
// provider. Sessions persist across instances via the shared IdbStorage default.
//
// The AuthContext constant + useAuth() hook live in ./useAuth.ts so this file
// is a pure component file (Fast Refresh).

// Disable the SDK's default idle handler. Its default would sign the user out
// and reload the page after 10 min of inactivity (auth-client.js #idleManager
// + idle-manager.ts default of 10 min) — catastrophic for a reading platform
// where users routinely spend > 10 min on a single article. The 8-hour
// delegation TTL gives a natural session ceiling; idle-driven re-auth UX can
// be revisited once the toast service (decision #22) has a real consumer.
const IDLE_OPTIONS: AuthClientCreateOptions["idleOptions"] = {
  disableIdle: true,
};

// Lazy singleton for the default (no-openIdProvider) AuthClient. Reused for
// session restore, classic-II sign-in, and sign-out, which all share the same
// IdbStorage. OpenID sign-in still constructs a fresh AuthClient per call
// because `openIdProvider` is bound at construction time (decision #24, and
// confirmed against @icp-sdk/auth@7.0.0's d.ts — no setter, signIn() does not
// accept it). Reduces the common-path AuthClient count from 3 to 1.
let defaultClient: AuthClient | null = null;
function getDefaultClient(): AuthClient {
  if (!defaultClient) {
    defaultClient = new AuthClient({ idleOptions: IDLE_OPTIONS });
  }
  return defaultClient;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Restore session on mount. AuthClient reads IdbStorage on first async call
  // and surfaces a previously authenticated identity if the delegation is still valid.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const restored = await getDefaultClient().getIdentity();
        if (cancelled) return;
        const restoredPrincipal = restored.getPrincipal();
        if (restoredPrincipal.isAnonymous()) {
          setStatus("unauthenticated");
        } else {
          setIdentity(restored);
          setPrincipal(restoredPrincipal);
          setStatus("authenticated");
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to restore session");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (provider?: OpenIdProvider) => {
    setError(null);
    setStatus("loading");
    try {
      // OpenID logins construct a fresh AuthClient (openIdProvider is bound at
      // construction time, see decision #24). Classic II reuses the default
      // singleton — same IdbStorage, no benefit to a fresh instance.
      const client = provider
        ? new AuthClient({ idleOptions: IDLE_OPTIONS, openIdProvider: provider })
        : getDefaultClient();
      const next = await client.signIn();
      if (!mountedRef.current) return;
      const nextPrincipal = next.getPrincipal();
      setIdentity(next);
      setPrincipal(nextPrincipal);
      setStatus("authenticated");
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setStatus("error");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await getDefaultClient().signOut();
      if (!mountedRef.current) return;
      setIdentity(null);
      setPrincipal(null);
      setStatus("unauthenticated");
    } catch (err) {
      if (!mountedRef.current) return;
      // Clear identity/principal even on failure so downstream consumers
      // (e.g. PR #4's authed ActorsContext) don't see a stale identity for
      // a status="error" user. The local session is gone from our perspective
      // regardless of whether signOut() persisted the deletion.
      setIdentity(null);
      setPrincipal(null);
      setError(err instanceof Error ? err.message : "Sign-out failed");
      setStatus("error");
      throw err;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      identity,
      principal,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      error,
      login,
      logout,
    }),
    [status, identity, principal, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
