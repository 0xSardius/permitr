/**
 * permitrPay — the Permitr product moment in one function.
 *
 * Screen-then-pay: fetch the 402, screen EVERY offered mint against the
 * onchain registry, attest each block, and only pay with a mint whose
 * issuer has a permitted-issuer pathway (fail-closed allowlist). Every
 * evaluated payment leaves an examiner-ready SAS attestation pinning the
 * registry version and citation hash it was judged under.
 *
 * (The x402 selector hook is synchronous, so the async registry screen runs
 * against the initial 402 and the selector then picks the pre-approved
 * offer — the agent visibly inspects before it spends.)
 */
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import {
  decodePaymentRequiredHeader,
  decodePaymentResponseHeader,
} from "@x402/core/http";
import type { PaymentRequirements } from "@x402/core/types";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import type { KeyPairSigner, TransactionSigner } from "@solana/kit";
import { queryRegistry, type Verdict } from "./index";
import { citationHash } from "./citation-hash";
import { Decision, emitPaymentAttestation } from "./attest";
import { rpc } from "../scripts/lib";

const NA_PATHWAY = 255; // no record → no pathway byte; Examiner renders "n/a"
const ZERO_HASH = new Uint8Array(32);

export type Screening = {
  mint: string;
  verdict: Verdict;
  attestation?: string; // SAS address for blocked mints
};

export class PermitrBlockError extends Error {
  constructor(public screenings: Screening[]) {
    super(
      `Permitr blocked payment: no offered mint has a permitted-issuer pathway. ` +
        screenings
          .map((s) => `${s.mint.slice(0, 8)}…=${s.verdict.status}`)
          .join(", "),
    );
    this.name = "PermitrBlockError";
  }
}

export type PermitrPayResult = {
  response: Response;
  screenings: Screening[];
  decision: Decision;
  paidWith: string;
  txSignature: string | null;
  paymentAttestation: { attestation: string; signature: string };
};

function attestationFields(v: Verdict) {
  const raw = v.raw;
  if (!raw)
    return {
      status: 3, // Status::Unknown (client-side only)
      pathway: NA_PATHWAY,
      registryVersion: 0,
      hash: ZERO_HASH,
    };
  return {
    status: raw.status as number,
    pathway: raw.pathway as number,
    registryVersion: raw.registryVersion,
    hash: citationHash(raw),
  };
}

export async function permitrPay(
  url: string,
  signer: TransactionSigner,
  attestAuthority: KeyPairSigner,
): Promise<PermitrPayResult> {
  const now = () => Math.floor(Date.now() / 1000);

  // 1. fetch the offer
  const offer = await fetch(url);
  if (offer.status !== 402)
    return {
      response: offer,
      screenings: [],
      decision: Decision.Allowed,
      paidWith: "none",
      txSignature: null,
      paymentAttestation: { attestation: "", signature: "" },
    };
  const header = offer.headers.get("payment-required");
  if (!header) throw new Error("402 without PAYMENT-REQUIRED header");
  const required = decodePaymentRequiredHeader(header);
  const accepts = required.accepts as PaymentRequirements[];

  // 2. screen every offered mint (fail-closed: queryRegistry never throws)
  const screenings: Screening[] = [];
  for (const req of accepts) {
    const mint = req.asset;
    if (screenings.some((s) => s.mint === mint)) continue;
    const verdict = await queryRegistry(rpc, mint);
    screenings.push({ mint, verdict });
  }

  // 3. attest every block — blocks are the audit record that matters most
  for (const s of screenings) {
    if (s.verdict.allowed) continue;
    const f = attestationFields(s.verdict);
    const { attestation } = await emitPaymentAttestation(attestAuthority, {
      paymentRef: `screen-${now()}-${s.mint.slice(0, 8)}`,
      mint: s.mint,
      status: f.status,
      pathway: f.pathway,
      decision: Decision.Blocked,
      registryVersion: f.registryVersion,
      citationHash: f.hash,
      timestamp: now(),
    });
    s.attestation = attestation;
  }

  // 4. fail closed if nothing qualifies
  const approved = screenings.find((s) => s.verdict.allowed);
  if (!approved) throw new PermitrBlockError(screenings);

  // 5. pay with the approved mint only. NOTE: the selector must be passed to
  // the x402Client CONSTRUCTOR — registerExactSvmScheme's config accepts a
  // paymentRequirementsSelector field but silently drops it (verified against
  // @x402/svm 2.18.0 source), and the default selector pays accepts[0]:
  // exactly the naive-client failure mode Permitr exists to prevent.
  const client = new x402Client((_v, reqs) => {
    const match = reqs.find((r) => r.asset === approved.mint);
    if (!match) throw new PermitrBlockError(screenings);
    return match;
  });
  registerExactSvmScheme(client, { signer });
  const fetchWithPay = wrapFetchWithPayment(fetch, client);
  let response = await fetchWithPay(url);
  if (response.status === 402) {
    // The x402.org devnet facilitator intermittently fails simulation under
    // load; one paced retry makes the demo path reliable.
    await new Promise((r) => setTimeout(r, 2_500));
    response = await fetchWithPay(url);
  }

  const responseHeader = response.headers.get("payment-response");
  const settle = responseHeader
    ? decodePaymentResponseHeader(responseHeader)
    : null;
  const txSignature = settle?.transaction ?? null;

  // 6. attest the payment; Rerouted if a higher-listed offer was blocked
  const firstOffered = accepts[0]?.asset;
  const decision =
    firstOffered === approved.mint ? Decision.Allowed : Decision.Rerouted;
  const f = attestationFields(approved.verdict);
  const paymentAttestation = await emitPaymentAttestation(attestAuthority, {
    paymentRef: txSignature ?? `unsettled-${now()}`,
    mint: approved.mint,
    status: f.status,
    pathway: f.pathway,
    decision,
    registryVersion: f.registryVersion,
    citationHash: f.hash,
    timestamp: now(),
  });

  return {
    response,
    screenings,
    decision,
    paidWith: approved.mint,
    txSignature,
    paymentAttestation,
  };
}
