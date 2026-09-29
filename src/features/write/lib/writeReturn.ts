import { writeArticleCopy } from "../../../constants/copy";

// Where the Write editor returns to (NIC-548). The Manage Articles Edit link
// passes router state { from: "publication-manage-articles", handle }. With
// it, every exit except Publish (Back, the leave guard's Leave and Save
// draft, the Back link on the load-error and read-only screens) goes back to
// that publication's Manage Articles list. Without it (typed URL, another
// entry point, state lost) the editor keeps today's My articles return.
export const FROM_PUBLICATION_MANAGE_ARTICLES = "publication-manage-articles";

export type ManageArticlesEditState = {
  from: typeof FROM_PUBLICATION_MANAGE_ARTICLES;
  handle: string;
};

export type WriteReturn = {
  to: string;
  label: string;
  fromPublication: boolean;
};

export const MY_ARTICLES_RETURN: WriteReturn = {
  to: "/my-articles",
  label: writeArticleCopy.backToMyArticles,
  fromPublication: false,
};

export function manageArticlesEditState(
  handle: string,
): ManageArticlesEditState {
  return { from: FROM_PUBLICATION_MANAGE_ARTICLES, handle };
}

export function writeReturnFromState(state: unknown): WriteReturn {
  if (typeof state !== "object" || state === null) return MY_ARTICLES_RETURN;
  const { from, handle } = state as { from?: unknown; handle?: unknown };
  if (
    from !== FROM_PUBLICATION_MANAGE_ARTICLES ||
    typeof handle !== "string" ||
    handle === ""
  ) {
    return MY_ARTICLES_RETURN;
  }
  return {
    to: `/publication/${encodeURIComponent(handle)}/manage/articles`,
    label: writeArticleCopy.backToPublicationArticles,
    fromPublication: true,
  };
}
