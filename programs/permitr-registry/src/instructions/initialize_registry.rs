use anchor_lang::prelude::*;

use crate::{constants::*, state::RegistryConfig};

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
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
