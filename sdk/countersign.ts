/**
 * Regulator countersignatures — the government-pilot layer.
 *
 * A regulator holds its own SAS credential and countersigns registry records
 * by attesting under the permitr-issuer-certification schema with the MINT
 * ADDRESS AS THE ATTESTATION NONCE. That makes countersignatures
 * deterministically discoverable — derive the PDA from (credential, schema,
 * mint) and fetch — with no registry program changes and no indexer.
 *
 * DEMO HONESTY RULE: no real government credential exists yet. The demo
 * regulator is created by us and labeled "(SIMULATED)" in its onchain name
 * and everywhere it renders. The FACTS it attests cite real agency actions;
 * the SIGNER is illustrative. Roadmap: the real agency holds its own keys.
 */
import { address, type Address } from "@solana/kit";
import {
  deriveAttestationPda,
  deserializeAttestationData,
  fetchMaybeAttestation,
  fetchSchema,
} from "sas-lib";
import { rpc } from "../scripts/lib";

import regulators from "../data/regulators.json";

/** Known regulator credentials (written by scripts/regulator-attest.ts). */
export const KNOWN_REGULATORS = regulators as {
  name: string;
  credential: string;
  schema: string;
}[];

export type Countersignature = {
  regulator: string;
  simulated: boolean;
  attestation: string;
  action: string;
  reference: string;
  summary: string;
  timestamp: number;
};

type CertData = {
  mint: string;
  issuer: string;
  action: string;
  reference: string;
  summary: string;
  timestamp: bigint;
};

const sasRpc = rpc as unknown as Parameters<typeof fetchSchema>[0];
const schemaCache = new Map<
  string,
  Awaited<ReturnType<typeof fetchSchema>>
>();

/**
 * Fetch all regulator countersignatures for a mint. Fail-open on errors is
 * fine here: countersignatures are supplementary evidence, never the basis
 * of an allow decision (the fail-closed allowlist is unchanged).
 */
export async function getCountersignatures(
  mint: string,
): Promise<Countersignature[]> {
  const out: Countersignature[] = [];
  for (const reg of KNOWN_REGULATORS) {
    if (!reg.credential || !reg.schema) continue;
    try {
      const [pda] = await deriveAttestationPda({
        credential: address(reg.credential) as Parameters<
          typeof deriveAttestationPda
        >[0]["credential"],
        schema: address(reg.schema) as Parameters<
          typeof deriveAttestationPda
        >[0]["schema"],
        nonce: address(mint) as Address,
      });
      const maybe = await fetchMaybeAttestation(sasRpc, pda);
      if (!maybe.exists) continue;
      let schema = schemaCache.get(reg.schema);
      if (!schema) {
        schema = await fetchSchema(
          sasRpc,
          maybe.data.schema as Parameters<typeof fetchSchema>[1],
        );
        schemaCache.set(reg.schema, schema);
      }
      const d = deserializeAttestationData<CertData>(
        schema.data,
        maybe.data.data as Uint8Array,
      );
      out.push({
        regulator: reg.name,
        simulated: /simulated/i.test(reg.name),
        attestation: pda,
        action: d.action,
        reference: d.reference,
        summary: d.summary,
        timestamp: Number(d.timestamp),
      });
    } catch {
      // supplementary evidence only — skip on any failure
    }
  }
  return out;
}
