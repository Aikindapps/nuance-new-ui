import Skeleton from "@mui/material/Skeleton";
import { AuthorBlock } from "../../../components/ui/AuthorBlock";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { usePopularDiscovery } from "../hooks/usePopularDiscovery";
import { popularWritersCopy } from "../../../constants/copy";

export function PopularWriters() {
  const { data, isLoading } = usePopularDiscovery();
  const writers = data?.writers ?? [];

  if (!isLoading && writers.length === 0) return null;

  return (
    <section aria-labelledby="popular-writers-heading">
      <div className="mb-6 flex items-center justify-between gap-4">
        <SectionHeading id="popular-writers-heading">
          {popularWritersCopy.heading}
        </SectionHeading>
        <a
          href="/explore/writers"
          className="shrink-0 text-body font-medium text-brand-purple hover:underline"
        >
          {popularWritersCopy.viewAllLabel}
        </a>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              className="shrink-0"
              sx={{
                height: 340,
                width: { xs: 220, md: 240, lg: 248 },
                borderRadius: "var(--radius-card)",
              }}
            />
          ))}
        </div>
      ) : (
        <ul className="scrollbar-hide flex gap-4 overflow-x-auto">
          {writers.map((author) => (
            <li key={author.handle}>
              <AuthorBlock author={author} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
