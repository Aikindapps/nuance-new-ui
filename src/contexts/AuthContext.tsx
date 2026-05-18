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

// Decision #27 — principal preservation across the prod handoff.
//
// All existing nuance.xyz user principals are derived against the production
// asset canister URL. The .well-known/ii-alternative-origins file there
// whitelists nuance.xyz + www.nuance.xyz, so any frontend served from those
// domains gets the SAME principal each existing user already has → their
// User canister profile, articles, follows, and NUA balance carry over with
// zero migration.
//
// Local dev (`localhost:5173`) is intentionally NOT in the whitelist — so
// `import.meta.env.PROD` is false here, derivationOrigin stays undefined,
// and the local principal is fresh-per-device (a test identity, not the
// developer's real Nuance account).
const PROD_DERIVATION_ORIGIN = "https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app";
const DERIVATION_ORIGIN: string | undefined = import.meta.env.PROD
  ? PROD_DERIVATION_ORIGIN
  : undefined;

// Lazy singleton for the default (no-openIdProvider) AuthClient. Reused for
// session restore, classic-II sign-in, and sign-out, which all share the same
// IdbStorage. OpenID sign-in still constructs a fresh AuthClient per call
// because `openIdProvider` is bound at construction time (decision #24, and
// confirmed against @icp-sdk/auth@7.0.0's d.ts — no setter, signIn() does not
// accept it). Reduces the common-path AuthClient count from 3 to 1.
let defaultClient: AuthClient | null = null;
function getDefaultClient(): AuthClient {
  if (!defaultClient) {
    defaultClient = new AuthClient({
      idleOptions: IDLE_OPTIONS,
      derivationOrigin: DERIVATION_ORIGIN,
    });
  }
  return defaultClient;
}

// localStorage keys for login timestamps. Persisted across reloads within the
// 8-hour delegation lifetime so the WelcomeBanner survives a mid-session
// reload.
//   - LAST_LOGIN: the most recent (current-session) login. Drives the
//     WelcomeBanner's brief post-login display window.
//   - PREVIOUS_LOGIN: the login before that — what the banner actually shows
//     ("Last login: X ago"). Captured from LAST_LOGIN's prior value at the
//     moment a new sign-in completes.
const LAST_LOGIN_STORAGE_KEY = "nuance:last-login-at";
const PREVIOUS_LOGIN_STORAGE_KEY = "nuance:previous-login-at";

function readTimestamp(key: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function writeTimestamp(key: string, value: number | null): void {
  if (typeof window === "undefined") return;
  if (value === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, String(value));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastLoginAt, setLastLoginAt] = useState<number | null>(() =>
    readTimestamp(LAST_LOGIN_STORAGE_KEY),
  );
  const [previousLoginAt, setPreviousLoginAt] = useState<number | null>(() =>
    readTimestamp(PREVIOUS_LOGIN_STORAGE_KEY),
  );
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
        ? new AuthClient({
            idleOptions: IDLE_OPTIONS,
            derivationOrigin: DERIVATION_ORIGIN,
            openIdProvider: provider,
          })
        : getDefaultClient();
      const next = await client.signIn();
      if (!mountedRef.current) return;
      const nextPrincipal = next.getPrincipal();
      // The login currently stored as "last" becomes the "previous" login;
      // `now` becomes the new "last". The WelcomeBanner displays the previous
      // one ("Last login: X ago") and gates its visibility on the new one.
      const now = Date.now();
      const prior = readTimestamp(LAST_LOGIN_STORAGE_KEY);
      writeTimestamp(PREVIOUS_LOGIN_STORAGE_KEY, prior);
      writeTimestamp(LAST_LOGIN_STORAGE_KEY, now);
      setIdentity(next);
      setPrincipal(nextPrincipal);
      setPreviousLoginAt(prior);
      setLastLoginAt(now);
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
      lastLoginAt,
      previousLoginAt,
      login,
      logout,
    }),
    [
      status,
      identity,
      principal,
      error,
      lastLoginAt,
      previousLoginAt,
      login,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
