/**
 * Day-2 payer: prove one autonomous x402 payment settles E2E on devnet.
 *
 * This is the raw payment rail only — no registry screening yet. Day 3 wires
 * queryRegistry into the paymentRequirementsSelector (the Permitr policy
 * hook) and the Vercel AI SDK agent loop around it.
 */
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { loadWallet } from "../../scripts/lib.js";

const RESOURCE_URL = process.env.RESOURCE_URL ?? "http://localhost:4021/chapter";

const signer = await loadWallet();
console.log(`Paying as ${signer.address}`);

const client = new x402Client();
registerExactSvmScheme(client, { signer });
const fetchWithPay = wrapFetchWithPayment(fetch, client);

const res = await fetchWithPay(RESOURCE_URL);
console.log(`HTTP ${res.status}`);
const paymentResponse = res.headers.get("x-payment-response");
if (paymentResponse) {
  const decoded = JSON.parse(
    Buffer.from(paymentResponse, "base64").toString("utf8"),
  );
  console.log("Settlement:", decoded);
  if (decoded.transaction)
    console.log(
      `explorer: https://explorer.solana.com/tx/${decoded.transaction}?cluster=devnet`,
    );
}
const body = await res.text();
console.log("--- body ---");
console.log(body);

if (res.status !== 200) process.exit(1);
console.log("\n✅ x402 payment settled E2E on devnet — Day-2 DoD met.");
