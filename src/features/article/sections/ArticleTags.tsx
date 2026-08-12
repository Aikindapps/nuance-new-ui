import { TopicFollowPill } from "./TopicFollowPill";
import type { PostTagModel } from "../../../candid/PostCore/PostCore";

// §4.8 (un)follow-tag topic pills below an article (NIC-157). Each pill has two
// tap targets: the label navigates to /explore/topic/:tag (NIC-43), the star
// follows/unfollows the topic (persists → home Following tab). Backend caps at
// MIN 1 / MAX 3; slice defensively.
export function ArticleTags({ tags }: { tags: PostTagModel[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-4 px-6 md:justify-end lg:pr-[calc(92*var(--fpx))] lg:pl-14">
      {tags.slice(0, 3).map((tag) => (
        <TopicFollowPill key={tag.tagId} tag={tag} />
      ))}
    </div>
  );
}
