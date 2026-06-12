import { Navigate } from "react-router-dom";
import { HeaderLoggedIn } from "../components/ui/HeaderLoggedIn";
import { useAuth } from "../contexts/useAuth";
import { walletCopy } from "../constants/copy";
import { WalletIntro } from "../features/wallet/sections/WalletIntro";
import { CurrencyHoldings } from "../features/wallet/sections/CurrencyHoldings";
import { ArticleKeys } from "../features/wallet/keys/ArticleKeys";
import { FreeNuaClaim } from "../features/wallet/sections/FreeNuaClaim";
import { WalletHistory } from "../features/wallet/history/WalletHistory";

// /wallet — Funds Overview (Page 7; PR-1 + the PR #14 completion, decision
// #43). Standalone, logged-in-only route (decision #42). Section order matches
// the Figma overview frame (1:46389): intro → holdings → article keys → free
// NUA → history. The 824px column matches the Figma content block width.

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
        <ArticleKeys />
        <FreeNuaClaim />
        <WalletHistory />
      </main>
    </div>
  );
}

export default Wallet;
