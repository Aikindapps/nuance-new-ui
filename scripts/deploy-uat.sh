#!/usr/bin/env bash
set -euo pipefail

# Deploy the UAT asset canister (nuance_uat) to mainnet. PR #11, decision #41.
# Run from the repo root: `npm run deploy:uat`.

DFX="${DFX:-/Users/nicholaso/Library/Application Support/org.dfinity.dfx/bin/dfx}"
IDENTITY="${DFX_IDENTITY:-nick-mainnet}"
# Cycles to allocate to the canister on FIRST create. dfx's default create
# amount is undocumented and may exceed a modest cycles-ledger balance, so we
# set it explicitly (1 TC — decades of runtime for a ~1.5 MB asset canister,
# leaving the rest of the balance as reserve). Ignored on redeploys (canister
# already exists). Override with WITH_CYCLES=… if needed.
WITH_CYCLES="${WITH_CYCLES:-1000000000000}"

echo "→ Building (VITE_DEPLOY_TARGET=uat)…"
VITE_DEPLOY_TARGET=uat npm run build

echo "→ Sanity checks…"
"$DFX" identity whoami | grep -qx "$IDENTITY" || {
  echo "FAIL: active identity is not $IDENTITY (run: \"$DFX\" identity use $IDENTITY)"; exit 1; }
"$DFX" cycles --network ic balance

echo "→ Deploying nuance_uat to mainnet…"
"$DFX" deploy nuance_uat --network ic --identity "$IDENTITY" --with-cycles "$WITH_CYCLES"

CID=$("$DFX" canister id nuance_uat --network ic)
echo
echo "✓ Deployed. Open: https://${CID}.icp0.io/"
echo "  Controller: $("$DFX" identity get-principal)"
