import { Header } from "../../../components/ui/Header";
import { Tag } from "../../../components/ui/Tag";
import { usePopularDiscovery } from "../hooks/usePopularDiscovery";
import { heroCopy } from "../../../constants/copy";

export function Hero() {
  const { data } = usePopularDiscovery();
  // Fallback topics shown on first paint before canister data loads, and if
  // the data call fails. Replaced by the top-K tags from the live
  // popular+latest sample once loaded.
  const topics = data?.topics.length ? data.topics : heroCopy.fallbackTopics;

  return (
    <div className="bg-brand-gradient w-full text-white">
      <Header />

      <section
        aria-labelledby="topics-heading"
        className="mx-auto max-w-[calc(1440*var(--fpx))] px-4 pt-8 pb-10 md:px-8 md:pt-10 md:pb-12 lg:px-14 lg:pt-14 lg:pb-16"
      >
        <h2
          id="topics-heading"
          className="text-body font-bold text-white lg:text-lg"
        >
          {heroCopy.topicsHeading}
        </h2>

        <ul className="scrollbar-hide mt-4 flex gap-3 overflow-x-auto lg:mt-6 lg:gap-4">
          {topics.map((topic) => (
            <li key={topic} className="shrink-0">
              <Tag label={topic} href={`/explore/topic/${encodeURIComponent(topic)}`} />
            </li>
          ))}
        </ul>

        {/* "Explore all topics" — intentionally NOT plugged in yet: the all-topics
            Explore surface is undesigned (NIC-91). Rendered as a disabled "Coming soon"
            affordance (DisabledTab convention, SearchResults.tsx) rather than a live link,
            because there is no /topics route and any single-segment path falls through to
            /:handle (WriterProfile) → misleading "Writer not found" (NIC-90). */}
        <span
          aria-disabled="true"
          title="Coming soon"
          className="mt-4 inline-block cursor-not-allowed text-body font-medium text-white/60 underline underline-offset-4 lg:mt-6"
        >
          {heroCopy.exploreAllLabel}
        </span>

      </section>
    </div>
  );
}
