// Map a ledger TransferError variant to a readable message. Covers both the
// ICRC-1 family (InsufficientFunds/TooOld/CreatedInFuture/Duplicate) and the
// legacy ICP ledger family (Tx-prefixed variants) so the tip and withdraw
// flows share one translator. Extracted from useTipAuthor in PR #14.
export function transferErrText(err: unknown): string {
  const e = err as { __kind__?: string; GenericError?: { message?: string } };
  switch (e?.__kind__) {
    case "InsufficientFunds":
      return "Insufficient balance for this transfer.";
    case "BadFee":
      return "Ledger fee mismatch. Try again.";
    case "TooOld":
    case "TxTooOld":
    case "CreatedInFuture":
    case "TxCreatedInFuture":
      return "Transfer timing error. Try again.";
    case "TemporarilyUnavailable":
      return "The ledger is temporarily unavailable. Try again.";
    case "Duplicate":
    case "TxDuplicate":
      return "This transfer was already submitted.";
    case "GenericError":
      return e.GenericError?.message ?? "Transfer failed.";
    default:
      return "Transfer failed.";
  }
}
