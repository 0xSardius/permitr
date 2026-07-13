use anchor_lang::prelude::*;

use crate::{constants::*, error::RegistryError, state::*};

#[derive(Accounts)]
pub struct SetCitationBasis<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ RegistryError::Unauthorized,
    )]
    pub config: Account<'info, RegistryConfig>,
    /// CHECK: mint key only seeds the record PDA.
    pub mint: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [ISSUER_SEED, mint.key().as_ref()],
        bump = record.bump,
    )]
    pub record: Account<'info, IssuerRecord>,
}

pub fn handle_set_citation_basis(
    ctx: Context<SetCitationBasis>,
    kind: BasisKind,
    citations: Vec<Citation>,
) -> Result<()> {
    require!(
        !citations.is_empty() && citations.len() <= MAX_CITATIONS_PER_BASIS as usize,
        RegistryError::CitationCountInvalid
    );
    // The book is the analysis layer; primary authority must be law or
    // official action.
    require!(
        citations[0].authority != CiteSource::BookSection,
        RegistryError::BookSectionCannotBePrimary
    );
    for cite in &citations {
        require!(
            cite.reference.len() <= MAX_CITE_REFERENCE_LEN as usize
                && cite.summary.len() <= MAX_CITE_SUMMARY_LEN as usize,
            RegistryError::CitationTooLong
        );
    }

    let record = &mut ctx.accounts.record;
    match kind {
        BasisKind::Pathway => record.pathway_basis = citations,
        BasisKind::Status => record.status_basis = citations,
        BasisKind::Reserve => record.reserve_basis = citations,
        BasisKind::Redemption => record.redemption_basis = citations,
    }
    record.updated_at = Clock::get()?.unix_timestamp;

    msg!("Citations set for {:?} basis on mint {}", kind as u8, record.mint);
    Ok(())
}
