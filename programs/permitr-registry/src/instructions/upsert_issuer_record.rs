use anchor_lang::prelude::*;

use crate::{constants::*, error::RegistryError, state::*};

/// Core fields only — citations are written separately via
/// `set_citation_basis` (a full record exceeds the transaction size limit).
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct IssuerRecordArgs {
    pub issuer_name: String,
    pub pathway: Pathway,
    pub federal_subtype: FederalSubtype,
    pub status: Status,
}

#[derive(Accounts)]
pub struct UpsertIssuerRecord<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ RegistryError::Unauthorized,
    )]
    pub config: Account<'info, RegistryConfig>,
    /// CHECK: any SPL / Token-2022 mint address; the registry only keys on it.
    pub mint: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + IssuerRecord::INIT_SPACE,
        seeds = [ISSUER_SEED, mint.key().as_ref()],
        bump
    )]
    pub record: Account<'info, IssuerRecord>,
    pub system_program: Program<'info, System>,
}

pub fn handle_upsert_issuer_record(
    ctx: Context<UpsertIssuerRecord>,
    args: IssuerRecordArgs,
) -> Result<()> {
    validate(&args)?;

    let record = &mut ctx.accounts.record;
    record.mint = ctx.accounts.mint.key();
    record.issuer_name = args.issuer_name;
    record.pathway = args.pathway;
    record.federal_subtype = args.federal_subtype;
    record.status = args.status;
    // Citation bases are preserved across upserts and written via
    // set_citation_basis; a fresh record starts with empty bases that the
    // seed flow must fill before the record is demo-complete.
    // Pin the version the classification was authored under — this is what
    // attestations cite, making every verdict auditable against a point in time.
    record.registry_version = ctx.accounts.config.version;
    record.updated_at = Clock::get()?.unix_timestamp;
    record.bump = ctx.bumps.record;

    msg!(
        "IssuerRecord upserted for mint {} at registry v{}",
        record.mint,
        record.registry_version
    );
    Ok(())
}

/// Encode the statute's structure as program invariants: the registry cannot
/// record a classification the GENIUS Act's definitions make incoherent.
fn validate(args: &IssuerRecordArgs) -> Result<()> {
    // Status::Unknown only ever originates client-side (fail-closed on miss).
    require!(
        args.status != Status::Unknown,
        RegistryError::UnknownStatusNotWritable
    );

    // §2(23): only the three permitted-issuer categories can be PathwayQualified.
    // §18 is an exception (§2(12)) — the program refuses to frame it as permitted.
    if args.status == Status::PathwayQualified {
        require!(
            matches!(
                args.pathway,
                Pathway::IdiSubsidiary | Pathway::FederalQualified | Pathway::StateQualified
            ),
            RegistryError::StatusPathwayMismatch
        );
    }

    // ExceptionConditionsUnmet is only meaningful for the §18 route.
    if args.status == Status::ExceptionConditionsUnmet {
        require!(
            args.pathway == Pathway::ForeignSection18,
            RegistryError::ExceptionStatusRequiresSection18
        );
    }

    // §2(11): subtype set iff pathway is FederalQualified.
    require!(
        (args.pathway == Pathway::FederalQualified)
            == (args.federal_subtype != FederalSubtype::NotApplicable),
        RegistryError::FederalSubtypeMismatch
    );

    require!(
        args.issuer_name.len() <= MAX_ISSUER_NAME_LEN as usize,
        RegistryError::IssuerNameTooLong
    );

    Ok(())
}
