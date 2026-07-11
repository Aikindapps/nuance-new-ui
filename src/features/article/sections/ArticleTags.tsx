import { Tag } from "../../../components/ui/Tag";
import type { PostTagModel } from "../../../candid/PostCore/PostCore";

// Article tag row — Figma 1:5320. Right-aligned purple-on-light pills.
// Tags come from PostKeyProperties (PostCore); each links to its Explore topic
// page at /explore/topic/:tag — the same route the Home Topics rail uses.
export function ArticleTags({ tags }: { tags: PostTagModel[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-4 px-6 md:justify-end lg:pr-[calc(92*var(--fpx))] lg:pl-14">
      {tags.map((tag) => (
        <Tag
          key={tag.tagId}
          label={tag.tagName}
          href={`/explore/topic/${encodeURIComponent(tag.tagName)}`}
          variant="on-light"
        />
      ))}
    </div>
  );
}
