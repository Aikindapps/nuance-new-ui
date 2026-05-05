import Skeleton from "@mui/material/Skeleton";
import { PublicationBlock } from "../../../components/ui/PublicationBlock";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { usePopularDiscovery } from "../hooks/usePopularDiscovery";
import { popularPublicationsCopy } from "../../../constants/copy";

export function PopularPublications() {
  const { data, isLoading } = usePopularDiscovery();
  const pubs = data?.publications ?? [];

  if (!isLoading && pubs.length === 0) return null;

  return (
    <section aria-labelledby="popular-publications-heading">
      <div className="mb-6 flex items-center justify-between gap-4">
        <SectionHeading id="popular-publications-heading">
          {popularPublicationsCopy.heading}
        </SectionHeading>
        <a
          href="/publications"
          className="shrink-0 text-body font-medium text-brand-purple hover:underline"
        >
          {popularPublicationsCopy.viewAllLabel}
        </a>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {[0, 1].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              sx={{ height: 180, borderRadius: "var(--radius-card)" }}
            />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {pubs.map((pub) => (
            <li key={pub.handle}>
              <PublicationBlock publication={pub} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
