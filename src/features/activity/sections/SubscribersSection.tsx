import { useState } from "react";
import {
  ActivityLoading,
  ActivityError,
  ActivityEmpty,
  ShowMoreButton,
  ActivityUserRow,
  ActivityRowDivider,
  SubscriptionMeta,
  ActivityNoteBand,
} from "../components/ActivityPrimitives";
import { useMySubscribers } from "../hooks/useMySubscribers";
import { subscribersCopy as c } from "../../../constants/copy";

// NIC-353 -- SS8.3 Subscribers section (people who subscribe to the current
// user). Read-only; no earnings or plan management (NIC-44). Mirrors the
// FollowersSection pattern: loading -> error -> empty -> populated list with
// row dividers + Show more pager. ActivityNoteBand leads (top) in both states.
// NIC-379: publication rows render the house square logo avatar (8px radius)
// via the row's isPublication discriminator; writer rows keep the round photo.
// Desktop frame 1736:4477; phone frame 1740:2830.

const INITIAL_VISIBLE = 10;
const PAGE_SIZE = 10;

export function SubscribersSection() {
  const { data, isLoading, isError, refetch } = useMySubscribers();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  if (isLoading) return <ActivityLoading />;

  if (isError) {
    return (
      <ActivityError
        title={c.errorTitle}
        body={c.errorBody}
        retryLabel={c.retryLabel}
        onRetry={() => void refetch()}
      />
    );
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return (
      <>
        <ActivityNoteBand text={c.walletNote} />
        <ActivityEmpty heading={c.emptyHeading} body={c.emptyBody} />
      </>
    );
  }

  const slice = rows.slice(0, visible);

  return (
    <>
      <ActivityNoteBand text={c.walletNote} />
      <div role="list" aria-label={c.listAriaLabel}>
        {slice.map((row, idx) => (
          <div key={row.principalId} role="listitem">
            {idx > 0 && <ActivityRowDivider />}
            <ActivityUserRow
              user={row.user}
              isPublication={row.isPublication}
              subLine={`@${row.user.handle}`}
              right={
                <SubscriptionMeta
                  interval={row.interval}
                  sinceMs={row.startTimeMs}
                  sincePrefix={c.sincePrefix}
                />
              }
            />
          </div>
        ))}
      </div>
      {rows.length > visible && (
        <ShowMoreButton
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          label={c.showMore}
        />
      )}
    </>
  );
}

export default SubscribersSection;
