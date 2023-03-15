use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use std::mem::size_of;

//
// Master account / rpc
//

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeMaster<'info> {
    #[account(
        init, 
        payer = initializer, 
        seeds = [initializer.key().as_ref(), b"master"], 
        bump, 
        space = 8 + size_of::<MortuaryMasterAccount>())]
    pub master_account: Account<'info, MortuaryMasterAccount>,
    /// CHECK:  signer
    #[account(signer, mut)]
    pub initializer: AccountInfo<'info>,
    #[account()]
    pub bank: Account<'info, TokenAccount>,
    /// CHECK: by the boss
    #[account()]
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateMaster<'info> {
    #[account(mut, 
        seeds = [initializer.key().as_ref(), b"master"], 
        bump = master_account.bump, 
        owner = *program_id,
        has_one = initializer)]
        pub master_account: Account<'info, MortuaryMasterAccount>,
    /// CHECK: signer
    #[account(signer, address = master_account.initializer)]
    pub initializer: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct WithdrawMaster<'info> {
    #[account(mut, 
        seeds = [initializer.key().as_ref(), b"master"], 
        bump = master_account.bump, 
        owner = *program_id,
        has_one = initializer)]
        pub master_account: Account<'info, MortuaryMasterAccount>,
    /// CHECK: signer
    #[account(signer, address = master_account.initializer)]
    pub initializer: AccountInfo<'info>,
    #[account(mut, address = master_account.bank)]
    pub bank: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,
    /// CHECK: signer
    pub pda_account: AccountInfo<'info>,
    /// CHECK: spl
    #[account(address = spl_token::id())]
    pub token_program: AccountInfo<'info>,
}

#[account]
pub struct MortuaryMasterAccount {
    pub initializer: Pubkey,
    pub bank: Pubkey,
    pub treasury: Pubkey,
    pub go_live_date: i64,   // long long way off by default
    pub burn_frequency: u32, // in seconds
    pub ash_by_burn: u32,    // 1 by default
    pub bump: u8,
    pub checks: u32,
}
