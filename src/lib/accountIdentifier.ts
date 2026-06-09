import { sha224 } from "@noble/hashes/sha2";
import { Principal } from "@icp-sdk/core/principal";

// ICP legacy account identifier derivation (PR-1 deposit). The ICP ledger's
// non-ICRC interface addresses funds by a 32-byte account identifier (64 hex),
// which is what exchanges and the NNS dapp expect. ICRC-1 transfers to the
// principal land in the SAME account, so for ICRC-1 senders the principal works
// too — this is for the legacy form.
//
//   accountId = CRC32(hash) ‖ hash
//   hash      = SHA-224( "\x0Aaccount-id" ‖ principal ‖ subaccount[32] )
//
// Verified: CRC32 against the standard check value (0xCBF43926) and a live
// cross-check on the ICP ledger (icrc1_balance_of(principal) ===
// account_balance(accountId(principal))) — see scripts/verify-account-id.ts.

// CRC32 (IEEE 802.3), returned as 4 big-endian bytes.
function crc32(bytes: Uint8Array): Uint8Array {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  return new Uint8Array([
    (crc >>> 24) & 0xff,
    (crc >>> 16) & 0xff,
    (crc >>> 8) & 0xff,
    crc & 0xff,
  ]);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// "\x0Aaccount-id" — the 0x0A length byte followed by the ASCII label.
const DOMAIN_SEPARATOR = Uint8Array.from([
  10,
  ...new TextEncoder().encode("account-id"),
]);

export function principalToAccountIdentifier(
  principalText: string,
  subaccount?: Uint8Array,
): string {
  const principal = Principal.fromText(principalText).toUint8Array();
  const sub = subaccount ?? new Uint8Array(32);

  const inner = new Uint8Array(
    DOMAIN_SEPARATOR.length + principal.length + sub.length,
  );
  inner.set(DOMAIN_SEPARATOR, 0);
  inner.set(principal, DOMAIN_SEPARATOR.length);
  inner.set(sub, DOMAIN_SEPARATOR.length + principal.length);

  const hash = sha224(inner);
  const checksum = crc32(hash);

  const full = new Uint8Array(checksum.length + hash.length);
  full.set(checksum, 0);
  full.set(hash, checksum.length);
  return toHex(full);
}
