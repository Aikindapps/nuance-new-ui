import type { NotificationContent } from "../../../candid/Notifications/Notifications";

// Pure data extraction — collect every principal text that appears inside a
// NotificationContent variant. Lives in a .ts file (not .tsx) so the
// rendering module can stay component-only and Fast Refresh stays happy.
// FaucetClaimAvailable and VerifyProfile carry no principals.

export function collectPrincipals(content: NotificationContent): string[] {
  const out: string[] = [];
  if ("AuthorGainsNewSubscriber" in content) {
    out.push(content.AuthorGainsNewSubscriber.subscriberPrincipalId);
  } else if ("AuthorLosesSubscriber" in content) {
    out.push(content.AuthorLosesSubscriber.subscriberPrincipalId);
  } else if ("NewArticleByFollowedTag" in content) {
    out.push(content.NewArticleByFollowedTag.postWriterPrincipal);
  } else if ("NewArticleByFollowedWriter" in content) {
    out.push(content.NewArticleByFollowedWriter.postWriterPrincipal);
  } else if ("NewCommentOnMyArticle" in content) {
    out.push(content.NewCommentOnMyArticle.commenterPrincipal);
  } else if ("NewFollower" in content) {
    out.push(content.NewFollower.followerPrincipalId);
  } else if ("PremiumArticleSold" in content) {
    out.push(content.PremiumArticleSold.purchaserPrincipal);
  } else if ("ReaderExpiredSubscription" in content) {
    out.push(content.ReaderExpiredSubscription.subscribedWriterPrincipalId);
  } else if ("ReplyToMyComment" in content) {
    out.push(
      content.ReplyToMyComment.replyCommenterPrincipal,
      content.ReplyToMyComment.postWriterPrincipal,
    );
  } else if ("TipReceived" in content) {
    out.push(content.TipReceived.tipSenderPrincipal);
  } else if ("YouSubscribedToAuthor" in content) {
    out.push(content.YouSubscribedToAuthor.subscribedWriterPrincipalId);
  } else if ("YouUnsubscribedFromAuthor" in content) {
    out.push(content.YouUnsubscribedFromAuthor.subscribedWriterPrincipalId);
  }
  return out;
}
