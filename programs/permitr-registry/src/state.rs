use anchor_lang::prelude::*;

/// Registry-wide config. One PDA, seeds = [b"config"].
#[account]
#[derive(InitSpace)]
pub struct RegistryConfig {
    pub authority: Pubkey,
    /// Current registry version. Bumped when the legal landscape moves
    /// (rule finalized, charter converted, determination made). Every
    /// attestation pins the version it was evaluated under.
    pub version: u32,
    pub updated_at: i64,
    pub bump: u8,
}

/// One record per SPL mint. Seeds = [b"issuer", mint].
/// This is the core IP: a citation-backed mirror of the GENIUS Act's
/// issuer-pathway structure. It encodes the law; it does not opine.
#[account]
#[derive(InitSpace)]
pub struct IssuerRecord {
    /// SPL mint this record certifies (SPL Token or Token-2022).
    pub mint: Pubkey,
    #[max_len(64)]
    pub issuer_name: String,
    /// Statutory pathway (or exception, or none). See enum docs.
    pub pathway: Pathway,
    /// §2(11)(A)-(C) sub-type; NotApplicable unless pathway == FederalQualified.
    pub federal_subtype: FederalSubtype,
    /// Anticipated classification as of `registry_version`, cited.
    pub status: Status,
    /// Authority for the pathway determination. [primary, optional book analysis].
    #[max_len(2)]
    pub pathway_basis: Vec<Citation>,
    /// Why this status today (supports the negative-citation pattern).
    #[max_len(2)]
    pub status_basis: Vec<Citation>,
    /// Applicable reserve requirement (§4(a)(1)(A), or §18(a)(3) for foreign issuers).
    #[max_len(2)]
    pub reserve_basis: Vec<Citation>,
    /// Applicable redemption requirement (§4(a)(1)(B), or foreign-regime rule).
    #[max_len(2)]
    pub redemption_basis: Vec<Citation>,
    /// Registry version this classification was authored under —
    /// pinned into every attestation that consumes it.
    pub registry_version: u32,
    pub updated_at: i64,
    pub bump: u8,
}

/// GENIUS Act §2(23) defines exactly three permitted-issuer categories.
/// The foreign route (§18) is an EXCEPTION available only to issuers who are
/// definitionally NOT permitted issuers (§2(12)) — it must never be framed
/// as a permitted pathway.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Pathway {
    /// §2(23)(A) — subsidiary of an insured depository institution.
    IdiSubsidiary,
    /// §2(23)(B) via §2(11) — see FederalSubtype.
    FederalQualified,
    /// §2(23)(C), §2(31), §4(c) ($10B state-regime election).
    StateQualified,
    /// §18 exception to the §3 prohibition — not a permitted pathway.
    ForeignSection18,
    /// No statutory basis identified.
    NoPathway,
}

/// §2(11)(A)-(C).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum FederalSubtype {
    /// §2(11)(A) — OCC-approved nonbank entity.
    OccApprovedNonbank,
    /// §2(11)(B) — uninsured national bank chartered by the Comptroller
    /// (national trust charters: Circle National Trust, Paxos Trust).
    UninsuredNationalBank,
    /// §2(11)(C) — Federal branch.
    FederalBranch,
    NotApplicable,
}

/// Verdict. All classifications are anticipated pathways as of the pinned
/// registry version — no §5 approvals exist pre-effective-date (see disclaimer).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Status {
    /// Anticipated permitted-issuer pathway, cited → agent may pay.
    PathwayQualified,
    /// §18 exception identified but conditions not currently satisfiable
    /// (e.g. no Treasury comparability determination) → BLOCK, render the path.
    ExceptionConditionsUnmet,
    /// No pathway → BLOCK.
    NoPathwayIdentified,
    /// CLIENT-SIDE ONLY: PDA miss / RPC failure → BLOCK (fail closed).
    /// Never written on-chain; present for stable u8 ↔ TS mapping.
    Unknown,
}

/// One citation: a source of authority plus a plain-English line for the
/// Examiner View. Reference/summary strings come only from source-verified
/// anchors or the book — never invented (see CLAUDE.md hard rules).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub struct Citation {
    pub authority: CiteSource,
    #[max_len(96)]
    pub reference: String,
    #[max_len(160)]
    pub summary: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CiteSource {
    /// PL 119-27 sections.
    Statute,
    /// NPRMs and ANPRMs (OCC 91 FR 10202, FINCEN-2026-0100, ...).
    ProposedRule,
    /// OCC approvals/conversions, Treasury determinations.
    AgencyAction,
    /// Foreign regulatory regimes (e.g. MAS stablecoin framework).
    ForeignRegime,
    /// Author's analysis layer — always second in a Vec, never primary.
    BookSection,
}
