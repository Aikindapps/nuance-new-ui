// Decide ID OIDC proof-of-humanity flow — start (redirect) + complete (callback).
// Start calls the User canister to generate a server-side state token, then
// redirects the browser to the Decide ID authorize endpoint. Complete is called
// by the /callback route: it validates the CSRF state, calls verifyPoh, and
// invalidates the my-profile cache so the isVerified flag refreshes.

import { useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { useToast } from "../../../services/toast";
import { verifyProfileCopy } from "../../../constants/copy";

const DECIDEID_AUTHORIZE_URL = "https://id.decideai.xyz/#/authorize";
const SESSION_KEY = "decideid_oidc_session";
const CALLBACK_PATH = "/callback";
const CLIENT_ID = import.meta.env.VITE_DECIDEID_CLIENT_ID as string | undefined;

type Session = { state: string; redirectUri: string; returnTo: string };

export function useDecideIdVerification() {
  const { createDecideIdState, verifyPoh } = useActors();
  const toast = useToast();
  const queryClient = useQueryClient();

  const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;

  const start = async (returnTo?: string): Promise<void> => {
    if (!CLIENT_ID) {
      toast.show(verifyProfileCopy.notConfigured, "error");
      return;
    }
    try {
      const result = await createDecideIdState(redirectUri);
      if (result.__kind__ === "err") {
        toast.show(verifyProfileCopy.startError, "error");
        console.error(result.err);
        return;
      }
      const state = result.ok;
      const session: Session = {
        state,
        redirectUri,
        returnTo: returnTo ?? window.location.pathname + window.location.search,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "poh",
        state,
      });
      window.location.href = `${DECIDEID_AUTHORIZE_URL}?${params.toString()}`;
    } catch (err) {
      toast.show(verifyProfileCopy.startError, "error");
      console.error(err);
    }
  };

  const complete = async (
    code: string,
    state: string,
  ): Promise<{ ok: true; returnTo: string } | { ok: false; error: string }> => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return { ok: false, error: verifyProfileCopy.callbackNoSession };
    }
    // Always remove the session key — single use, even on failure.
    sessionStorage.removeItem(SESSION_KEY);
    let session: Session;
    try {
      session = JSON.parse(raw) as Session;
    } catch {
      return { ok: false, error: verifyProfileCopy.callbackNoSession };
    }
    if (session.state !== state) {
      return { ok: false, error: verifyProfileCopy.callbackStateMismatch };
    }
    try {
      const result = await verifyPoh(code, state, session.redirectUri);
      if (result.__kind__ === "Ok") {
        await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        return { ok: true, returnTo: session.returnTo };
      } else {
        console.error(result.Err);
        return { ok: false, error: verifyProfileCopy.callbackGenericError };
      }
    } catch (err) {
      console.error(err);
      return { ok: false, error: verifyProfileCopy.callbackGenericError };
    }
  };

  return { start, complete };
}
