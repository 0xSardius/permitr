/**
 * Permitr Agent — a Vercel AI SDK agent that procures x402-gated resources
 * with GENIUS Act compliance screening on every payment.
 *
 * The agent's tools:
 *  - screenMint: query the Permitr registry for any mint (verdict + citations)
 *  - buyResource: permitrPay — screen every offered mint, block non-qualified
 *    (SAS-attested), pay only with a pathway-qualified stablecoin, attest.
 *
 * The LLM narrates and orchestrates; the COMPLIANCE DECISIONS are enforced in
 * code (fail-closed allowlist in the SDK), never delegated to the model.
 */
import "dotenv/config";
import { generateText, tool, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { CdpClient } from "@coinbase/cdp-sdk";
import { cdpKitSigner } from "../../sdk/cdp-signer";
import { queryRegistry } from "../../sdk/index";
import { Decision } from "../../sdk/attest";
import { permitrPay, PermitrBlockError } from "../../sdk/permitr-pay";
import { loadWallet, rpc } from "../../scripts/lib";

const RESOURCE_URL =
  process.env.RESOURCE_URL ?? "http://localhost:4021/chapter";

const attestAuthority = await loadWallet();
const signer = process.env.CDP_API_KEY_ID
  ? cdpKitSigner(
      await new CdpClient().solana.getOrCreateAccount({
        name: "permitr-agent",
      }),
    )
  : attestAuthority;

const screenMint = tool({
  description:
    "Screen an SPL mint against the Permitr GENIUS Act registry. Returns the verdict (pathway, status, allowed) with statutory citations.",
  inputSchema: z.object({
    mint: z.string().describe("base58 SPL mint address"),
  }),
  execute: async ({ mint }) => queryRegistry(rpc, mint),
});

const buyResource = tool({
  description:
    "Purchase an x402-gated resource. Screens every offered payment asset against the Permitr registry, blocks non-qualified assets (with onchain SAS attestations), pays only with a pathway-qualified stablecoin, and attests the payment. Fails closed.",
  inputSchema: z.object({
    url: z.string().describe("URL of the gated resource"),
  }),
  execute: async ({ url }) => {
    try {
      const r = await permitrPay(url, signer, attestAuthority);
      return {
        outcome: Decision[r.decision],
        paidWith: r.paidWith,
        txSignature: r.txSignature,
        screenings: r.screenings.map((s) => ({
          mint: s.mint,
          issuer: s.verdict.issuerName,
          status: s.verdict.status,
          allowed: s.verdict.allowed,
          citations: s.verdict.citations.filter((c) => c.field === "status"),
          blockAttestation: s.attestation ?? null,
        })),
        paymentAttestation: r.paymentAttestation.attestation,
        content: await r.response.text(),
      };
    } catch (e) {
      if (e instanceof PermitrBlockError)
        return {
          outcome: "Blocked",
          reason: e.message,
          screenings: e.screenings.map((s) => ({
            mint: s.mint,
            status: s.verdict.status,
            citations: s.verdict.citations,
            blockAttestation: s.attestation ?? null,
          })),
        };
      throw e;
    }
  },
});

const { text } = await generateText({
  model: anthropic("claude-sonnet-5"),
  stopWhen: stepCountIs(6),
  tools: { screenMint, buyResource },
  system: [
    "You are the Permitr Agent: an autonomous procurement agent that only",
    "transacts in stablecoins whose issuers have a permitted-issuer pathway",
    "under the GENIUS Act (PL 119-27). Compliance is enforced in your tools —",
    "your job is to procure what the user asks for and then report exactly",
    "what happened: which assets were offered, which were blocked and why",
    "(cite the statute references returned by your tools verbatim — never",
    "invent citations), what you paid with, and the onchain attestation",
    "addresses that make the decision auditable. Plain English, precise,",
    "audit-ready. Note that classifications are illustrative, not legal advice.",
  ].join(" "),
  prompt: `Purchase the gated resource at ${RESOURCE_URL} and report the compliance outcome.`,
});

console.log(text);
