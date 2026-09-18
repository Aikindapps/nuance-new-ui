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
import { useMySubscriptions } from "../hooks/useMySubscriptions";
import { subscriptionsCopy as c } from "../../../constants/copy";

// NIC-353 -- SS8.3 Subscriptions section (writers + publications the current
// user subscribes to). Read-only; no billing management (NIC-44). Mirrors
// the FollowersSection pattern: loading -> error -> empty -> populated list
// with row dividers + Show more pager. ActivityNoteBand leads (top) in both
// states.
// Desktop frame 1737:2830; phone frame 1741:4872.

const INITIAL_VISIBLE = 10;
const PAGE_SIZE = 10;

export function SubscriptionsSection() {
  const { data, isLoading, isError, refetch } = useMySubscriptions();
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
              subLine={`@${row.user.handle}`}
              right={
                <SubscriptionMeta
                  interval={row.interval}
                  renewsMs={row.endTimeMs}
                  renewsPrefix={c.renewsPrefix}
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

export default SubscriptionsSection;
