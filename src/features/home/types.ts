export type Article = {
  id: string;
  // Bucket canister that holds this post's body. Needed alongside `id` to
  // build the canonical article URL and to fetch the full post.
  bucketCanisterId: string;
  // The post's own `handle` field, lowercased — the publication handle for
  // publication posts, the author handle otherwise. First URL segment.
  routeHandle: string;
  title: string;
  excerpt: string;
  imageSrc: string;
  imageAlt: string;
  author: {
    handle: string;
    displayName: string;
    avatarSrc: string;
    isVerified: boolean;
  };
  publication: { name: string; handle: string } | null;
  publishedOn: string;
  claps: number;
  hasNft: boolean;
};
