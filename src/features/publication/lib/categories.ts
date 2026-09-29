// NIC-538 -- Publication Settings: Categories section.
//
// Pure helpers shared later by two sibling builds (reader tabs, publish
// dropdown), so keep them generic -- no React, no copy strings.

// EXACTLY the canister's trim_category_name: lowercase, then replace every
// U+0020 space with "-". NO trim, no other whitespace handling, no other
// characters touched. Legacy prod data has "Articles " whose canister slug
// is "articles-"; trimming here would break that parity.
export function categorySlug(name: string): string {
  return name.toLowerCase().split(" ").join("-");
}

// PostCore.save rejects a post category over 50 chars.
export const CATEGORY_MAX_LENGTH = 50;

// Collide with /publication/:handle/manage/* and the old
// /publication/:handle/subscription route.
export const RESERVED_CATEGORY_SLUGS = ["manage", "subscription"] as const;

// Validate a (trimmed) category name against the committed values of every
// OTHER row. Reserved is checked before exists.
export function validateCategoryName(
  trimmed: string,
  others: readonly string[],
): "reserved" | "exists" | null {
  const slug = categorySlug(trimmed);
  if ((RESERVED_CATEGORY_SLUGS as readonly string[]).includes(slug)) {
    return "reserved";
  }
  if (others.some((o) => categorySlug(o) === slug)) {
    return "exists";
  }
  return null;
}

// Returns a new array with the item at `from` moved to `to`.
export function moveItem<T>(arr: readonly T[], from: number, to: number): T[] {
  const next = arr.slice();
  const clampedTo = Math.max(0, Math.min(to, next.length - 1));
  const [item] = next.splice(from, 1);
  next.splice(clampedTo, 0, item);
  return next;
}

// Saved categories that saving `next` would drop from the publication
// (NIC-538 step 9, D-143): every saved name whose slug no longer appears
// among `next`'s slugs -- removed, or renamed to a different slug. A rename
// that keeps the slug ("Food" -> "food") is not a drop: the canister
// still files the same articles under it. De-duplicated by slug, in saved
// order. Blank names are skipped (they never had a category page).
export function droppedCategories(
  saved: readonly string[],
  next: readonly string[],
): string[] {
  const kept = new Set(next.map(categorySlug));
  const seen = new Set<string>();
  const dropped: string[] = [];
  for (const name of saved) {
    if (name.trim() === "") continue;
    const slug = categorySlug(name);
    if (kept.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    dropped.push(name);
  }
  return dropped;
}

// PostCore returns article counts as nat-as-text. Anything else (e.g.
// "Text length invalid") means the count could not be read -> null.
export function parseCategoryCount(totalCount: string): number | null {
  return /^\d+$/.test(totalCount) ? Number(totalCount) : null;
}
