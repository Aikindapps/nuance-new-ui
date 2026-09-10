import type { Article } from "../types";

// Single source of truth for the page-0 "featured" split shared by the
// logged-out home (HomeLoggedOut/FeaturedSection) and the logged-in home
// tabs (ArticleFeed via ArticleTab): 2 hero cards + medium rows of 3.
//
// `collapsePartialRows` controls the trailing-row behaviour:
//  - true  (curated highlight feeds — home Popular/New): render COMPLETE
//    rows of 3 only; a trailing 1-2 leftover articles collapse rather than
//    showing a lone card beside blank grid cells (NIC-282 / NIC-286).
//  - false (exhaustive feeds — profile/publication/search/explore/following):
//    keep the trailing partial row so no real content is hidden.
export function splitFeaturedRows(
  articles: Article[],
  collapsePartialRows: boolean,
): { hero: Article[]; rows: Article[][] } {
  const hero = articles.slice(0, 2);
  const medium = articles.slice(2, 8);
  const rowCount = collapsePartialRows
    ? Math.floor(medium.length / 3)
    : Math.ceil(medium.length / 3);
  const rows = Array.from({ length: rowCount }, (_, i) =>
    medium.slice(i * 3, i * 3 + 3),
  );
  return { hero, rows };
}
