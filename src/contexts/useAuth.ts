import { createContext, useContext } from "react";
import type { OpenIdProvider } from "@icp-sdk/auth/client";
import type { Identity } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";

// AuthContext + hook + types live in this file so AuthContext.tsx can be
// a pure component file. This satisfies `react-refresh/only-export-components`
// — components and constants no longer share a file, and Fast Refresh can
// safely swap AuthProvider on edit without invalidating the whole context tree.

export type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "authenticated"
  | "error";

export type AuthContextValue = {
  status: AuthStatus;
  identity: Identity | null;
  principal: Principal | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Timestamp (ms since epoch) of the most recent completed signIn(),
  // hydrated from localStorage on mount so it survives reloads within the
  // delegation lifetime. Null when there's never been a login on this device.
  lastLoginAt: number | null;
  login: (provider?: OpenIdProvider) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const v = useContext(AuthContext);
  if (!v) {
    throw new Error("useAuth() must be used inside <AuthProvider>");
  }
  return v;
}
