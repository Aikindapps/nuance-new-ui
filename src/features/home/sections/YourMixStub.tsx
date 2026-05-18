import { homeLoggedInCopy } from "../../../constants/copy";

// Phase 6 — Your mix tab placeholder. Real recs sections land in PR #5
// alongside the algorithm decision. Per decision #26 the tab stays visible
// (real route at /your-mix) so the design intent is preserved; the content
// just communicates state instead of recommendations.

export function YourMixStub() {
  return (
    <div className="rounded-card border border-ink-border/20 bg-ink-60/5 p-12 text-center md:p-16">
      <p className="text-h3 font-bold text-ink">
        {homeLoggedInCopy.yourMixStubHeading}
      </p>
      <p className="mx-auto mt-4 max-w-2xl text-body text-ink-80 md:text-lg">
        {homeLoggedInCopy.yourMixStubBody}
      </p>
    </div>
  );
}
