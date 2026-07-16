/**
 * Create the SIMULATED regulator credential + certification schema, and
 * countersign USDC and PYUSD with attestations citing REAL OCC actions.
 * (Signer simulated and labeled as such; facts real and source-verified.)
 *
 * Nonce = the mint address -> countersignatures are deterministically
 * discoverable from (credential, schema, mint). Idempotent.
 */
import { type Instruction } from "@solana/kit";
import { address } from "@solana/kit";
import {
  deriveAttestationPda,
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
    issuer: "Circle (Circle National Trust, N.A.)",
    action: "NationalTrustCharterApproved",
    reference: "OCC final approval, Circle National Trust, N.A. (Jul 10, 2026)",
    summary:
      "SIMULATED countersignature citing a real agency action: OCC granted final approval for Circle's national trust bank on Jul 10, 2026.",
  },
  {
    mint: "CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM",
    issuer: "Paxos Trust Company (OCC national trust)",
    action: "CharterConversionCompleted",
    reference: "OCC approval — Paxos NYDFS-to-national-trust conversion (Dec 12, 2025)",
    summary:
      "SIMULATED countersignature citing a real agency action: Paxos completed conversion to an OCC national trust charter on Dec 12, 2025.",
  },
];

const sasRpc = rpc as unknown as Parameters<typeof fetchSchema>[0];
const authority = await loadWallet();

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
  if ((await fetchMaybeAttestation(sasRpc, attestationPda)).exists) {
    console.log(`countersignature exists for ${cert.issuer}: ${attestationPda}`);
    continue;
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
  await sendIxs(authority, [ix as unknown as Instruction]);
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
