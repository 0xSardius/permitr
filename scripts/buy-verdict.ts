/**
 * Two-sided x402 demo: an agent PAYS Permitr for a compliance verdict —
 * and the payment for the compliance data is itself compliance-screened.
 * Usage: pnpm buy-verdict [mint]   (defaults to PYUSD devnet)
 */
import "dotenv/config";
import { CdpClient } from "@coinbase/cdp-sdk";
import { cdpKitSigner } from "../sdk/cdp-signer.js";
import { permitrPay } from "../sdk/permitr-pay.js";
import { loadWallet } from "./lib.js";

const mint = process.argv[2] ?? "CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM";
const base = process.env.RESOURCE_URL_BASE ?? "http://localhost:4021";

const wallet = await loadWallet();
// Buyer = the CDP agent wallet (paying yourself is rejected in settlement);
// attestations sign as the Permitr service.
const signer = process.env.CDP_API_KEY_ID
  ? cdpKitSigner(
      await new CdpClient().solana.getOrCreateAccount({
        name: "permitr-agent",
      }),
    )
  : wallet;
const result = await permitrPay(`${base}/verdict?mint=${mint}`, signer, wallet);

console.log(`paid ${result.paidWith.slice(0, 8)}… for the verdict (tx ${result.txSignature?.slice(0, 16)}…)`);
console.log(`payment attested: ${result.paymentAttestation.attestation}`);
console.log("\n--- purchased compliance report ---");
console.log(JSON.stringify(JSON.parse(await result.response.text()), null, 2));
