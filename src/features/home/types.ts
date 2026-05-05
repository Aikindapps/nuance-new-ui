export type Article = {
  id: string;
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
  publication: { name: string; slug: string } | null;
  publishedOn: string;
  claps: number;
  hasNft: boolean;
};
