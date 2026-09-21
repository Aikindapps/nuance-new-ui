import Skeleton from "@mui/material/Skeleton";
import { AuthorBlock } from "../../../components/ui/AuthorBlock";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { usePopularDiscovery } from "../hooks/usePopularDiscovery";
import { popularWritersCopy } from "../../../constants/copy";
import { homeMobileCopy } from "./homeMobileCopy";

export function PopularWriters() {
  const { data, isLoading } = usePopularDiscovery();
  const writers = data?.writers ?? [];

  if (!isLoading && writers.length === 0) return null;

  return (
    <section aria-labelledby="popular-writers-heading">
      <div className="mb-6 flex items-center justify-between gap-4">
        <SectionHeading id="popular-writers-heading">
          <span className="md:hidden">{homeMobileCopy.writersHeading}</span>
          <span className="hidden md:inline">{popularWritersCopy.heading}</span>
        </SectionHeading>
        <a
          href="/explore/writers"
          className="shrink-0 text-body font-medium text-brand-purple hover:underline"
        >
          {popularWritersCopy.viewAllLabel}
        </a>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4 md:flex-row md:overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              className="shrink-0"
              sx={{
                height: { xs: 300, md: 340 },
                width: { xs: "100%", md: 240, lg: 248 },
                borderRadius: "var(--radius-card)",
                display: { xs: i < 3 ? "block" : "none", md: "block" },
              }}
            />
          ))}
        </div>
      ) : (
        <ul className="scrollbar-hide flex flex-col gap-4 md:flex-row md:overflow-x-auto">
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
