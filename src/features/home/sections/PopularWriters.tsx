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
      <SectionHeading id="popular-writers-heading" className="mb-6">
        {popularWritersCopy.heading}
      </SectionHeading>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[340px] w-[220px] shrink-0 animate-pulse rounded-card bg-ink-60/20 md:w-[240px] lg:w-[248px]"
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
