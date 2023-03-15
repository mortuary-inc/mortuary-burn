use anchor_lang::prelude::*;
use std::mem::size_of;

use crate::account::*;

#[derive(Accounts)]
pub struct CreateBooster<'info> {
    #[account(
        init,
        payer = initializer, 
        space = 8 + size_of::<BoosterAccount>())]
    pub booster: Account<'info, BoosterAccount>,
    #[account( 
        seeds = [initializer.key().as_ref(), b"master"], 
        bump = master_account.bump, 
        owner = *program_id,
        has_one = initializer)]
    pub master_account: Account<'info, MortuaryMasterAccount>,
    /// CHECK: signer
    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBooster<'info> {
    #[account(mut, 
        owner = *program_id,
        has_one = initializer)]
    pub booster: Account<'info, BoosterAccount>,
    /// CHECK: signer
    #[account(signer)]
    pub initializer: AccountInfo<'info>,
}

#[account]
pub struct BoosterAccount {
    pub version: u8,
    pub initializer: Pubkey,
    pub id: u8,
    pub creator: Option<Pubkey>,
    pub name: Option<[u8; 32]>,
    pub ash_multiplicator: u8,
    pub ash_by_burn: u32,
    pub ash_if_burn: u32,
    pub check_signed: bool,
    pub reserved0: u32,
    pub reserved1: u32,
}
