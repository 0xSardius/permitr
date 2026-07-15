/**
 * Emit sample screening attestations to complete the Examiner View's
 * taxonomy of gradations. Each is a GENUINE screen: a real registry read
 * with the real citation hash — attesting the screening event itself
 * (payment_ref marks these as standalone screens, not x402 payments).
 *
 * - USDG  -> ExceptionConditionsUnmet (the §18 nuance beat)
 * - wSOL  -> Unknown, fail-closed (no registry record; zero hash)
 */
import "dotenv/config";
import { queryRegistry } from "../sdk/index";
import { citationHash } from "../sdk/citation-hash";
import { Decision, emitPaymentAttestation } from "../sdk/attest";
import { loadWallet, rpc } from "./lib";

const EXAMINER = "https://permitr.vercel.app";
const now = () => Math.floor(Date.now() / 1000);

const authority = await loadWallet();

const TARGETS = [
  { name: "USDG", mint: "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH" },
  { name: "wSOL (unregistered)", mint: "So11111111111111111111111111111111111111112" },
];

for (const t of TARGETS) {
  const v = await queryRegistry(rpc, t.mint);
  if (v.allowed) throw new Error(`${t.name} unexpectedly allowed — aborting`);
  const raw = v.raw;
  const { attestation } = await emitPaymentAttestation(authority, {
    paymentRef: `screen-${now()}-${t.mint.slice(0, 8)}`,
    mint: t.mint,
    status: raw ? (raw.status as number) : 3, // Status::Unknown
    pathway: raw ? (raw.pathway as number) : 255, // n/a
    decision: Decision.Blocked,
    registryVersion: v.registryVersion,
    citationHash: raw ? citationHash(raw) : new Uint8Array(32),
    timestamp: now(),
  });
  console.log(`${t.name}: ${v.status}`);
  console.log(`  ${EXAMINER}/a/${attestation}`);
}
