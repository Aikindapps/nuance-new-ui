import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { Tag } from "../components/ui/Tag";
import { usePopularDiscovery } from "../features/home/hooks/usePopularDiscovery";
import { WelcomeBanner } from "../features/home/sections/WelcomeBanner";
import { WriteCtaBanner } from "../features/home/sections/WriteCtaBanner";
import { HomeTabBar } from "../features/home/sections/HomeTabBar";
import { FollowingTab } from "../features/home/sections/FollowingTab";
import { NewTab } from "../features/home/sections/NewTab";
import { YourMixStub } from "../features/home/sections/YourMixStub";
import { heroCopy, homeLoggedInCopy } from "../constants/copy";

export type HomeLoggedInTab = "following" | "new" | "your-mix";

// Logged-in home shell. Header + WelcomeBanner + Topics on the brand gradient
// band; WriteCtaBanner + HomeTabBar + tab content below. Tab selection is
// URL-driven (decision #26) so `tab` comes from the Home route branch.

export function HomeLoggedIn({ tab }: { tab: HomeLoggedInTab }) {
  const { data } = usePopularDiscovery();
  const topics = data?.topics.length ? data.topics : heroCopy.fallbackTopics;

  return (
    <>
      <title>{homeLoggedInCopy.metadata.title}</title>
      <meta name="description" content={homeLoggedInCopy.metadata.description} />
      <meta property="og:title" content={homeLoggedInCopy.metadata.title} />
      <meta property="og:description" content={homeLoggedInCopy.metadata.description} />
      <meta property="og:type" content="website" />

      <main className="min-h-screen bg-white">
        <h1 className="sr-only">{homeLoggedInCopy.metadata.h1}</h1>

        <HeaderLoggedIn />
        <WelcomeBanner />

        <div className="mx-auto max-w-[1440px] px-4 pt-6 pb-10 md:px-8 md:pt-8 md:pb-12 lg:px-14 lg:pt-10 lg:pb-14">
          <section
            aria-labelledby="topics-heading"
          >
            <h2
              id="topics-heading"
              className="font-bold text-ink-80 lg:text-[22px] lg:leading-8 lg:tracking-[-0.44px]"
            >
              {heroCopy.topicsHeading}
            </h2>

            <ul className="scrollbar-hide mt-4 flex gap-3 overflow-x-auto lg:mt-6 lg:gap-4">
              {topics.map((topic) => (
                <li key={topic} className="shrink-0">
                  <Tag
                    label={topic}
                    href={`/topic/${encodeURIComponent(topic)}`}
                    variant="on-light"
                  />
                </li>
              ))}
            </ul>

            <a
              href="/topics"
              className="mt-4 inline-block text-body font-medium text-brand-purple underline underline-offset-4 hover:no-underline lg:mt-6"
            >
              {heroCopy.exploreAllLabel}
            </a>
          </section>
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-8 md:px-8 md:pb-12 lg:px-14 lg:pb-16">
          <WriteCtaBanner />
          <div className="mt-12 md:mt-14 lg:mt-16">
            <HomeTabBar />
          </div>
          <div className="mt-10 md:mt-12">
            {tab === "following" && <FollowingTab />}
            {tab === "new" && <NewTab />}
            {tab === "your-mix" && <YourMixStub />}
          </div>
        </div>
      </main>
    </>
  );
}

