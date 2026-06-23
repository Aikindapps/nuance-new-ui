import { CenteredMessage } from "../components/ui/CenteredMessage";
import { notFoundCopy } from "../constants/copy";

// 404 catch-all — matched by the path:"*" route in main.tsx.
// Auth-aware shell via CenteredMessage > PageShell.

export function NotFound() {
  return (
    <CenteredMessage
      heading={notFoundCopy.heading}
      body={notFoundCopy.body}
      actionHref="/"
      actionLabel={notFoundCopy.homeLabel}
    />
  );
}
