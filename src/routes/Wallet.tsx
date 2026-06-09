import { Navigate } from "react-router-dom";
import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { useAuth } from "../contexts/useAuth";
import { walletCopy } from "../constants/copy";
import { WalletIntro } from "../features/wallet/sections/WalletIntro";
import { CurrencyHoldings } from "../features/wallet/sections/CurrencyHoldings";
import { FreeNuaClaim } from "../features/wallet/sections/FreeNuaClaim";

// /wallet — Funds Overview (Page 7, PR-1). Standalone, logged-in-only route
// (decision #42). History + Article Keys + Deposit/Withdraw flows land in later
// PRs. The 824px column matches the Figma content block width (1:46389).

const CONTAINER = "mx-auto max-w-[calc(824*var(--fpx))]";

export function Wallet() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-white">
      <title>{walletCopy.metaTitle}</title>
      <meta name="description" content={walletCopy.metaDescription} />
      <HeaderLoggedIn />
      <main
        className={`${CONTAINER} flex flex-col gap-[calc(40*var(--fpx))] px-6 pt-12 pb-24 lg:px-14 lg:pt-20`}
      >
        <WalletIntro />
        <CurrencyHoldings />
        <FreeNuaClaim />
      </main>
    </div>
  );
}

export default Wallet;
