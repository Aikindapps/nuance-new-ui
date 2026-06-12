import { Principal } from "@icp-sdk/core/principal";

// EXT-standard token identifier: a principal-encoded byte string
// "\x0Atid" ‖ canisterPrincipal ‖ tokenIndex(4-byte BE). Every ext_v2 method
// that takes a TokenIdentifier (transfer, metadata, bearer) expects this text
// form. Ported from the production frontend's shared/ext-utils.ts
// (tokenIdentifier), Buffer-free.

const TID_PREFIX = Uint8Array.from([10, ...new TextEncoder().encode("tid")]);

export function extTokenIdentifier(canisterId: string, index: number): string {
  const canister = Principal.fromText(canisterId).toUint8Array();
  const bytes = new Uint8Array(TID_PREFIX.length + canister.length + 4);
  bytes.set(TID_PREFIX, 0);
  bytes.set(canister, TID_PREFIX.length);
  new DataView(bytes.buffer).setUint32(TID_PREFIX.length + canister.length, index);
  return Principal.fromUint8Array(bytes).toText();
}
