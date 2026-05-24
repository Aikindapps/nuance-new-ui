import { useMutation } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import type { Post, PostSaveModel } from "../../../candid/PostCore/PostCore";

// PostCore.save mutation — create/edit/draft/publish in one call (decision #36).
// Returns the saved Post on success; throws the canister `err` string so the
// caller can toast it. The caller assembles the PostSaveModel and decides
// navigation (stay for draft, go to the article URL for publish).
export function useSavePost() {
  const { savePost } = useActors();
  return useMutation({
    mutationFn: async (model: PostSaveModel): Promise<Post> => {
      const res = await savePost(model);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
  });
}
