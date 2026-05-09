import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AuthClient, type OpenIdProvider } from "@icp-sdk/auth/client";
import type { Identity } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";

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

type AuthStatus = "loading" | "unauthenticated" | "authenticated" | "error";

export type AuthContextValue = {
  status: AuthStatus;
  identity: Identity | null;
  principal: Principal | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (provider?: OpenIdProvider) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
        const client = new AuthClient();
        if (cancelled) return;
        const restored = await client.getIdentity();
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
      const client = new AuthClient(
        provider ? { openIdProvider: provider } : {},
      );
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
      const client = new AuthClient();
      await client.signOut();
      if (!mountedRef.current) return;
      setIdentity(null);
      setPrincipal(null);
      setStatus("unauthenticated");
    } catch (err) {
      if (!mountedRef.current) return;
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

export function useAuth(): AuthContextValue {
  const v = useContext(AuthContext);
  if (!v) {
    throw new Error("useAuth() must be used inside <AuthProvider>");
  }
  return v;
}
