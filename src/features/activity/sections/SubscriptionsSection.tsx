import { useState } from "react";
import Button from "@mui/material/Button";
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
import type { SubscriptionRow } from "../hooks/useMySubscriptions";
import { useManageInStripe } from "../hooks/useManageInStripe";
import { useIsMobileViewport } from "../../../lib/useIsMobileViewport";
import { secondaryButtonSx } from "../../../components/ui/modalButtons";
import { subscriptionsCopy as c } from "../../../constants/copy";

// NIC-353 -- SS8.3 Subscriptions section (writers + publications the current
// user subscribes to). Read-only; no billing management (NIC-44). Mirrors
// the FollowersSection pattern: loading -> error -> empty -> populated list
// with row dividers + Show more pager. ActivityNoteBand leads (top) in both
// states.
// NIC-379: publication rows render the house square logo avatar (8px radius)
// via the row's isPublication discriminator; writer rows keep the round photo.
// Desktop frame 1737:2830; phone frame 1741:4872.
// NIC-623: card (Stripe) subscriptions, desktop frame 3094:8914. When the list
// has at least one card row, the note band switches to the card note and
// every row gets a 194-wide slot right of its meta column (24 gap): card rows
// put "Manage in Stripe" in it (ended card rows too -- the billing page is
// where the card gets updated), wallet rows leave it empty so the meta
// columns line up. Card rows show the card status line (copy cardActive /
// cardCancels / cardEnded, full dates). A list with no card row is unchanged.
// NIC-628: phone (< 1024), frame 3064:6674. The card note leads the same way;
// a card row's meta column is a fixed 114 wide (its status line wraps rather
// than squeezing the name) and a full-width "Manage in Stripe" sits 12 under
// the row. Wallet rows keep the shipped phone row (no slot, no button).

const INITIAL_VISIBLE = 10;
const PAGE_SIZE = 10;

// "Apr 12, 2027"
function fmtDay(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// A card row's status line. Ended = its paid period is over (Stripe ended
// it: cancelled, or a renewal failed); there is no payment-failed state.
function cardStatus(row: SubscriptionRow, nowMs: number): string {
  const tpl =
    row.endTimeMs <= nowMs
      ? c.cardEnded
      : row.cancelsAtPeriodEnd
        ? c.cardCancels
        : c.cardActive;
  return tpl.replace("{date}", fmtDay(row.endTimeMs));
}

// NUR/Button secundary 194x48. No side padding: the slot sets the width, so
// the label stays on one line when the page scales down to 1024.
const manageSx = { ...secondaryButtonSx, px: 0, whiteSpace: "nowrap" };

export function SubscriptionsSection() {
  const { data, isLoading, isError, refetch } = useMySubscriptions();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const isMobile = useIsMobileViewport();
  const manage = useManageInStripe();
  const [nowMs] = useState(() => Date.now());

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
  const hasCard = rows.some((r) => r.paidByCard);
  const cardUi = !isMobile && hasCard;

  return (
    <>
      <ActivityNoteBand text={hasCard ? c.cardNote : c.walletNote} />
      <div role="list" aria-label={c.listAriaLabel}>
        {slice.map((row, idx) => (
          <div key={row.principalId} role="listitem">
            {idx > 0 && <ActivityRowDivider />}
            <ActivityUserRow
              user={row.user}
              isPublication={row.isPublication}
              subLine={`@${row.user.handle}`}
              below={
                isMobile && row.paidByCard ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={secondaryButtonSx}
                    disabled={manage.busy}
                    onClick={manage.open}
                  >
                    {c.manageInStripe}
                  </Button>
                ) : undefined
              }
              right={
                cardUi ? (
                  <div className="flex items-center gap-[calc(24*var(--fpx))]">
                    <SubscriptionMeta
                      interval={row.interval}
                      renewsMs={row.endTimeMs}
                      renewsPrefix={c.renewsPrefix}
                      statusLine={row.paidByCard ? cardStatus(row, nowMs) : undefined}
                    />
                    <div className="w-[calc(194*var(--fpx))] shrink-0">
                      {row.paidByCard && (
                        <Button
                          fullWidth
                          variant="outlined"
                          sx={manageSx}
                          disabled={manage.busy}
                          onClick={manage.open}
                        >
                          {c.manageInStripe}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : isMobile && row.paidByCard ? (
                  <div className="w-[calc(114*var(--fpx))]">
                    <SubscriptionMeta
                      interval={row.interval}
                      renewsMs={row.endTimeMs}
                      renewsPrefix={c.renewsPrefix}
                      statusLine={cardStatus(row, nowMs)}
                    />
                  </div>
                ) : (
                  <SubscriptionMeta
                    interval={row.interval}
                    renewsMs={row.endTimeMs}
                    renewsPrefix={c.renewsPrefix}
                  />
                )
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
