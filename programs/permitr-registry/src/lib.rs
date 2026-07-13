pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("3cwNTm2FHSViLLm2gVp62DqS2ttLbHigXWw4XDTbo35Y");

/// Permitr Registry — a citation-backed, versioned onchain mirror of the
/// GENIUS Act's (PL 119-27) permitted-payment-stablecoin-issuer structure.
///
/// It encodes the law; it does not opine. Classifications are illustrative,
/// cited, and pinned to a registry version. Not legal advice — see README.
#[program]
pub mod permitr_registry {
    use super::*;

    pub fn initialize_registry(ctx: Context<InitializeRegistry>, version: u32) -> Result<()> {
        instructions::initialize_registry::handle_initialize_registry(ctx, version)
    }

    pub fn upsert_issuer_record(
        ctx: Context<UpsertIssuerRecord>,
        args: IssuerRecordArgs,
    ) -> Result<()> {
        instructions::upsert_issuer_record::handle_upsert_issuer_record(ctx, args)
    }

    pub fn set_citation_basis(
        ctx: Context<SetCitationBasis>,
        kind: BasisKind,
        citations: Vec<Citation>,
    ) -> Result<()> {
        instructions::set_citation_basis::handle_set_citation_basis(ctx, kind, citations)
    }

    pub fn bump_registry_version(ctx: Context<BumpRegistryVersion>) -> Result<()> {
        instructions::bump_registry_version::handle_bump_registry_version(ctx)
    }
}
