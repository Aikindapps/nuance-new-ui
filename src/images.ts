// Centralized image imports per decision #21. Add named exports as image
// assets are introduced.

// Wallet token logos (PR-1) — multicolor brand marks, so they're committed SVG
// files referenced by URL rather than inline currentColor components.
import nuaIcon from "./assets/tokens/nua.svg";
import nuaFreeIcon from "./assets/tokens/nua-free.svg";
import icpIcon from "./assets/tokens/icp.svg";
import ckbtcIcon from "./assets/tokens/ckbtc.svg";

import type { HoldingRow } from "./config/tokens";

export const tokenIcons: Record<HoldingRow, string> = {
  FreeNUA: nuaFreeIcon,
  NUA: nuaIcon,
  ICP: icpIcon,
  ckBTC: ckbtcIcon,
};
