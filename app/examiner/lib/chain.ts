/**
 * Examiner View data layer — fetches a Permitr payment attestation from
 * devnet, decodes it against the permitr-payment schema, cross-references
 * the registry record for the evaluated mint, and independently recomputes
 * the citation hash. Everything rendered is read from chain; nothing is
 * trusted from the URL beyond the attestation address itself.
 */
import { address, createSolanaRpc } from "@solana/kit";
import {
  deriveAttestationPda,
  deserializeAttestationData,
  fetchMaybeAttestation,
  fetchSchema,
} from "sas-lib";
import {
  fetchMaybeIssuerRecord,
  findRecordPda,
  Status,
  Pathway,
  FederalSubtype,
  CiteSource,
  type IssuerRecord,
} from "../../../sdk/generated/index";
import { citationHash } from "../../../sdk/citation-hash";

export const PERMITR_CREDENTIAL =
  "91qxSAdW6T3BshWVvP6o68hoLDrFfnFoeRNT68qP6ex8";
export const PERMITR_PAYMENT_SCHEMA =
  "8fi4naNQJYMQ7uWpvBGMWbrvuvyf6vgp7eLvbTHTJb2Y";

const rpc = createSolanaRpc(
  process.env.RPC_URL ?? "https://api.devnet.solana.com",
);
const sasRpc = rpc as unknown as Parameters<typeof fetchSchema>[0];

export type DecodedAttestation = {
  payment_ref: string;
  mint: string;
  status: number;
  pathway: number;
  decision: number;
  registry_version: number;
  citation_hash: number[];
  timestamp: bigint;
};

export const DECISION_LABELS = ["Allowed", "Blocked", "Rerouted"] as const;

export const STATUS_PLAIN: Record<number, { label: string; plain: string }> = {
  [Status.PathwayQualified]: {
    label: "Pathway Qualified",
    plain:
      "An anticipated permitted-payment-stablecoin-issuer pathway was identified for this asset's issuer, with citations.",
  },
  [Status.ExceptionConditionsUnmet]: {
    label: "Exception — Conditions Unmet",
    plain:
      "The §18 foreign-issuer exception was identified, but its conditions are not currently satisfiable. The payment was blocked.",
  },
  [Status.NoPathwayIdentified]: {
    label: "No Pathway Identified",
    plain:
      "No statutory pathway to permitted-issuer status was identified. The payment was blocked.",
  },
  [Status.Unknown]: {
    label: "Unknown (no registry record)",
    plain:
      "No registry record existed for this asset. Under Permitr's fail-closed rule, unknown assets are blocked — never allowed.",
  },
};

export const PATHWAY_PLAIN: Record<number, { label: string; plain: string }> = {
  [Pathway.IdiSubsidiary]: {
    label: "Insured Depository Institution Subsidiary",
    plain: "GENIUS Act §2(23)(A) — subsidiary of an insured depository institution.",
  },
  [Pathway.FederalQualified]: {
    label: "Federal Qualified Issuer",
    plain: "GENIUS Act §2(23)(B) via §2(11) — federally qualified payment stablecoin issuer.",
  },
  [Pathway.StateQualified]: {
    label: "State Qualified Issuer",
    plain: "GENIUS Act §2(23)(C), §2(31) — approved by a State payment stablecoin regulator.",
  },
  [Pathway.ForeignSection18]: {
    label: "§18 Foreign-Issuer Exception",
    plain:
      "Not a permitted pathway: §18 is an exception to the §3 prohibition, conditional on Treasury comparability, OCC registration, and US-held reserves.",
  },
  [Pathway.NoPathway]: {
    label: "No Pathway",
    plain: "No statutory basis identified.",
  },
};

export const SUBTYPE_LABELS: Record<number, string> = {
  [FederalSubtype.OccApprovedNonbank]: "OCC-approved nonbank (§2(11)(A))",
  [FederalSubtype.UninsuredNationalBank]:
    "Uninsured national bank / national trust (§2(11)(B))",
  [FederalSubtype.FederalBranch]: "Federal branch (§2(11)(C))",
};

export type ExaminerRecord = {
  attestationAddress: string;
  decoded: DecodedAttestation;
  issuedByPermitr: boolean;
  record: IssuerRecord | null;
  citations: {
    field: string;
    authority: string;
    reference: string;
    summary: string;
  }[];
  hashVerified: boolean | null; // null when no record exists to verify against
};

export async function loadAttestation(
  attestationAddress: string,
): Promise<ExaminerRecord | null> {
  const maybe = await fetchMaybeAttestation(
    sasRpc,
    address(attestationAddress) as Parameters<
      typeof fetchMaybeAttestation
    >[1],
  );
  if (!maybe.exists) return null;

  const att = maybe.data;
  const issuedByPermitr =
    String(att.credential) === PERMITR_CREDENTIAL &&
    String(att.schema) === PERMITR_PAYMENT_SCHEMA;

  const schema = await fetchSchema(
    sasRpc,
    att.schema as Parameters<typeof fetchSchema>[1],
  );
  const decoded = deserializeAttestationData<DecodedAttestation>(
    schema.data,
    att.data as Uint8Array,
  );

  // cross-reference the registry record for the evaluated mint
  let record: IssuerRecord | null = null;
  try {
    const [pda] = await findRecordPda({ mint: address(decoded.mint) });
    const maybeRecord = await fetchMaybeIssuerRecord(rpc, pda);
    record = maybeRecord.exists ? maybeRecord.data : null;
  } catch {
    record = null;
  }

  const fields = ["pathway", "status", "reserve", "redemption"] as const;
  const citations = record
    ? fields.flatMap((field) => {
        const basis = {
          pathway: record!.pathwayBasis,
          status: record!.statusBasis,
          reserve: record!.reserveBasis,
          redemption: record!.redemptionBasis,
        }[field];
        return basis.map((c) => ({
          field,
          authority: CiteSource[c.authority],
          reference: c.reference,
          summary: c.summary,
        }));
      })
    : [];

  // independent verification: recompute the citation hash from the registry
  const hashVerified = record
    ? Buffer.from(citationHash(record)).equals(
        Buffer.from(decoded.citation_hash),
      )
    : null;

  return {
    attestationAddress,
    decoded,
    issuedByPermitr,
    record,
    citations,
    hashVerified,
  };
}

export { deriveAttestationPda };
