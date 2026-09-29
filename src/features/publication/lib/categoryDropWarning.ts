// NIC-538 step 9 (D-143) -- body text of the warning "Save settings" shows
// when a save would drop saved categories that published articles are
// filed under. Pure: no React, strings from publicationSettingsCopy.

import { publicationSettingsCopy as copy } from "../../../constants/copy";

// count = published articles filed under the category (PostCore
// getPostsByCategory totalCount), or null when it could not be read.
export type CategoryInUse = { name: string; count: number | null };

// Single pass over the TEMPLATE only: a value is never re-scanned, and the
// function form keeps "$&"-style sequences in a name literal.
function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}

// "A", "A and B", "A, B and C".
function joinNames(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return (
    items.slice(0, -1).join(", ") + copy.categoryDropAnd + items[items.length - 1]
  );
}

// Names are shown trimmed (legacy stored names can end in a space).
// Callers pass only categories whose count is > 0 or unknown (null).
export function categoryDropWarningBody(inUse: readonly CategoryInUse[]): string {
  if (inUse.length === 1) {
    const name = inUse[0].name.trim();
    const count = inUse[0].count;
    if (count === null) return fill(copy.categoryDropUnknown, { name });
    if (count === 1) return fill(copy.categoryDropOne, { name });
    return fill(copy.categoryDropMany, { name, count: String(count) });
  }
  const anyUnknown = inUse.some((c) => c.count === null);
  const list = joinNames(
    inUse.map((c) =>
      c.count === null
        ? c.name.trim()
        : fill(copy.categoryDropListItem, {
            name: c.name.trim(),
            count: String(c.count),
          }),
    ),
  );
  return fill(
    anyUnknown ? copy.categoryDropSeveralUnknown : copy.categoryDropSeveral,
    { list },
  );
}
