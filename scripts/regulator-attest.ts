/**
 * Create the SIMULATED regulator credential + certification schema, and
 * countersign USDC and PYUSD with attestations citing REAL OCC actions.
 * (Signer simulated and labeled as such; facts real and source-verified.)
 *
 * Nonce = the mint address -> countersignatures are deterministically
 * discoverable from (credential, schema, mint). Idempotent.
 *
 * An existing countersignature whose onchain text differs from CERTS is
 * reported as drift. `--reissue` closes it and re-creates it with the
 * current text (same PDA: the mint is still the nonce).
 */
import { type Instruction } from "@solana/kit";
import { address } from "@solana/kit";
import {
  deriveAttestationPda,
  deserializeAttestationData,
  getCloseAttestationInstruction,
  deriveCredentialPda,
  deriveSchemaPda,
  fetchMaybeAttestation,
  fetchMaybeCredential,
  fetchMaybeSchema,
  fetchSchema,
  getCreateAttestationInstruction,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  serializeAttestationData,
} from "sas-lib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWallet, rpc, sendIxs } from "./lib";

const CREDENTIAL_NAME = "OCC (SIMULATED)";
const SCHEMA_NAME = "permitr-issuer-cert";
// layout: 12=String ×5, 8=i64
const LAYOUT = Buffer.from([12, 12, 12, 12, 12, 8]);
const FIELD_NAMES = ["mint", "issuer", "action", "reference", "summary", "timestamp"];

const CERTS = [
  {
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    issuer: "Circle (Circle New York Trust, anticipated issuer)",
    action: "NationalTrustCharterApproved",
    reference: "OCC final approval, First National Digital Currency Bank, N.A. (Circle), Jul 10, 2026",
    summary:
      "SIMULATED countersignature citing a real agency action: final approval of Circle's national trust bank, Jul 10, 2026 (per Circle). Per OCC CA 1356 the bank will not issue stablecoins.",
  },
  {
    mint: "CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM",
    issuer: "Paxos Trust Company (OCC national trust)",
    action: "CharterConversionConditionallyApproved",
    reference: "OCC Cond. Approval No. 1358, Paxos Trust Co. conversion to national trust (Dec 12, 2025)",
    summary:
      "SIMULATED countersignature citing a real agency action: OCC conditionally approved Paxos's national trust conversion Dec 12, 2025 (CA No. 1358).",
  },
];

const sasRpc = rpc as unknown as Parameters<typeof fetchSchema>[0];
const authority = await loadWallet();
const REISSUE = process.argv.includes("--reissue");
const TEXT_FIELDS = ["issuer", "action", "reference", "summary"] as const;

// credential (idempotent)
const [credentialPda] = await deriveCredentialPda({
  authority: authority.address,
  name: CREDENTIAL_NAME,
});
if (!(await fetchMaybeCredential(sasRpc, credentialPda)).exists) {
  const ix = getCreateCredentialInstruction({
    payer: authority,
    credential: credentialPda,
    authority,
    name: CREDENTIAL_NAME,
    signers: [authority.address],
  });
  await sendIxs(authority, [ix as unknown as Instruction]);
  console.log(`credential created: ${credentialPda}`);
} else console.log(`credential exists: ${credentialPda}`);

// schema (idempotent)
const [schemaPda] = await deriveSchemaPda({
  credential: credentialPda,
  name: SCHEMA_NAME,
  version: 1,
});
if (!(await fetchMaybeSchema(sasRpc, schemaPda)).exists) {
  const ix = getCreateSchemaInstruction({
    payer: authority,
    authority,
    credential: credentialPda,
    schema: schemaPda,
    name: SCHEMA_NAME,
    description:
      "Regulator countersignature of a Permitr issuer record (SIMULATED credential for demonstration; cited actions are real)",
    layout: LAYOUT,
    fieldNames: FIELD_NAMES,
  });
  await sendIxs(authority, [ix as unknown as Instruction]);
  console.log(`schema created: ${schemaPda}`);
} else console.log(`schema exists: ${schemaPda}`);

// countersign each mint (nonce = mint; idempotent)
const schema = await fetchSchema(sasRpc, schemaPda);
for (const cert of CERTS) {
  const nonce = address(cert.mint);
  const [attestationPda] = await deriveAttestationPda({
    credential: credentialPda,
    schema: schemaPda,
    nonce,
  });
  const existing = await fetchMaybeAttestation(sasRpc, attestationPda);
  if (existing.exists) {
    const onchain = deserializeAttestationData<Record<string, unknown>>(
      schema.data,
      existing.data.data as Uint8Array,
    );
    const drift = TEXT_FIELDS.filter((f) => onchain[f] !== cert[f]);
    if (drift.length === 0) {
      console.log(`countersignature current for ${cert.issuer}: ${attestationPda}`);
      continue;
    }
    if (!REISSUE) {
      console.log(
        `countersignature DRIFT for ${cert.issuer} (${drift.join(", ")}): ${attestationPda} — rerun with --reissue`,
      );
      continue;
    }
    // close then re-create: separate transactions, the PDA must be freed first
    const close = getCloseAttestationInstruction({
      payer: authority,
      authority,
      credential: credentialPda,
      attestation: attestationPda,
    });
    await sendIxs(authority, [close as unknown as Instruction], {
      landed: async () => !(await fetchMaybeAttestation(sasRpc, attestationPda)).exists,
    });
    console.log(`closed stale countersignature (${drift.join(", ")}) for ${cert.issuer}`);
  }
  const data = serializeAttestationData(schema.data, {
    ...cert,
    timestamp: Math.floor(Date.now() / 1000),
  });
  const ix = getCreateAttestationInstruction({
    payer: authority,
    authority,
    credential: credentialPda,
    schema: schemaPda,
    attestation: attestationPda,
    nonce,
    data: Buffer.from(data),
    expiry: BigInt(Math.floor(Date.now() / 1000) + 5 * 365 * 24 * 3600),
  });
  await sendIxs(authority, [ix as unknown as Instruction], {
    landed: async () => (await fetchMaybeAttestation(sasRpc, attestationPda)).exists,
  });
  console.log(`countersigned ${cert.issuer}: ${attestationPda}`);
}

// write the known-regulators registry consumed by the SDK + examiner
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
writeFileSync(
  path.join(root, "data/regulators.json"),
  JSON.stringify(
    [{ name: CREDENTIAL_NAME, credential: credentialPda, schema: schemaPda }],
    null,
    2,
  ) + "\n",
);
console.log("data/regulators.json written");
