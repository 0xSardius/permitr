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
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { queryRegistry, type Verdict } from "./index";
import { citationHash } from "./citation-hash";
import { Decision, emitPaymentAttestation } from "./attest";
import { rpc } from "./rpc";

/** Devnet only (CLAUDE.md hard rule 3): offers on any other network are never
 * screened as payable and never signed. */
export const SOLANA_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
/** Default per-payment cap in token base units (0.1 of a 6-decimal stablecoin). */
export const DEFAULT_MAX_AMOUNT = 100_000n;
/** Ceiling for each HTTP leg (the 402 offer, the paid request). */
export const HTTP_TIMEOUT_MS = 30_000;
/** Where a settled-but-unattested payment is recorded for later re-attestation. */
export const PENDING_DIR = path.join(process.cwd(), ".permitr", "pending");

const NA_PATHWAY = 255; // no record → no pathway byte; Examiner renders "n/a"
const ZERO_HASH = new Uint8Array(32);

export type Screening = {
  mint: string;
  verdict: Verdict;
  attestation?: string; // SAS address for blocked mints
};

export class PermitrBlockError extends Error {
  constructor(
    public screenings: Screening[],
    reason = "no offered mint has a permitted-issuer pathway",
  ) {
    super(
      `Permitr blocked payment: ${reason}. ` +
        screenings
          .map((s) => `${s.mint.slice(0, 8)}…=${s.verdict.status}`)
          .join(", "),
    );
    this.name = "PermitrBlockError";
  }
}

/** The payment was attempted but did not verifiably settle. No Allowed or
 * Rerouted attestation is written for it — only settled payments are
 * attested as paid (blocks screened beforehand stay attested). */
export class PermitrSettlementError extends Error {
  constructor(
    public screenings: Screening[],
    public httpStatus: number,
    public txSignature: string | null,
  ) {
    super(
      `payment did not settle (HTTP ${httpStatus}${txSignature ? `, tx ${txSignature}` : ", no settlement tx"}); no payment attestation written`,
    );
    this.name = "PermitrSettlementError";
  }
}

export type PermitrPayResult = {
  response: Response;
  screenings: Screening[];
  decision: Decision;
  paidWith: string;
  txSignature: string | null;
  /** null when no payment was made, or when attesting a settled payment
   * failed — see attestationError / pendingRecord. */
  paymentAttestation: { attestation: string; signature: string } | null;
  /** Set when the payment SETTLED but its attestation could not be written.
   * The money moved; the audit record is owed. */
  attestationError?: string;
  /** Path of the on-disk record holding everything needed to re-attest. */
  pendingRecord?: string;
};

function writePending(record: object): string | undefined {
  try {
    mkdirSync(PENDING_DIR, { recursive: true });
    const file = path.join(PENDING_DIR, `${Date.now()}.json`);
    writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
    return file;
  } catch {
    return undefined; // read-only fs: the error is still returned to the caller
  }
}

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

/** The selector must pay exactly the offer that was screened and capped — a
 * re-issued 402 with a different amount, payee or network is refused. */
function sameOffer(a: PaymentRequirements, b: PaymentRequirements): boolean {
  return (
    a.scheme === b.scheme &&
    a.network === b.network &&
    a.asset === b.asset &&
    a.amount === b.amount &&
    a.payTo === b.payTo
  );
}

function amountWithinCap(amount: string, max: bigint): boolean {
  try {
    return BigInt(amount) <= max;
  } catch {
    return false; // unparseable amount: fail closed
  }
}

export async function permitrPay(
  url: string,
  signer: TransactionSigner,
  attestAuthority: KeyPairSigner,
  opts: { maxAmount?: bigint } = {},
): Promise<PermitrPayResult> {
  const maxAmount = opts.maxAmount ?? DEFAULT_MAX_AMOUNT;
  const now = () => Math.floor(Date.now() / 1000);

  // 1. fetch the offer
  const offer = await fetch(url, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
  if (offer.status !== 402)
    return {
      response: offer,
      screenings: [],
      decision: Decision.Allowed,
      paidWith: "none",
      txSignature: null,
      paymentAttestation: null, // nothing was paid, nothing to attest
    };
  const header = offer.headers.get("payment-required");
  if (!header) throw new Error("402 without PAYMENT-REQUIRED header");
  const required = decodePaymentRequiredHeader(header);
  // only x402 v2 "exact" offers on devnet are candidates; everything else is
  // dropped before screening and can never be selected or signed
  const accepts =
    required.x402Version === 2
      ? (required.accepts as PaymentRequirements[]).filter(
          (r) => r.network === SOLANA_DEVNET && r.scheme === "exact",
        )
      : [];
  if (accepts.length === 0)
    throw new PermitrBlockError([], "no x402 v2 exact offer on Solana devnet");

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

  // 4. fail closed if nothing qualifies (or nothing qualifying is within cap)
  const approved = screenings.find((s) => s.verdict.allowed);
  if (!approved) throw new PermitrBlockError(screenings);
  const approvedOffer = accepts.find(
    (r) => r.asset === approved.mint && amountWithinCap(r.amount, maxAmount),
  );
  if (!approvedOffer)
    throw new PermitrBlockError(
      screenings,
      `qualified offer exceeds the ${maxAmount} base-unit payment cap`,
    );

  // 5. pay with the approved mint only. NOTE: the selector must be passed to
  // the x402Client CONSTRUCTOR — registerExactSvmScheme's config accepts a
  // paymentRequirementsSelector field but silently drops it (verified against
  // @x402/svm 2.18.0 source), and the default selector pays accepts[0]:
  // exactly the naive-client failure mode Permitr exists to prevent.
  // The selector re-checks the protocol version too: registerExactSvmScheme
  // always registers the V1 networks (incl. mainnet) whatever `networks` says.
  const client = new x402Client((version, reqs) => {
    const match =
      version === 2 ? reqs.find((r) => sameOffer(r, approvedOffer)) : undefined;
    if (!match)
      throw new PermitrBlockError(
        screenings,
        "payment requirements changed after screening",
      );
    return match;
  });
  registerExactSvmScheme(client, { signer, networks: [SOLANA_DEVNET] });
  const fetchWithPay = wrapFetchWithPayment(fetch, client);
  const paidFetch = () =>
    fetchWithPay(url, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
  let response = await paidFetch();
  if (response.status === 402) {
    // The x402.org devnet facilitator intermittently fails simulation under
    // load; one paced retry makes the demo path reliable.
    await new Promise((r) => setTimeout(r, 2_500));
    response = await paidFetch();
  }

  const responseHeader = response.headers.get("payment-response");
  let settle: ReturnType<typeof decodePaymentResponseHeader> | null = null;
  try {
    settle = responseHeader ? decodePaymentResponseHeader(responseHeader) : null;
  } catch {
    settle = null; // undecodable settlement header: treated as unsettled
  }
  const txSignature = settle?.transaction || null;
  // only a 2xx with a successful settlement carrying a tx signature counts as
  // paid; anything else is never attested as Allowed/Rerouted
  if (!response.ok || !settle?.success || !txSignature)
    throw new PermitrSettlementError(screenings, response.status, txSignature);

  // 6. attest the payment; Rerouted if a higher-listed offer was blocked
  const firstOffered = accepts[0]?.asset;
  const decision =
    firstOffered === approved.mint ? Decision.Allowed : Decision.Rerouted;
  const f = attestationFields(approved.verdict);
  const attestation = {
    paymentRef: txSignature,
    mint: approved.mint,
    status: f.status,
    pathway: f.pathway,
    decision,
    registryVersion: f.registryVersion,
    citationHash: f.hash,
    timestamp: now(),
  };
  const result = {
    response,
    screenings,
    decision,
    paidWith: approved.mint,
    txSignature,
  };
  try {
    const paymentAttestation = await emitPaymentAttestation(attestAuthority, attestation);
    return { ...result, paymentAttestation };
  } catch (e) {
    // the payment settled: surface the tx and keep the owed record, never
    // throw away proof that money moved
    const attestationError = e instanceof Error ? e.message : String(e);
    const pendingRecord = writePending({
      ...attestation,
      citationHash: Buffer.from(attestation.citationHash).toString("hex"),
      attestationError,
    });
    return { ...result, paymentAttestation: null, attestationError, pendingRecord };
  }
}
