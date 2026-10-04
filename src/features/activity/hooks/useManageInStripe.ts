import { useCallback, useRef, useState } from "react";
import { useAuth } from "../../../contexts/useAuth";
import { useActors } from "../../../contexts/useActors";
import { useToast } from "../../../services/toast";
import {
  createBillingPortalSession,
  openCheckoutTab,
} from "../../article/purchase/cardCheckout";
import { cardReturnUrl } from "../../article/purchase/cardReturn";
import { subscriptionsCopy as c } from "../../../constants/copy";

// NIC-623 -- "Manage in Stripe" on card subscription rows (Account >
// Activity > Subscriptions, desktop frame 3094:8914).
//
// Every card row opens the SAME page: the reader's single Stripe billing page
// (all their card subscriptions; update the card or cancel), never one
// subscription. The tab is opened synchronously inside the click so the
// browser allows it, then pointed at Stripe once the card-payment server
// answers. On failure the tab closes and an error toast explains (no frame
// for it; generic copy). One request at a time: `busy` disables every
// Manage in Stripe button until the server answers.
export function useManageInStripe() {
  const { principal } = useAuth();
  const actors = useActors();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const inFlightRef = useRef(false);

  const open = useCallback(() => {
    const readerId = principal?.toText();
    if (!readerId || inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    // Synchronous, inside the click: the browser allows this tab.
    const tab = openCheckoutTab(c.manageOpening);

    void (async () => {
      const res = await createBillingPortalSession({
        authorize: actors.authorizeForProxy,
        readerId,
        returnUrl: cardReturnUrl(),
      });
      inFlightRef.current = false;
      setBusy(false);

      if (res.kind === "url") {
        if (tab && !tab.closed) {
          tab.location.href = res.url;
        } else {
          // Tab blocked or closed by the reader: continue in this tab.
          window.location.assign(res.url);
        }
        return;
      }

      if (tab && !tab.closed) tab.close();
      toast.show(
        res.kind === "noCustomer" ? c.manageNoCustomer : c.manageError,
        "error",
      );
    })();
  }, [actors, principal, toast]);

  return { open, busy };
}
