import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { UserListItem } from "../../candid/User/User";
import { useAuth } from "../../contexts/useAuth";
import { useModal } from "../../services/modal";
import { LoginModal, LOGIN_MODAL_TITLE_ID } from "../../components/LoginModal/LoginModal";
import {
  SubscriptionPurchaseModal,
  SUBSCRIPTION_PURCHASE_MODAL_TITLE_ID,
} from "../article/purchase/SubscriptionPurchaseModal";
import {
  readCardReturn,
  withoutCardReturn,
  type CardReturn,
} from "../article/purchase/cardReturn";

type Args = {
  isPublication: boolean;
  // The writer's or publication's list item (undefined until loaded).
  item: UserListItem | undefined;
  // The id subscriptions are keyed on: undefined = not known yet,
  // null = cannot be resolved.
  targetId: string | null | undefined;
  // Your own profile: no Subscribe window.
  isOwn: boolean;
};

// The button action (login window, or the Subscribe window) and the
// back-from-Stripe handling for the writer profile and the publication home.
export function useSubscribeWindow({
  isPublication,
  item,
  targetId,
  isOwn,
}: Args): () => void {
  const modal = useModal();
  const { isAuthenticated, status } = useAuth();

  const openWindow = (cardReturn: CardReturn | null) => {
    if (!item || !targetId) return;
    modal.open(
      <SubscriptionPurchaseModal
        isPublication={isPublication}
        handle={item.handle}
        profile={item}
        writerPrincipalId={targetId}
        cardReturn={cardReturn}
        onClose={modal.close}
      />,
      {
        ariaLabelledBy: SUBSCRIPTION_PURCHASE_MODAL_TITLE_ID,
        dismissable: false,
      },
    );
  };

  // Back from Stripe Checkout: same handling as the article page.
  const [searchParams, setSearchParams] = useSearchParams();
  const cardReturn = readCardReturn(searchParams);
  const cardReturnHandled = useRef(false);
  useEffect(() => {
    if (!cardReturn || cardReturnHandled.current) return;
    if (status === "loading" || !item || targetId === undefined) return;
    cardReturnHandled.current = true;
    setSearchParams(withoutCardReturn(searchParams), { replace: true });
    if (isAuthenticated && !isOwn && targetId) openWindow(cardReturn);
  });

  return () => {
    if (!isAuthenticated) {
      modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });
      return;
    }
    openWindow(null);
  };
}
