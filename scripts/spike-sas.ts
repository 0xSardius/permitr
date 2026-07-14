/**
 * Day-1/2 spike: prove one full SAS round-trip on devnet —
 * credential -> schema -> attestation -> fetch -> deserialize.
 *
 * The schema is SPEC §5's payment-evaluation attestation. This spike's
 * credential + schema are the real ones the agent will attest under;
 * the attestation itself is a sample (decision data is fake, marked so).
 */
import { generateKeyPairSigner, type Instruction } from "@solana/kit";
import {
  deriveAttestationPda,
  deriveCredentialPda,
  deriveSchemaPda,
  deserializeAttestationData,
  fetchAttestation,
  fetchMaybeCredential,
  fetchMaybeSchema,
  fetchSchema,
  getCreateAttestationInstruction,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  serializeAttestationData,
} from "sas-lib";
import { loadWallet, rpc, sendIxs } from "./lib.js";

const CREDENTIAL_NAME = "Permitr";
const SCHEMA_NAME = "permitr-payment";
const SCHEMA_VERSION = 1;

// SAS compact layout codes: 12=String, 0=u8, 2=u32, 13=Vec<u8>, 8=i64
const LAYOUT = Buffer.from([12, 12, 0, 0, 0, 2, 13, 8]);
const FIELD_NAMES = [
  "payment_ref",
  "mint",
  "status",
  "pathway",
  "decision",
  "registry_version",
  "citation_hash",
  "timestamp",
];

// sas-lib bundles its own @solana/kit@5; our rpc is kit@6. The objects are
// structurally compatible at runtime — cast once at the library boundary.
const sasRpc = rpc as unknown as Parameters<typeof fetchSchema>[0];

const authority = await loadWallet();
console.log(`SAS spike as ${authority.address}`);

// 1. credential (idempotent)
const [credentialPda] = await deriveCredentialPda({
  authority: authority.address,
  name: CREDENTIAL_NAME,
});
const maybeCredential = await fetchMaybeCredential(sasRpc, credentialPda);
if (!maybeCredential.exists) {
  const ix = getCreateCredentialInstruction({
    payer: authority,
    credential: credentialPda,
    authority,
    name: CREDENTIAL_NAME,
    signers: [authority.address],
  });
  await sendIxs(authority, [ix as unknown as Instruction]);
  console.log(`Credential created: ${credentialPda}`);
} else {
  console.log(`Credential exists: ${credentialPda}`);
}

// 2. schema (idempotent)
const [schemaPda] = await deriveSchemaPda({
  credential: credentialPda,
  name: SCHEMA_NAME,
  version: SCHEMA_VERSION,
});
const maybeSchema = await fetchMaybeSchema(sasRpc, schemaPda);
if (!maybeSchema.exists) {
  const ix = getCreateSchemaInstruction({
    payer: authority,
    authority,
    credential: credentialPda,
    schema: schemaPda,
    name: SCHEMA_NAME,
    description:
      "Permitr payment evaluation: verdict, pathway, citations hash, registry version per evaluated x402 payment",
    layout: LAYOUT,
    fieldNames: FIELD_NAMES,
  });
  await sendIxs(authority, [ix as unknown as Instruction]);
  console.log(`Schema created: ${schemaPda}`);
} else {
  console.log(`Schema exists: ${schemaPda}`);
}

// 3. attestation with sample payload
const schema = await fetchSchema(sasRpc, schemaPda);
const sample = {
  payment_ref: "SPIKE-SAMPLE-not-a-real-payment",
  mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  status: 0, // PathwayQualified
  pathway: 1, // FederalQualified
  decision: 0, // Allowed
  registry_version: 2,
  citation_hash: Array.from(new Uint8Array(32).fill(7)), // sample hash
  timestamp: Math.floor(Date.now() / 1000),
};
const data = serializeAttestationData(schema.data, sample);

const nonce = (await generateKeyPairSigner()).address;
const [attestationPda] = await deriveAttestationPda({
  credential: credentialPda,
  schema: schemaPda,
  nonce,
});
const ix = getCreateAttestationInstruction({
  payer: authority,
  authority,
  credential: credentialPda,
  schema: schemaPda,
  attestation: attestationPda,
  nonce,
  data: Buffer.from(data),
  expiry: BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 3600),
});
await sendIxs(authority, [ix as unknown as Instruction]);
console.log(`Attestation created: ${attestationPda}`);

// 4. fetch + deserialize (what the Examiner View will do)
const fetched = await fetchAttestation(sasRpc, attestationPda);
const decoded = deserializeAttestationData<typeof sample>(
  schema.data,
  fetched.data.data as Uint8Array,
);
console.log("Round-trip decoded:", decoded);

const ok =
  decoded.payment_ref === sample.payment_ref &&
  decoded.mint === sample.mint &&
  Number(decoded.registry_version) === sample.registry_version;
if (!ok) {
  console.error("MISMATCH between written and decoded attestation");
  process.exit(1);
}
console.log(`\n✅ SAS round-trip proven on devnet.
   credential:  ${credentialPda}
   schema:      ${schemaPda}
   attestation: ${attestationPda}
   explorer:    https://explorer.solana.com/address/${attestationPda}?cluster=devnet`);
