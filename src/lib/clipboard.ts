// WHY THIS EXISTS: The IC asset canister's security_policy:"standard" emits
// `Permissions-Policy: clipboard-write=()` which blocks the async Clipboard
// API (navigator.clipboard.writeText) on UAT and prod. document.execCommand is
// not gated by Permissions-Policy so the legacy path works in those environments.
// On localhost dev the policy header is absent, so the async path is used there.

/** Copy `text` to the clipboard. Returns true on success, false on failure. */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Async Clipboard API — preferred, works where Permissions-Policy allows it.
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Blocked by Permissions-Policy or user denied — fall through to legacy.
    }
  }

  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(textarea);

  // Preserve any existing selection so the user's selection is not clobbered.
  const selection = window.getSelection();
  let savedRange: Range | null = null;
  if (selection && selection.rangeCount > 0) {
    savedRange = selection.getRangeAt(0);
  }

  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }

  document.body.removeChild(textarea);

  if (savedRange && selection) {
    selection.removeAllRanges();
    selection.addRange(savedRange);
  }

  return ok;
}
