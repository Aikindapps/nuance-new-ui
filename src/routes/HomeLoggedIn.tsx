import { Header } from "../components/ui/Header";
import { Tag } from "../components/ui/Tag";
import { usePopularDiscovery } from "../features/home/hooks/usePopularDiscovery";
import { WelcomeBanner } from "../features/home/sections/WelcomeBanner";
import { WriteCtaBanner } from "../features/home/sections/WriteCtaBanner";
import { heroCopy, homeLoggedInCopy } from "../constants/copy";

export type HomeLoggedInTab = "following" | "new" | "your-mix";

// PR #4 Phase 1: shell composition with placeholders for sections that land
// in later phases. Each <Placeholder /> marks where the real component will
// be mounted. Replace as each phase ships.

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

      <main className="min-h-screen">
        <h1 className="sr-only">{homeLoggedInCopy.metadata.h1}</h1>

        <div className="bg-brand-gradient w-full text-white">
          <Header />

          <section
            aria-labelledby="topics-heading"
            className="mx-auto max-w-[1440px] px-4 pt-8 pb-10 md:px-8 md:pt-10 md:pb-12 lg:px-14 lg:pt-14 lg:pb-16"
          >
            <div className="mb-6 flex justify-end lg:mb-10">
              <WelcomeBanner />
            </div>

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

        <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-12 lg:px-14 lg:py-16">
          <WriteCtaBanner />
          <div className="mt-12 md:mt-14 lg:mt-16">
            <Placeholder label="Phase 5 — HomeTabBar (3 tabs)" />
          </div>
          <div className="mt-10 md:mt-12">
            <Placeholder
              label={`Phase 5/6 — Tab content for "${tab}"`}
              detail={
                tab === "your-mix"
                  ? homeLoggedInCopy.yourMixStubHeading
                  : tab === "following"
                    ? "Phase 5 — Following feed (first authed canister consumer)"
                    : "Phase 6 — New tab (reuses HomeLoggedOut's New layout)"
              }
            />
          </div>
        </div>
      </main>
    </>
  );
}

function Placeholder({
  label,
  detail,
  onDark = false,
}: {
  label: string;
  detail?: string;
  onDark?: boolean;
}) {
  const borderClass = onDark
    ? "border-white/40 bg-white/10"
    : "border-brand-purple/30 bg-brand-purple/5";
  const labelClass = onDark ? "text-white" : "text-ink";
  const detailClass = onDark ? "text-white/80" : "text-ink-80";

  return (
    <div
      className={`rounded-card border-2 border-dashed ${borderClass} px-6 py-8 text-center`}
      data-pr4-placeholder={label}
    >
      <p className={`text-body font-medium ${labelClass}`}>{label}</p>
      {detail && <p className={`mt-2 text-sm ${detailClass}`}>{detail}</p>}
    </div>
  );
}
