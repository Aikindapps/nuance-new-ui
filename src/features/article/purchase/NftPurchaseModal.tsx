import { useState } from "react";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { Popup } from "../../../components/ui/Popup";
import { IconPartySuccess } from "../../../components/ui/icons/IconPartySuccess";
import { nftPurchaseCopy } from "../../../constants/copy";
import { formatAmount } from "../../../lib/tokenMath";
import { primaryButtonSx, secondaryButtonSx } from "../../../components/ui/modalButtons";
import { useNftPurchase } from "./useNftPurchase";

export const NFT_PURCHASE_MODAL_TITLE_ID = "nft-purchase-modal-title";

// Spinner component (Figma: 64×64 track + arc, see frame 1030:11369).
function Spinner() {
  return (
    <div className="relative mx-auto my-6 size-16">
      {/* Track */}
      <svg
        className="absolute inset-0 size-16"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="rgba(55,58,73,0.10)"
          strokeWidth="6"
        />
      </svg>
      {/* Arc — animated */}
      <svg
        className="absolute inset-0 size-16 animate-spin"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="#5405D4"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="182"
          strokeDashoffset="145"
        />
      </svg>
    </div>
  );
}

// Summary card spacing is per-caller (Figma context numbers):
//   Confirm  (1030:11352): column gap 20 / pad 20/24 → gap-5 px-6 py-5
//   Insufficient (1030:11386): column gap 12 / pad 24/24 → gap-3 p-6
type SummaryCardProps = {
  rows: [string, string][];
  className?: string;
};

function SummaryCard({ rows, className }: SummaryCardProps) {
  return (
    <div
      className={`flex flex-col rounded-card bg-[rgba(55,58,73,0.05)] ${className ?? ""}`}
    >
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <span className="text-body text-ink">{label}</span>
          <span className="text-body text-ink">{value}</span>
        </div>
      ))}
    </div>
  );
}

// Footer button row, right-aligned with 12px gap (mirrors Figma "Footer buttons").
function FooterRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-center justify-end gap-3">{children}</div>
  );
}

type Props = {
  nftCanisterId: string;
  authorHandle: string;
  onClose: () => void;
};

// Full purchase state machine rendered inside a single Popup chrome.
// Six states matching the six canonical Figma frames (NIC-128 §3.4).
export function NftPurchaseModal({
  nftCanisterId,
  authorHandle,
  onClose,
}: Props) {
  const purchase = useNftPurchase(nftCanisterId);
  const navigate = useNavigate();
  const [terms, setTerms] = useState(false);

  const c = nftPurchaseCopy;

  // --- helpers ---
  const fmtIcp = (e8s: bigint) => formatAmount(e8s, { displayDecimals: 2 });
  const isProcessing = purchase.stage === "processing";

  // Processing: non-dismissable at the Popup chrome level — the framework
  // already blocks ESC/backdrop via dismissable:false at open() time, so
  // this no-op only guards the X icon click inside the Popup chrome itself.
  const handleClose = isProcessing ? () => undefined : onClose;

  const price = purchase.saleInfo?.price ?? 0n;
  const currentSupply = purchase.saleInfo?.currentSupply ?? 0n;
  const maxSupply = purchase.saleInfo?.maxSupply ?? 0n;
  const priceDisplay = fmtIcp(price);

  // Title driven by stage.
  const title =
    purchase.stage === "loading"
      ? ""
      : purchase.stage === "confirm"
        ? c.confirmTitle
        : purchase.stage === "processing"
          ? c.processingTitle
          : purchase.stage === "success"
            ? c.successTitle
            : purchase.stage === "insufficient"
              ? c.insufficientTitle
              : purchase.stage === "error"
                ? purchase.paid
                  ? c.errorPaidTitle
                  : c.errorTitle
                : c.soldOutTitle;

  return (
    <Popup
      titleId={NFT_PURCHASE_MODAL_TITLE_ID}
      title={title}
      onClose={handleClose}
      closeAriaLabel={c.closeAria}
    >
      {/* ── LOADING ── */}
      {purchase.stage === "loading" && (
        <div className="mt-6 flex justify-center">
          <Spinner />
        </div>
      )}

      {/* ── CONFIRM (frame 1030:11352) ── */}
      {purchase.stage === "confirm" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            {/* Intro copy — bold segments match Figma */}
            <p className="text-body text-ink">
              You&rsquo;re about to buy{" "}
              <strong>1 of {String(maxSupply)} NFT keys</strong> to unlock this
              article for <strong>{priceDisplay} ICP</strong>, paid from your
              Nuance wallet. NFT keys are limited and this purchase can&rsquo;t
              be undone.
            </p>

            {/* Confirm card: gap-5 px-6 py-5 (col-gap 20, pad 20/24) */}
            <SummaryCard
              className="gap-5 px-6 py-5"
              rows={[
                [c.confirmYouPay, `${priceDisplay} ICP`],
                [
                  c.confirmKeysRemaining,
                  `${String(currentSupply)} of ${String(maxSupply)}`,
                ],
              ]}
            />

            {/* Terms checkbox (Figma: 600×24, 16px checkbox, 16/18 label) */}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="size-4 accent-[var(--color-brand-purple)]"
              />
              <span className="text-label text-ink">{c.confirmTerms}</span>
            </label>
          </div>

          <FooterRow>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={secondaryButtonSx}
            >
              {c.confirmCancel}
            </Button>
            <Button
              variant="contained"
              disabled={!terms}
              onClick={() => void purchase.confirm()}
              sx={primaryButtonSx}
            >
              {c.confirmPurchase}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── PROCESSING (frame 1030:11369) ── */}
      {purchase.stage === "processing" && (
        <>
          <div className="mt-6 flex flex-col gap-0">
            <p className="text-body text-ink">
              We&rsquo;re processing your payment of{" "}
              <strong>{priceDisplay} ICP</strong> from your Nuance wallet. This
              only takes a moment.
            </p>
            <Spinner />
          </div>

          <FooterRow>
            {/* Cancel shown but disabled while processing (Figma shows it greyed) */}
            <Button
              variant="outlined"
              disabled
              sx={{ ...secondaryButtonSx, opacity: 0.4 }}
            >
              {c.processingCancel}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── SUCCESS (frame 1030:11378) ── */}
      {purchase.stage === "success" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-body text-ink">{c.successBody}</p>
            <div className="flex justify-center">
              <IconPartySuccess className="size-60" />
            </div>
          </div>

          <FooterRow>
            <Button
              variant="contained"
              onClick={onClose}
              sx={primaryButtonSx}
            >
              {c.successReadArticle}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── INSUFFICIENT FUNDS (frame 1030:11386) ── */}
      {purchase.stage === "insufficient" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-body text-ink">
              This NFT key costs <strong>{priceDisplay} ICP</strong>, but your
              wallet balance is{" "}
              <strong>{fmtIcp(purchase.balance ?? 0n)} ICP</strong>. Add funds
              to your Nuance wallet to continue.
            </p>

            {/* Insufficient card: gap-3 p-6 (col-gap 12, pad 24 all sides) */}
            <SummaryCard
              className="gap-3 p-6"
              rows={[
                [c.insufficientNftKey, `${priceDisplay} ICP`],
                [
                  c.insufficientYourBalance,
                  `${fmtIcp(purchase.balance ?? 0n)} ICP`,
                ],
              ]}
            />
          </div>

          <FooterRow>
            <Button variant="outlined" onClick={onClose} sx={secondaryButtonSx}>
              {c.insufficientCancel}
            </Button>
            {/* Fix #2: "Add funds" navigates to /wallet instead of just closing */}
            <Button
              variant="contained"
              onClick={() => {
                onClose();
                navigate("/wallet");
              }}
              sx={primaryButtonSx}
            >
              {c.insufficientAddFunds}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── ERROR (frame 1030:11402)  ── */}
      {/* Two variants: pre-payment (no ICP deducted) vs post-payment (settle failed). */}
      {purchase.stage === "error" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            {purchase.paid ? (
              <p className="text-body text-ink">{c.errorPaidBody}</p>
            ) : (
              <p className="text-body text-ink">
                We couldn&rsquo;t complete your purchase and{" "}
                <strong>no ICP was deducted</strong> from your wallet. Please
                try again.
              </p>
            )}
            {purchase.errorMessage && (
              <p className="text-label text-error">{purchase.errorMessage}</p>
            )}
          </div>

          <FooterRow>
            <Button variant="outlined" onClick={onClose} sx={secondaryButtonSx}>
              {c.errorCancel}
            </Button>
            <Button
              variant="contained"
              onClick={() => void purchase.retry()}
              sx={primaryButtonSx}
            >
              {c.errorTryAgain}
            </Button>
          </FooterRow>
        </>
      )}

      {/* ── SOLD OUT (frame 1030:11411) ── */}
      {purchase.stage === "soldout" && (
        <>
          <div className="mt-6 flex flex-col gap-6">
            <p className="text-body text-ink">{c.soldOutBody}</p>
          </div>

          <FooterRow>
            <Button variant="outlined" onClick={onClose} sx={secondaryButtonSx}>
              {c.soldOutClose}
            </Button>
            {/* Fix #4: label is just "Follow author" (no @handle); navigates to
                author profile so the button isn't a dead end. */}
            <Button
              variant="contained"
              onClick={() => { if (authorHandle) navigate(`/${authorHandle}`); onClose(); }}
              sx={primaryButtonSx}
            >
              {c.soldOutFollowAuthor}
            </Button>
          </FooterRow>
        </>
      )}
    </Popup>
  );
}
