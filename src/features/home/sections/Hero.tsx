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
        className="mx-auto max-w-[1440px] px-4 pt-8 pb-10 md:px-8 md:pt-10 md:pb-12 lg:px-14 lg:pt-14 lg:pb-16"
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
              <Tag label={topic} href={`/topic/${encodeURIComponent(topic)}`} />
            </li>
          ))}
        </ul>

        <a
          href="/topics"
          className="mt-4 inline-block text-body font-medium text-white underline underline-offset-4 hover:no-underline lg:mt-6"
        >
          {heroCopy.exploreAllLabel}
        </a>
      </section>
    </div>
  );
}
