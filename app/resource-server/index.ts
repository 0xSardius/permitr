/**
 * Permitr resource server — x402-gated endpoint serving the book chapter.
 *
 * Day 2: single accepts entry (devnet USDC) against the keyless x402.org
 * facilitator. Day 3 adds the ShadyUSD accepts entry (the block/reroute demo)
 * and the CDP facilitator as primary.
 */
import express from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient, type RoutesConfig } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { queryRegistry } from "../../sdk/index";
import { rpc } from "../../scripts/lib";

export const SOLANA_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const;
export const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

// The fictional non-permitted coin, self-minted at seed time. Offering it
// FIRST makes the agent's registry screen genuinely decision-relevant.
const SHADYUSD = readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../data/seed/shadyusd.mint",
  ),
  "utf8",
).trim();

const PAY_TO =
  process.env.PAYTO_ADDRESS ?? "47mxV9vnVUkX8i5V8qDoHgauurV7w5Uc3cjH7Nk4rqBg";
const PORT = Number(process.env.PORT ?? 4021);
const FACILITATOR_URL =
  process.env.FACILITATOR_URL ?? "https://x402.org/facilitator";

const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const server = new x402ResourceServer(facilitator).register(
  SOLANA_DEVNET,
  new ExactSvmScheme(),
);

const routes: RoutesConfig = {
  // ── Permitr as x402 PROVIDER ──────────────────────────────────────────
  // The compliance report itself is machine-payable: any agent pays a
  // micro-fee in USDC and receives {verdict, pathway, citations,
  // registryVersion} — a compliance oracle priced per query, on the same
  // rails it protects. (Two-sided x402: one agent sells compliance data,
  // another buys it to gate its own payments.)
  "GET /verdict": {
    accepts: [
      {
        scheme: "exact",
        network: SOLANA_DEVNET,
        payTo: PAY_TO,
        price: {
          amount: "1000", // 0.001 USDC per verdict query
          asset: USDC_DEVNET,
        },
      },
    ],
    description:
      "Permitr compliance verdict: GENIUS Act issuer-pathway status for an SPL mint, with statutory citations and registry version",
    mimeType: "application/json",
  },
  "GET /chapter": {
    accepts: [
      // ShadyUSD listed FIRST — a naive client (default selector = first
      // option) would pay with the non-permitted coin. Permitr's screen is
      // what stands between the agent and that payment.
      {
        scheme: "exact",
        network: SOLANA_DEVNET,
        payTo: PAY_TO,
        price: {
          amount: "10000", // 0.01 ShadyUSD (6 decimals)
          asset: SHADYUSD,
        },
      },
      {
        scheme: "exact",
        network: SOLANA_DEVNET,
        payTo: PAY_TO,
        price: {
          amount: "10000", // 0.01 USDC (6 decimals)
          asset: USDC_DEVNET,
        },
      },
    ],
    description:
      "Gated chapter: stablecoin qualification pathways under the GENIUS Act",
    mimeType: "text/plain",
  },
};

const app = express();
app.use(paymentMiddleware(routes, server));

app.get("/chapter", (_req, res) => {
  // PLACEHOLDER — replaced by real book-chapter content supplied by the author.
  res.type("text/plain").send(
    [
      "PERMITR GATED RESOURCE — SAMPLE CHAPTER (placeholder)",
      "",
      "[TODO(book): real chapter text goes here — author-supplied.]",
      "",
      "This content was unlocked by an x402 payment screened by the Permitr",
      "registry. Not legal advice.",
    ].join("\n"),
  );
});

app.get("/verdict", async (req, res) => {
  const mint = String(req.query.mint ?? "");
  if (!mint) {
    res.status(400).json({ error: "mint query parameter required" });
    return;
  }
  // fail-closed inside queryRegistry: bad mint / no record / RPC error all
  // resolve to status "Unknown", allowed=false — never a thrown 500.
  const verdict = await queryRegistry(rpc, mint);
  const { raw, ...report } = verdict; // raw account data stays internal
  res.json({
    ...report,
    disclaimer:
      "Machine-readable mirror of public law with citations. Not legal advice; classifications are illustrative as of the registry version shown.",
  });
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, network: SOLANA_DEVNET, facilitator: FACILITATOR_URL });
});

app.listen(PORT, () => {
  console.log(`Permitr resource server on :${PORT}`);
  console.log(`  facilitator: ${FACILITATOR_URL}`);
  console.log(`  payTo:       ${PAY_TO}`);
});
