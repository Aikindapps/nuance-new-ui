import type { PostBucketType__1 } from "../../../candid/PostBucket/PostBucket";
import type { UserListItem } from "../../../candid/User/User";
import type { PostKeyProperties } from "../../../candid/PostCore/PostCore";
import { buildArticleUrl } from "../../../lib/articleUrl";
import { extractExcerpt, formatIsoDate } from "../lib/articleSeo";

// Dynamic article SEO — Phase 10 of PR #7. React 19 hoists <title>, <meta>,
// <link>, and <script> placed in component JSX into <head>, dedupes by
// name/property/rel, and replaces them on prop change. This component
// renders nothing visible — just side-effect tags.
//
// Targets JS-capable consumers: modern Googlebot, social-media unfurlers
// (Slackbot, Twitterbot, facebookexternalhit, LinkedInBot), and human
// readers viewing source. Traditional crawlers are served by the
// production crawler proxy per decision #32 — this is the *complementary*
// SEO surface, not a duplicate.

const SITE_ORIGIN = "https://nuance.xyz";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;
const NUANCE_LOGO = `${SITE_ORIGIN}/og-image.png`;

type Props = {
  post: PostBucketType__1;
  author: UserListItem | null;
  publication: UserListItem | null;
  meta: PostKeyProperties | null;
};

export function ArticleHead({ post, author, publication, meta }: Props) {
  const title = post.title || "Article";
  const fullTitle = `${title} — Nuance`;

  const description =
    post.subtitle?.trim() || extractExcerpt(post.content) || "Read this article on Nuance.";

  const authorHandle = (post.creatorHandle || post.handle).toLowerCase();
  const authorName = author?.displayName || authorHandle;
  const authorUrl = `${SITE_ORIGIN}/${authorHandle}`;

  const url =
    SITE_ORIGIN +
    buildArticleUrl({
      handle: post.handle,
      postId: post.postId,
      bucketCanisterId: post.bucketCanisterId,
      title,
    });

  const image = post.headerImage?.trim() || DEFAULT_OG_IMAGE;

  const published = formatIsoDate(post.publishedDate) || formatIsoDate(post.created);
  const modifiedRaw = formatIsoDate(post.modified);
  const modified = modifiedRaw && modifiedRaw !== published ? modifiedRaw : "";

  const tags = meta?.tags ?? [];

  // JSON-LD Article schema. Optional fields are omitted when empty so the
  // emitted JSON stays clean (Google's Rich Results test flags empty values
  // as warnings).
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: {
      "@type": "Person",
      name: author?.displayName || authorHandle,
      url: authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Nuance",
      url: SITE_ORIGIN,
      logo: { "@type": "ImageObject", url: NUANCE_LOGO },
    },
  };
  if (published) jsonLd.datePublished = published;
  if (modified) jsonLd.dateModified = modified;
  if (publication?.displayName) {
    jsonLd.publisher = {
      "@type": "Organization",
      name: publication.displayName,
      url: `${SITE_ORIGIN}/${(publication.handle || "").toLowerCase()}`,
    };
  }

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="Nuance" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="article:author" content={authorName} />
      {published && <meta property="article:published_time" content={published} />}
      {modified && <meta property="article:modified_time" content={modified} />}
      {tags.map((tag) => (
        <meta key={tag.tagId} property="article:tag" content={tag.tagName} />
      ))}

      {/* Twitter card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
