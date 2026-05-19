import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import { useModal } from "../../services/modal";
import { useMyProfile } from "../../lib/useMyProfile";
import { RegisterModal, REGISTER_MODAL_TITLE_ID } from "./RegisterModal";
import { TopicsModal, TOPICS_MODAL_TITLE_ID } from "./TopicsModal";

// OnboardingGate — the controller for the Create Account flow (decision
// #30). Renders nothing; mounted once in the app shell.
//
// When an authenticated principal turns out to have no Nuance profile (the
// decision #27 dead-end), the gate walks them through RegisterModal →
// TopicsModal → the logged-in home:
//
//   idle ──authed & unregistered──▶ register ──onRegistered──▶ topics
//   register ──onCancel──▶ done  (+ logout)
//   topics ──onComplete/skip──▶ done
//   any phase ──login/logout (new identity)──▶ idle
//
// `done` is terminal for the current identity: it blocks a re-trigger in
// the window between finishing onboarding and useMyProfile refetching the
// now-registered profile. A new login/logout resets the gate to idle.

type Phase = "idle" | "register" | "topics" | "done";

export function OnboardingGate() {
  const { isAuthenticated, principal, logout } = useAuth();
  const profile = useMyProfile();
  const { open, close } = useModal();
  const [phase, setPhase] = useState<Phase>("idle");
  const [trackedPrincipal, setTrackedPrincipal] = useState<string | null>(null);

  const principalText = principal?.toText() ?? null;

  // Reset when the identity changes (sign-in, sign-out, switching accounts)
  // so onboarding re-evaluates for whoever is now authenticated. This is
  // React's "adjust state during render" pattern — not an effect.
  if (trackedPrincipal !== principalText) {
    setTrackedPrincipal(principalText);
    setPhase("idle");
  }

  // Begin onboarding once the profile query confirms the authed user has no
  // Nuance profile. useMyProfile resolves to null for "registered user not
  // found" — exactly the unregistered-principal case. Also a render-time
  // adjustment: the `phase === "idle"` guard makes it self-terminating.
  if (
    phase === "idle" &&
    isAuthenticated &&
    profile.isSuccess &&
    profile.data === null
  ) {
    setPhase("register");
  }

  // Render the current step into the Modal service. Runs only on a phase
  // change — open/close/logout are all stable (useCallback). The onboarding
  // modals open non-dismissable so Escape/backdrop can't bypass the
  // cancel = logout rule (decision #30).
  useEffect(() => {
    if (phase === "register") {
      open(
        <RegisterModal
          onRegistered={() => setPhase("topics")}
          onCancel={() => {
            setPhase("done");
            close();
            // AuthContext clears identity even if signOut() rejects; the
            // rejection is swallowed here (no toast service yet).
            logout().catch(() => {});
          }}
        />,
        { ariaLabelledBy: REGISTER_MODAL_TITLE_ID, dismissable: false },
      );
    } else if (phase === "topics") {
      open(
        <TopicsModal
          onComplete={() => {
            setPhase("done");
            close();
          }}
        />,
        { ariaLabelledBy: TOPICS_MODAL_TITLE_ID, dismissable: false },
      );
    }
  }, [phase, open, close, logout]);

  return null;
}
