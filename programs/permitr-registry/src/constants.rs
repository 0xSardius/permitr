use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const ISSUER_SEED: &[u8] = b"issuer";

#[constant]
pub const MAX_ISSUER_NAME_LEN: u16 = 64;

#[constant]
pub const MAX_CITE_REFERENCE_LEN: u16 = 96;

#[constant]
pub const MAX_CITE_SUMMARY_LEN: u16 = 160;

#[constant]
pub const MAX_CITATIONS_PER_BASIS: u8 = 2;
