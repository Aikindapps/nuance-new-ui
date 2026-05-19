import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../contexts/useActors";

// Registers the authed principal as a Nuance user — the first mutation
// hook in the project (decision #30). Avatar is sent empty ("") because
// avatar upload is deferred.
//
// User.registerUser returns a variant: { __kind__: "ok", ok: User } on
// success, { __kind__: "err", err } when the canister rejects (most
// commonly a handle that is already taken or reserved). The err variant
// is rethrown so React Query surfaces it through `error`, and RegisterModal
// shows it inline.
//
// On success the "my-profile" query is invalidated so useMyProfile (the
// OnboardingGate / WelcomeBanner consumer) refetches and the app sees a
// registered user.

type RegisterArgs = { handle: string; displayName: string };

export function useRegister() {
  const { registerUser } = useActors();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ handle, displayName }: RegisterArgs) => {
      const result = await registerUser(handle.trim(), displayName.trim(), "");
      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });
}
