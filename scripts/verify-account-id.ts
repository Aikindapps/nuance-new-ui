/* eslint-disable */
// Verifies src/lib/accountIdentifier.ts before any real ICP relies on it.
// Run via: npx tsx scripts/verify-account-id.ts
//
// Three independent checks:
//  1. CRC32 against the standard check value (0xCBF43926 for "123456789").
//  2. Our noble-based account-id matches an INDEPENDENT node:crypto sha224
//     reimplementation for several principals (no shared hash code).
//  3. Live ICP-ledger anchor: account_balance(accountId(P)) === icrc1_balance_of(P)
//     for a principal with non-zero ICP — proves the preimage structure is right.
import { createHash } from "node:crypto";
import { HttpAgent, Actor } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { Principal } from "@icp-sdk/core/principal";
import { principalToAccountIdentifier } from "../src/lib/accountIdentifier";
import { createActor as createIcrc1 } from "../src/candid/Icrc1/Icrc1";

const ICP_LEDGER = "ryjl3-tyaaa-aaaaa-aaaba-cai";

// --- check 1: CRC32 standard vector ---
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const crcCheck = crc32(new TextEncoder().encode("123456789"));
console.log(
  `1) CRC32("123456789") = 0x${crcCheck.toString(16)} — ${crcCheck === 0xcbf43926 ? "PASS" : "FAIL"}`,
);

// --- check 2: independent node:crypto sha224 reimplementation ---
function accountIdNodeCrypto(principalText: string): string {
  const principal = Principal.fromText(principalText).toUint8Array();
  const sep = Uint8Array.from([10, ...new TextEncoder().encode("account-id")]);
  const inner = Buffer.concat([sep, principal, new Uint8Array(32)]);
  const hash = createHash("sha224").update(inner).digest();
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(hash));
  return Buffer.concat([crcBuf, hash]).toString("hex");
}
const samples = [
  "ryjl3-tyaaa-aaaaa-aaaba-cai",
  "rrkah-fqaaa-aaaaa-aaaaq-cai",
  "2vxsx-fae",
  "rtqeo-eyaaa-aaaaf-qaana-cai",
];
let allMatch = true;
for (const p of samples) {
  const a = principalToAccountIdentifier(p);
  const b = accountIdNodeCrypto(p);
  const selfCrc =
    crc32(Uint8Array.from(Buffer.from(a.slice(8), "hex"))) ===
    parseInt(a.slice(0, 8), 16);
  const ok = a === b && selfCrc;
  if (!ok) allMatch = false;
  console.log(`2) ${p}\n     ours=${a}\n     node=${b}  match=${a === b}  crc-self=${selfCrc}`);
}
console.log(`2) independent SHA + CRC self-consistency — ${allMatch ? "PASS" : "FAIL"}`);

// --- check 3: live ICP-ledger anchor ---
const agent = await HttpAgent.create({ host: "https://icp-api.io" });
const icp = createIcrc1(ICP_LEDGER, { agent });
const ledgerLegacy = Actor.createActor(
  ({ IDL }: { IDL: typeof import("@icp-sdk/core/candid").IDL }) =>
    IDL.Service({
      account_balance: IDL.Func(
        [IDL.Record({ account: IDL.Vec(IDL.Nat8) })],
        [IDL.Record({ e8s: IDL.Nat64 })],
        ["query"],
      ),
    }),
  { agent, canisterId: ICP_LEDGER },
) as any;

const candidates = [
  "rkp4c-7iaaa-aaaaa-aaaca-cai",
  "rrkah-fqaaa-aaaaa-aaaaq-cai",
  "qoctq-giaaa-aaaaa-aaaea-cai",
  "rdmx6-jaaaa-aaaaa-aaadq-cai",
  "ryjl3-tyaaa-aaaaa-aaaba-cai",
  "tbjp3-7iaaa-aaaaa-aaaaa-cai",
  "renrk-eyaaa-aaaaa-aaada-cai",
];
let anchored = false;
for (const p of candidates) {
  const bal = await icp.icrc1_balance_of({ owner: Principal.fromText(p) });
  if (bal > 0n) {
    const accHex = principalToAccountIdentifier(p);
    const accBytes = Array.from(Buffer.from(accHex, "hex"));
    const legacy = await ledgerLegacy.account_balance({ account: accBytes });
    const match = BigInt(legacy.e8s) === bal;
    console.log(
      `3) ${p}\n     icrc1_balance_of = ${bal}\n     account_balance(accountId) = ${legacy.e8s}  — ${match ? "PASS" : "FAIL"}`,
    );
    anchored = true;
    break;
  }
}
if (!anchored)
  console.log("3) no funded candidate found — relying on checks 1+2 (still strong)");
