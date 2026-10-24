/**
 * Day-2 payer: prove one autonomous x402 payment settles E2E on devnet.
 *
 * This is the raw payment rail only — no registry screening yet. Day 3 wires
 * queryRegistry into the paymentRequirementsSelector (the Permitr policy
 * hook) and the Vercel AI SDK agent loop around it.
 */
import "dotenv/config";
import { CdpClient } from "@coinbase/cdp-sdk";
import { cdpKitSigner } from "../../sdk/cdp-signer";
import { Decision } from "../../sdk/attest";
import {
  permitrPay,
  PermitrBlockError,
  PermitrSettlementError,
} from "../../sdk/permitr-pay";
import { loadWallet } from "../../scripts/lib";

const RESOURCE_URL = process.env.RESOURCE_URL ?? "http://localhost:4021/chapter";
const EXAMINER_URL = process.env.EXAMINER_URL ?? "https://permitr.vercel.app";

// Payment signer: CDP server wallet when credentials are present; local
// keypair fallback. Attestations sign as the Permitr service (main wallet).
const attestAuthority = await loadWallet();
const signer = process.env.CDP_API_KEY_ID
  ? cdpKitSigner(
      await new CdpClient().solana.getOrCreateAccount({
        name: "permitr-agent",
      }),
    )
  : attestAuthority;
console.log(`Paying as ${signer.address}`);

try {
  const result = await permitrPay(RESOURCE_URL, signer, attestAuthority);

  console.log("\n--- screenings ---");
  for (const s of result.screenings) {
    console.log(
      `  ${s.verdict.allowed ? "✅ ALLOW" : "⛔ BLOCK"} ${s.mint.slice(0, 8)}… ` +
        `${s.verdict.issuerName ?? "(no record)"} — ${s.verdict.status}` +
        (s.attestation
          ? `\n     audit record: ${EXAMINER_URL}/a/${s.attestation}`
          : ""),
    );
  }
  console.log(
    `\ndecision: ${Decision[result.decision]}  paidWith: ${result.paidWith.slice(0, 8)}…`,
  );
  if (result.txSignature)
    console.log(
      `payment:  https://explorer.solana.com/tx/${result.txSignature}?cluster=devnet`,
    );
  if (result.paymentAttestation)
    console.log(
      `audit record: ${EXAMINER_URL}/a/${result.paymentAttestation.attestation}`,
    );
  else if (result.attestationError) {
    console.error(`\n⚠ payment SETTLED but its attestation failed: ${result.attestationError}`);
    if (result.pendingRecord) console.error(`  pending record: ${result.pendingRecord}`);
    process.exitCode = 1;
  }
  console.log("\n--- body ---");
  console.log(await result.response.text());

  if (result.response.status !== 200 || !result.paymentAttestation) process.exit(1);
  console.log("\n✅ block → reroute → pay → attest complete — Day-3 DoD met.");
} catch (e) {
  if (e instanceof PermitrSettlementError) {
    console.error(`\n⛔ ${e.message}`);
    process.exit(1);
  }
  if (e instanceof PermitrBlockError) {
    console.error(`\n⛔ ${e.message}`);
    console.error("Payment refused (fail-closed). Attested blocks:");
    for (const s of e.screenings)
      if (s.attestation) console.error(`  ${s.mint}: ${s.attestation}`);
    process.exit(1);
  }
  throw e;
}
