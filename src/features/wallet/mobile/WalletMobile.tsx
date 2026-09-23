import { WalletIntro } from "../sections/WalletIntro";
import { WalletLoadError } from "./WalletLoadError";
import { WalletBalancesMobile } from "./WalletBalancesMobile";
import { WalletKeysMobile } from "./WalletKeysMobile";
import { WalletFreeNuaMobile } from "./WalletFreeNuaMobile";
import { WalletHistoryMobile } from "./WalletHistoryMobile";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useFreeNuaBalance } from "../hooks/useFreeNuaBalance";
import { useArticleKeys } from "../keys/useArticleKeys";
import { useWalletHistory } from "../history/useWalletHistory";
import { useNuaPrices } from "../hooks/useNuaEquivalent";

// Phone /wallet content tree (Figma 2419:4829 default, 2420:4869
// empty, 2421:4893 loading, 2422:4900 error, 2423:4917 overflow).
// AccountShell already ships the header/drawer chrome; this owns
// only the page-level error branch and section order. There is no
// page-level loading gate -- each section shows its own skeleton
// while its own query is pending, so a slow history aggregation
// never blanks balances that already loaded.
export function WalletMobile() {
  const balances = useTokenBalances();
  const freeNua = useFreeNuaBalance();
  const keys = useArticleKeys();
  const history = useWalletHistory();
  const prices = useNuaPrices();

  const retryAll = () => {
    balances.refetch();
    freeNua.refetch();
    keys.refetch();
    history.refetch();
    prices.refetch();
  };

  if (balances.isError || freeNua.isError) {
    return <WalletLoadError onRetry={retryAll} />;
  }

  return (
    <div className="flex flex-col gap-[calc(40*var(--fpx))]">
      <WalletIntro />
      <WalletBalancesMobile />
      <WalletKeysMobile />
      <WalletFreeNuaMobile />
      <WalletHistoryMobile />
    </div>
  );
}
