use anchor_lang::prelude::*;

use crate::{constants::*, error::RegistryError, state::RegistryConfig};

#[derive(Accounts)]
pub struct BumpRegistryVersion<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ RegistryError::Unauthorized,
    )]
    pub config: Account<'info, RegistryConfig>,
}

pub fn handle_bump_registry_version(ctx: Context<BumpRegistryVersion>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.version = config.version.checked_add(1).unwrap();
    config.updated_at = Clock::get()?.unix_timestamp;

    msg!("Registry version bumped to {}", config.version);
    Ok(())
}
