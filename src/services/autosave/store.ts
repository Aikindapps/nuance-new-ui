// Browser save-state for the article editor (decision #22 — first consumer).
// In-progress drafts persist to localStorage so a refresh / crash / tab-close
// doesn't lose work. The payload is the Lexical editorState JSON (lossless,
// native) plus the form fields; HTML conversion only happens on the explicit
// canister Save (Chunk 7). Keyed per draft: the "new-article" slot before a
// canister draft exists, then the postId once saved.

export type DraftSnapshot = {
  version: 1;
  savedAt: number;
  title: string;
  subtitle: string;
  coverUrl: string;
  tagIds: string[];
  editorStateJson: string;
};

// The slot for an article not yet saved to the canister.
export const DRAFT_NEW_ID = "new";

const PREFIX = "nuance:draft:";
const key = (id: string) => `${PREFIX}${id}`;

export function loadDraft(id: string): DraftSnapshot | null {
  try {
    const raw = localStorage.getItem(key(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftSnapshot;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraft(
  id: string,
  data: Omit<DraftSnapshot, "version" | "savedAt">,
): void {
  try {
    const payload: DraftSnapshot = { ...data, version: 1, savedAt: Date.now() };
    localStorage.setItem(key(id), JSON.stringify(payload));
  } catch (e) {
    // Quota / private-mode failures must never crash the editor.
    console.warn("[autosave] save failed:", e);
  }
}

export function clearDraft(id: string): void {
  try {
    localStorage.removeItem(key(id));
  } catch {
    /* ignore */
  }
}
