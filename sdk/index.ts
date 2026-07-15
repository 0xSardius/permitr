/**
 * Permitr SDK — queryRegistry(mint) -> Verdict
 *
 * FAIL-CLOSED, ALLOWLIST-STYLE (see CLAUDE.md hard rules):
 * a payment is allowed ONLY when status === "PathwayQualified".
 * A missing record, an RPC error, a timeout — anything at all — resolves to
 * status "Unknown" with allowed=false. This function never throws: nothing
 * upstream may ever interpret "no verdict" as "proceed".
 */
import { address, type Address, type Rpc, type SolanaRpcApi } from "@solana/kit";
import {
  fetchMaybeIssuerRecord,
  findRecordPda,
  CiteSource,
  FederalSubtype,
  Pathway,
  Status,
  type Citation,
} from "./generated/index.js";

export { CiteSource, FederalSubtype, Pathway, Status };

export type VerdictStatus =
  | "PathwayQualified"
  | "ExceptionConditionsUnmet"
  | "NoPathwayIdentified"
  | "Unknown";

export type VerdictCitation = {
  /** Which basis this citation supports: pathway | status | reserve | redemption */
  field: "pathway" | "status" | "reserve" | "redemption";
  authority: string; // "Statute" | "ProposedRule" | "AgencyAction" | "ForeignRegime" | "BookSection"
  reference: string;
  summary: string;
};

export type Verdict = {
  mint: string;
  status: VerdictStatus;
  /** Derived allowlist: true iff status === "PathwayQualified". The ONLY true case. */
  allowed: boolean;
  pathway: string | null;
  federalSubtype: string | null;
  issuerName: string | null;
  citations: VerdictCitation[];
  registryVersion: number;
  updatedAt: number | null;
  /** Raw decoded IssuerRecord (null when Unknown) — numeric enums + citation
   * bases for attestation emission and canonical citation hashing. */
  raw: import("./generated/index.js").IssuerRecord | null;
};

function unknownVerdict(mint: string): Verdict {
  return {
    mint,
    status: "Unknown",
    allowed: false,
    pathway: null,
    federalSubtype: null,
    issuerName: null,
    citations: [],
    registryVersion: 0,
    updatedAt: null,
    raw: null,
  };
}

function flattenCitations(
  field: VerdictCitation["field"],
  cites: Citation[],
): VerdictCitation[] {
  return cites.map((c) => ({
    field,
    authority: CiteSource[c.authority],
    reference: c.reference,
    summary: c.summary,
  }));
}

export async function queryRegistry(
  rpc: Rpc<SolanaRpcApi>,
  mint: string,
): Promise<Verdict> {
  try {
    const [recordPda] = await findRecordPda({ mint: address(mint) });
    const maybe = await fetchMaybeIssuerRecord(rpc, recordPda);
    if (!maybe.exists) return unknownVerdict(mint); // fail closed: no record => Unknown => blocked

    const r = maybe.data;
    const status = Status[r.status] as VerdictStatus;
    return {
      mint,
      status,
      allowed: status === "PathwayQualified",
      pathway: Pathway[r.pathway],
      federalSubtype:
        r.federalSubtype === FederalSubtype.NotApplicable
          ? null
          : FederalSubtype[r.federalSubtype],
      issuerName: r.issuerName,
      citations: [
        ...flattenCitations("pathway", r.pathwayBasis),
        ...flattenCitations("status", r.statusBasis),
        ...flattenCitations("reserve", r.reserveBasis),
        ...flattenCitations("redemption", r.redemptionBasis),
      ],
      registryVersion: r.registryVersion,
      updatedAt: Number(r.updatedAt),
      raw: r,
    };
  } catch {
    // fail closed on ANY failure (RPC error, timeout, decode error):
    // infrastructure failure must never fail open.
    return unknownVerdict(mint);
  }
}
