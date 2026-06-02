import { Link } from "react-router-dom";
import type { Notification } from "../../../candid/Notifications/Notifications";
import type { UserListItem } from "../../../candid/User/User";
import { buildArticleUrl } from "../../../lib/articleUrl";

// JSX inline template for a notification's body line. The second line
// ("X hr ago") is rendered separately by NotificationItem.
//
// Linkification rules:
// - `@handle` renders as a styled span. No profile route exists in this
//   rebuild yet; the span is the affordance, link wiring is deferred. When a
//   principal can't be resolved (the user lookup batch missed it), we render
//   "@someone" as a graceful fallback rather than the raw principal hash.
// - Article titles render as <Link> when the (handle, postId, bucketCanisterId,
//   title) tuple is fully available. Otherwise plain quoted text.
// - Money / token amounts are intentionally omitted from the inline copy.
//   PR #10 scope: surface "what happened"; balances and exact amounts belong
//   on Page 7 (Funds Overview). Notifications stay one line in the foldout.

export type UserMap = Map<string, UserListItem>;

function Handle({
  principalId,
  userMap,
}: {
  principalId: string;
  userMap: UserMap;
}) {
  const user = userMap.get(principalId);
  const label = user?.handle ? `@${user.handle}` : "@someone";
  return (
    <span className="font-bold text-brand-purple-fluor">{label}</span>
  );
}

function ArticleTitle({
  title,
  postId,
  bucketCanisterId,
  authorHandle,
}: {
  title: string;
  postId: string;
  bucketCanisterId: string;
  authorHandle: string | null;
}) {
  const quoted = `“${title}”`;
  if (!authorHandle) {
    return <span className="font-bold">{quoted}</span>;
  }
  const href = buildArticleUrl({
    handle: authorHandle,
    postId,
    bucketCanisterId,
    title,
  });
  return (
    <Link to={href} className="font-bold underline-offset-2 hover:underline">
      {quoted}
    </Link>
  );
}

// Render the inline body for a notification. `myHandle` is needed because
// notifications about *my* article ("commented on your article") link back to
// my own article URL, and the URL needs the author's handle.

type Props = {
  notification: Notification;
  userMap: UserMap;
  myHandle: string | null;
};

export function NotificationBody({ notification, userMap, myHandle }: Props) {
  const c = notification.content;

  if ("NewArticleByFollowedWriter" in c) {
    const v = c.NewArticleByFollowedWriter;
    const writerHandle = userMap.get(v.postWriterPrincipal)?.handle ?? null;
    return (
      <>
        <Handle principalId={v.postWriterPrincipal} userMap={userMap} />{" "}
        posted a new article:{" "}
        <ArticleTitle
          title={v.postTitle}
          postId={v.postId}
          bucketCanisterId={v.bucketCanisterId}
          authorHandle={writerHandle}
        />
      </>
    );
  }

  if ("NewArticleByFollowedTag" in c) {
    const v = c.NewArticleByFollowedTag;
    const writerHandle = userMap.get(v.postWriterPrincipal)?.handle ?? null;
    return (
      <>
        <Handle principalId={v.postWriterPrincipal} userMap={userMap} />{" "}
        posted in{" "}
        <span className="font-bold text-brand-purple-fluor">#{v.tagName}</span>:{" "}
        <ArticleTitle
          title={v.postTitle}
          postId={v.postId}
          bucketCanisterId={v.bucketCanisterId}
          authorHandle={writerHandle}
        />
      </>
    );
  }

  if ("NewCommentOnMyArticle" in c) {
    const v = c.NewCommentOnMyArticle;
    return (
      <>
        <Handle principalId={v.commenterPrincipal} userMap={userMap} />{" "}
        {v.isReply ? "replied on" : "commented on"} your article:{" "}
        <ArticleTitle
          title={v.postTitle}
          postId={v.postId}
          bucketCanisterId={v.bucketCanisterId}
          authorHandle={myHandle}
        />
      </>
    );
  }

  if ("ReplyToMyComment" in c) {
    const v = c.ReplyToMyComment;
    const writerHandle = userMap.get(v.postWriterPrincipal)?.handle ?? null;
    return (
      <>
        <Handle principalId={v.replyCommenterPrincipal} userMap={userMap} />{" "}
        replied to your comment on:{" "}
        <ArticleTitle
          title={v.postTitle}
          postId={v.postId}
          bucketCanisterId={v.bucketCanisterId}
          authorHandle={writerHandle}
        />
      </>
    );
  }

  if ("NewFollower" in c) {
    return (
      <>
        <Handle
          principalId={c.NewFollower.followerPrincipalId}
          userMap={userMap}
        />{" "}
        started following you
      </>
    );
  }

  if ("TipReceived" in c) {
    const v = c.TipReceived;
    return (
      <>
        <Handle principalId={v.tipSenderPrincipal} userMap={userMap} /> tipped
        you on:{" "}
        <ArticleTitle
          title={v.postTitle}
          postId={v.postId}
          bucketCanisterId={v.bucketCanisterId}
          authorHandle={myHandle}
        />
      </>
    );
  }

  if ("PremiumArticleSold" in c) {
    const v = c.PremiumArticleSold;
    return (
      <>
        <Handle principalId={v.purchaserPrincipal} userMap={userMap} />{" "}
        purchased your premium article:{" "}
        <ArticleTitle
          title={v.postTitle}
          postId={v.postId}
          bucketCanisterId={v.bucketCanisterId}
          authorHandle={myHandle}
        />
      </>
    );
  }

  if ("AuthorGainsNewSubscriber" in c) {
    return (
      <>
        <Handle
          principalId={c.AuthorGainsNewSubscriber.subscriberPrincipalId}
          userMap={userMap}
        />{" "}
        subscribed to you
      </>
    );
  }

  if ("AuthorLosesSubscriber" in c) {
    return (
      <>
        <Handle
          principalId={c.AuthorLosesSubscriber.subscriberPrincipalId}
          userMap={userMap}
        />{" "}
        unsubscribed
      </>
    );
  }

  if ("YouSubscribedToAuthor" in c) {
    return (
      <>
        Your subscription to{" "}
        <Handle
          principalId={c.YouSubscribedToAuthor.subscribedWriterPrincipalId}
          userMap={userMap}
        />{" "}
        is active
      </>
    );
  }

  if ("YouUnsubscribedFromAuthor" in c) {
    return (
      <>
        Your subscription to{" "}
        <Handle
          principalId={c.YouUnsubscribedFromAuthor.subscribedWriterPrincipalId}
          userMap={userMap}
        />{" "}
        has been cancelled
      </>
    );
  }

  if ("ReaderExpiredSubscription" in c) {
    return (
      <>
        Your subscription to{" "}
        <Handle
          principalId={c.ReaderExpiredSubscription.subscribedWriterPrincipalId}
          userMap={userMap}
        />{" "}
        has expired
      </>
    );
  }

  if ("FaucetClaimAvailable" in c) {
    return <>Your NUA faucet claim is available</>;
  }

  if ("VerifyProfile" in c) {
    return <>Verify your profile to get a verified badge</>;
  }

  // Exhaustive guard — any unhandled variant renders as a safe fallback rather
  // than blowing up the whole foldout. A new canister-side variant landing in
  // production should surface here as a TODO instead of a crash.
  return <>You have a new notification</>;
}
