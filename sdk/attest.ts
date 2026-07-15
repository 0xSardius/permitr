/**
 * Permitr attestation service — emits one SAS attestation per evaluated
 * payment (blocks included; blocks are the more interesting audit record).
 *
 * Design decision (Day 3): attestations are signed by the PERMITR service
 * authority under the Permitr credential — the compliance service attests to
 * what it witnessed. Agent-self-attestation (agent as authorized signer) is
 * roadmap, alongside the paid verdict endpoint.
 */
import { generateKeyPairSigner, type Instruction, type KeyPairSigner } from "@solana/kit";
import {
  deriveAttestationPda,
  fetchSchema,
  getCreateAttestationInstruction,
  serializeAttestationData,
} from "sas-lib";
import { rpc, sendIxs } from "../scripts/lib.js";

export const PERMITR_CREDENTIAL =
  "91qxSAdW6T3BshWVvP6o68hoLDrFfnFoeRNT68qP6ex8";
export const PERMITR_PAYMENT_SCHEMA =
  "8fi4naNQJYMQ7uWpvBGMWbrvuvyf6vgp7eLvbTHTJb2Y";

export enum Decision {
  Allowed = 0,
  Blocked = 1,
  Rerouted = 2,
}

export type PaymentAttestation = {
  paymentRef: string; // x402 tx signature, or a screen id for blocks
  mint: string;
  status: number; // on-chain Status enum index
  pathway: number; // on-chain Pathway enum index
  decision: Decision;
  registryVersion: number;
  citationHash: Uint8Array; // 32 bytes (sdk/citation-hash.ts)
  timestamp: number; // unix seconds
};

const sasRpc = rpc as unknown as Parameters<typeof fetchSchema>[0];
let schemaCache: Awaited<ReturnType<typeof fetchSchema>> | undefined;

export async function emitPaymentAttestation(
  authority: KeyPairSigner,
  a: PaymentAttestation,
): Promise<{ attestation: string; signature: string }> {
  schemaCache ??= await fetchSchema(
    sasRpc,
    PERMITR_PAYMENT_SCHEMA as Parameters<typeof deriveAttestationPda>[0]["schema"],
  );

  const data = serializeAttestationData(schemaCache.data, {
    payment_ref: a.paymentRef,
    mint: a.mint,
    status: a.status,
    pathway: a.pathway,
    decision: a.decision,
    registry_version: a.registryVersion,
    citation_hash: Array.from(a.citationHash),
    timestamp: a.timestamp,
  });

  const nonce = (await generateKeyPairSigner()).address;
  const credential = PERMITR_CREDENTIAL as Parameters<
    typeof deriveAttestationPda
  >[0]["credential"];
  const schema = PERMITR_PAYMENT_SCHEMA as Parameters<
    typeof deriveAttestationPda
  >[0]["schema"];
  const [attestationPda] = await deriveAttestationPda({
    credential,
    schema,
    nonce,
  });

  const ix = getCreateAttestationInstruction({
    payer: authority,
    authority,
    credential,
    schema,
    attestation: attestationPda,
    nonce,
    data: Buffer.from(data),
    expiry: BigInt(a.timestamp + 5 * 365 * 24 * 3600),
  });
  const signature = await sendIxs(authority, [ix as unknown as Instruction]);
  return { attestation: attestationPda, signature };
}
