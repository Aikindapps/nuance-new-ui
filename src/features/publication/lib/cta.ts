// NIC-378 §6.6 — Publication CTA utilities (plain .ts module).
// Extracted from PublicationCtaBar.tsx so the component file can satisfy
// react-refresh/only-export-components (no non-component co-exports).

/** All four fields empty → banner is logically disabled. */
export function isCtaEmpty(cta: {
  ctaCopy: string;
  buttonCopy: string;
  link: string;
  icon: string;
}): boolean {
  return (
    cta.ctaCopy.trim() === "" &&
    cta.buttonCopy.trim() === "" &&
    cta.link.trim() === "" &&
    cta.icon.trim() === ""
  );
}
