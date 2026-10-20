use anchor_lang::prelude::*;

use crate::{constants::*, error::RegistryError, program::PermitrRegistry, state::RegistryConfig};

/// Only the program's upgrade authority can initialize the registry, so a
/// fresh deployment cannot be front-run into someone else's authority.
#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(constraint = program.programdata_address()? == Some(program_data.key()))]
    pub program: Program<'info, PermitrRegistry>,
    #[account(
        constraint = program_data.upgrade_authority_address == Some(authority.key())
            @ RegistryError::Unauthorized
    )]
    pub program_data: Account<'info, ProgramData>,
    #[account(
        init,
        payer = authority,
        space = 8 + RegistryConfig::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, RegistryConfig>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_registry(ctx: Context<InitializeRegistry>, version: u32) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.version = version;
    config.updated_at = Clock::get()?.unix_timestamp;
    config.bump = ctx.bumps.config;

    msg!("Permitr registry initialized at version {}", version);
    Ok(())
}
