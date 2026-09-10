import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { walletCopy } from "../constants/copy";
import { WalletIntro } from "../features/wallet/sections/WalletIntro";
import { CurrencyHoldings } from "../features/wallet/sections/CurrencyHoldings";
import { ArticleKeys } from "../features/wallet/keys/ArticleKeys";
import { FreeNuaClaim } from "../features/wallet/sections/FreeNuaClaim";
import { WalletHistory } from "../features/wallet/history/WalletHistory";
import { AccountShell } from "../components/account/AccountShell";

// /wallet — Funds Overview (Page 7; PR-1 + the PR #14 completion, decision
// #43). Standalone, logged-in-only route (decision #42). Section order matches
// the Figma overview frame (1:46389): intro → holdings → article keys → free
// NUA → history. The 824px column matches the Figma content block width.

export function Wallet() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AccountShell active="wallet">
      <title>{walletCopy.metaTitle}</title>
      <meta name="description" content={walletCopy.metaDescription} />
      <div className="flex flex-col gap-[calc(40*var(--fpx))]">
        <WalletIntro />
        <CurrencyHoldings />
        <ArticleKeys />
        <FreeNuaClaim />
        <WalletHistory />
      </div>
    </AccountShell>
  );
}

export default Wallet;
