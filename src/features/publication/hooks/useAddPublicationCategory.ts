// NIC-536 -- add a category to a publication from the Publish panel.
//
// Re-reads the publication record FRESH (never from the cache, so a Settings
// save made meanwhile isn't overwritten), appends the name, and saves the
// record back with every other field exactly as that fresh read returned it.
// Resolves to the category to select: the new name, or the existing entry if
// the fresh read already has one with the same slug (then nothing is
// written). The caller validates first (trim, blank, reserved, duplicate
// against the list it shows).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActors } from "../../../contexts/useActors";
import { fetchPublicationSettings } from "./usePublicationSettings";
import { categorySlug } from "../lib/categories";

export function useAddPublicationCategory(handle: string) {
  const actors = useActors();
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (name) => {
      const { publication: p, canisterId } = await fetchPublicationSettings(
        actors,
        handle,
      );
      const slug = categorySlug(name);
      const existing = p.categories.find((c) => categorySlug(c) === slug);
      if (existing !== undefined) return existing;
      const res = await actors.updatePublicationDetails(
        canisterId,
        p.description,
        p.publicationTitle,
        p.headerImage,
        [...p.categories, name],
        p.writers,
        p.editors,
        p.avatar,
        p.subtitle,
        p.socialLinks,
        new Date().getTime().toString(),
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return name;
    },
    // Refresh every cached read of this publication's record (Settings,
    // the reader tabs, this panel), whatever case its key was written in.
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === "publication-settings" &&
          typeof q.queryKey[1] === "string" &&
          q.queryKey[1].toLowerCase() === handle.toLowerCase(),
      }),
  });
}
