import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../contexts/useActors";
import { useImageUpload } from "../write/hooks/useImageUpload";
import { registerModalCopy } from "../../constants/copy";

// Registers the authed principal as a Nuance user — the first mutation
// hook in the project (decision #30). NIC-272 (Part 1): if the user
// selected an avatar file it is uploaded via the Storage canister before
// registerUser is called; the resulting URL is passed as the avatar arg.
// Avatar is optional -- skipping it sends "" (same behaviour as before).
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

type RegisterArgs = { handle: string; displayName: string; avatarFile: File | null };

export function useRegister() {
  const { registerUser } = useActors();
  const queryClient = useQueryClient();
  const uploadImage = useImageUpload();

  return useMutation({
    mutationFn: async ({ handle, displayName, avatarFile }: RegisterArgs) => {
      let avatar = "";
      if (avatarFile) {
        try {
          avatar = await uploadImage(avatarFile);
        } catch (e) {
          console.error("[avatar upload]", e);
          throw new Error(registerModalCopy.avatarUploadError);
        }
      }
      const result = await registerUser(handle.trim(), displayName.trim(), avatar);
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
