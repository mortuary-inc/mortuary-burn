use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Mint};

use crate::account::*;

#[derive(Debug, Clone)]
pub struct MetadataProgram;
impl anchor_lang::Id for MetadataProgram {
    fn id() -> Pubkey {
        mpl_token_metadata::id()
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
#[instruction(plot_size: u8)]
pub struct InitializeVoxelBurn<'info> {
    #[account(
        init,
        space = 8 + VoxelBurnAccount::size(),
        payer = user,
        seeds = [program_id.as_ref(), voxel_mint.key().as_ref(), b"voxelburn"],
        bump)]
    pub voxel_burn_account: Account<'info, VoxelBurnAccount>,
    /// CHECK: signer
    #[account(signer, mut)]
    pub user: AccountInfo<'info>,
    /// CHECK: owner: splt
    #[account(owner = spl_token::ID)]
    pub voxel_mint: AccountInfo<'info>,
    pub voxel_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: metaplex
    #[account(owner = mpl_token_metadata::id())]
    pub voxel_metadata: AccountInfo<'info>,
    #[account(owner = *program_id)]
    pub master_account: Account<'info, MortuaryMasterAccount>,
    pub system_program: Program<'info, System>,
}

//
// Constraints:
// - voxel_account is owned by the user signing the transaction
// - voxel_burn_account.mint == voxel_account.mint
// - ash_token_account.owner == voxel_account.owner
// - master_account == voxel_burn_account.master
#[derive(Accounts)]
pub struct DoVoxelBurn2<'info> {
    /// CHECK: signer
    #[account(signer, mut)]
    pub user: AccountInfo<'info>,

    #[account(mut, 
        seeds = [program_id.as_ref(), voxel_account.mint.as_ref(), b"voxelburn"], 
        bump = voxel_burn_account.bump, 
        owner = *program_id,
        constraint = voxel_burn_account.mint == voxel_account.mint,
        constraint = voxel_burn_account.master == master_account.key(),
    )]
    pub voxel_burn_account: Account<'info, VoxelBurnAccount>,
    #[account()]
    pub voxel_account: Box<Account<'info, TokenAccount>>,

    // master
    #[account(
        owner = *program_id,
        has_one = bank,
        has_one = treasury,
    )]
    pub master_account: Account<'info, MortuaryMasterAccount>,
    #[account(mut)]
    pub bank: Box<Account<'info, TokenAccount>>,
    /// CHECK: from master
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    /// CHECK: signer
    pub pda_account: AccountInfo<'info>,

    // burned nft
    #[account(mut)]
    pub nft_burn_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub nft_burn_mint: Box<Account<'info, Mint>>,
    /// CHECK: check_metadata
    pub nft_burn_metadata: AccountInfo<'info>,
    /// CHECK: check_master_edition
    pub nft_burn_edition: AccountInfo<'info>,

    #[account(mut)] // removed for commons: constraint = ash_token_account.owner == voxel_account.owner
    pub ash_token_account: Box<Account<'info, TokenAccount>>,
    
    /// CHECK: spl
    #[account(address = spl_token::id())]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

//
// Constraints:
// - voxel_account is owned by the user signing the transaction
// - voxel_burn_account.mint == voxel_account.mint
// - ash_token_account.owner == voxel_account.owner
// - master_account == voxel_burn_account.master
#[derive(Accounts)]
pub struct DoVoxelBurn3<'info> {
    /// CHECK: signer
    #[account(signer, mut)]
    pub user: AccountInfo<'info>,

    #[account(mut, 
        seeds = [program_id.as_ref(), voxel_account.mint.as_ref(), b"voxelburn"], 
        bump = voxel_burn_account.bump, 
        owner = *program_id,
        constraint = voxel_burn_account.mint == voxel_account.mint,
        constraint = voxel_burn_account.master == master_account.key(),
    )]
    pub voxel_burn_account: Account<'info, VoxelBurnAccount>,
    #[account()]
    pub voxel_account: Box<Account<'info, TokenAccount>>,

    // master
    #[account(
        owner = *program_id,
        has_one = bank,
        has_one = treasury,
    )]
    pub master_account: Account<'info, MortuaryMasterAccount>,
    #[account(mut)]
    pub bank: Box<Account<'info, TokenAccount>>,
    /// CHECK: from master
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    /// CHECK: signer
    pub pda_account: AccountInfo<'info>,

    // burned nft
    #[account(mut)]
    pub nft_burn_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub nft_burn_mint: Box<Account<'info, Mint>>,
    /// CHECK: check_metadata
    #[account(mut)]
    pub nft_burn_metadata: AccountInfo<'info>,
    /// CHECK: check_master_edition
    #[account(mut)]
    pub nft_burn_edition: AccountInfo<'info>,

    #[account(mut)] // removed for commons: constraint = ash_token_account.owner == voxel_account.owner
    pub ash_token_account: Box<Account<'info, TokenAccount>>,
    
    /// CHECK: spl
    #[account(address = spl_token::id())]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub metadata_program: Program<'info, MetadataProgram>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct SetVoxelBurnTax<'info> {
    #[account(
        mut,
        seeds = [program_id.as_ref(), voxel_mint.key().as_ref(), b"voxelburn"],
        bump = bump)]
    pub voxel_burn_account: Account<'info, VoxelBurnAccount>,
    /// CHECK: signer
    #[account(signer, mut)]
    pub user: AccountInfo<'info>,
    /// CHECK: spl
    #[account(owner = spl_token::ID)]
    pub voxel_mint: AccountInfo<'info>,
    pub voxel_account: Account<'info, TokenAccount>,
}

#[account]
pub struct VoxelBurnAccount {
    pub bump: u8,
    pub mint: Pubkey,
    pub master: Pubkey,
    pub last_burn: [u32; 10],
    pub share: u8,
    pub plot_size: u8,
}

impl VoxelBurnAccount {
    fn size() -> usize {
        1 + // bump
        32 + // mint
        32 + // master
        4 * 10 + // last_burn
        1 + // share
        1 // plot_size
    }
}
