/**
 * Canonical citation hash (SPEC §5): SHA-256 over the Borsh serialization of
 * the ordered citation set [pathway_basis, status_basis, reserve_basis,
 * redemption_basis]. Each Vec<Citation> is encoded borsh-style: u32-LE count
 * followed by each citation (matching the on-chain account layout), so the
 * Examiner View can recompute the hash from the registry record and confirm
 * the attestation cited exactly what the registry said at that version.
 */
import { createHash } from "node:crypto";
import { getCitationEncoder, type Citation } from "./generated/index";

export function citationHash(bases: {
  pathwayBasis: Citation[];
  statusBasis: Citation[];
  reserveBasis: Citation[];
  redemptionBasis: Citation[];
}): Uint8Array {
  const enc = getCitationEncoder();
  const hash = createHash("sha256");
  for (const basis of [
    bases.pathwayBasis,
    bases.statusBasis,
    bases.reserveBasis,
    bases.redemptionBasis,
  ]) {
    const len = Buffer.alloc(4);
    len.writeUInt32LE(basis.length);
    hash.update(len);
    for (const cite of basis) hash.update(Buffer.from(enc.encode(cite)));
  }
  return new Uint8Array(hash.digest());
}
