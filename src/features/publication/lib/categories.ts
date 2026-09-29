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
