import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { Tag } from "../components/ui/Tag";
import { usePopularDiscovery } from "../features/home/hooks/usePopularDiscovery";
import { WelcomeBanner } from "../features/home/sections/WelcomeBanner";
import { WriteCtaBanner } from "../features/home/sections/WriteCtaBanner";
import { HomeTabBar } from "../features/home/sections/HomeTabBar";
import { FollowingTab } from "../features/home/sections/FollowingTab";
import { ArticleTab } from "../features/home/sections/ArticleTab";
import { heroCopy, homeMetadata } from "../constants/copy";

export type HomeLoggedInTab = "popular" | "following" | "new";

// Logged-in home shell. Header + WelcomeBanner + Topics on the brand gradient
// band; WriteCtaBanner + HomeTabBar + tab content below. Tab selection is
// URL-driven (decision #26) so `tab` comes from the Home route branch.

export function HomeLoggedIn({ tab }: { tab: HomeLoggedInTab }) {
  const { data } = usePopularDiscovery();
  const topics = data?.topics.length ? data.topics : heroCopy.fallbackTopics;
  // Per-tab metadata — the same entry a given URL serves when logged out
  // (`/` → popular, `/new` → new), plus a dedicated `following` entry.
  const meta = homeMetadata[tab];

  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:type" content="website" />

      <main className="min-h-screen bg-white">
        <h1 className="sr-only">{meta.h1}</h1>

        <HeaderLoggedIn />
        <WelcomeBanner />

        <div className="mx-auto max-w-[calc(1440*var(--fpx))] px-4 pt-6 pb-10 md:px-8 md:pt-8 md:pb-12 lg:px-14 lg:pt-10 lg:pb-14">
          <section
            aria-labelledby="topics-heading"
          >
            <h2
              id="topics-heading"
              className="font-bold text-ink-80 lg:text-[length:calc(22*var(--fpx))] lg:leading-8 lg:tracking-[calc(-0.44*var(--fpx))]"
            >
              {heroCopy.topicsHeading}
            </h2>

            <ul className="scrollbar-hide mt-4 flex gap-3 overflow-x-auto lg:mt-6 lg:gap-4">
              {topics.map((topic) => (
                <li key={topic} className="shrink-0">
                  <Tag
                    label={topic}
                    href={`/explore/topic/${encodeURIComponent(topic)}`}
                    variant="on-light"
                  />
                </li>
              ))}
            </ul>

            {/* "Explore all topics" — links to the all-topics Explore index (NIC-139). */}
            <a
              href="/explore/topics"
              className="mt-4 inline-block text-body font-medium text-brand-purple underline underline-offset-4 hover:no-underline lg:mt-6"
            >
              {heroCopy.exploreAllLabel}
            </a>

          </section>
        </div>

        <div className="mx-auto max-w-[calc(1440*var(--fpx))] px-4 pb-8 md:px-8 md:pb-12 lg:px-14 lg:pb-16">
          <WriteCtaBanner />
          <div className="mt-12 md:mt-14 lg:mt-16">
            <HomeTabBar />
          </div>
          <div className="mt-10 md:mt-12">
            {tab === "popular" && <ArticleTab variant="popular" />}
            {tab === "following" && <FollowingTab />}
            {tab === "new" && <ArticleTab variant="new" />}
          </div>
        </div>
      </main>
    </>
  );
}

