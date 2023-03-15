use anchor_lang::prelude::*;
use anchor_lang::solana_program::{self};
use anchor_lang::AccountDeserialize;
use anchor_spl::token::{TokenAccount};
use mpl_token_metadata::state::{Metadata, TokenMetadataAccount};
use spl_token::instruction::AuthorityType;

use account::*;
use account_v3::*;
use account_booster::*;
use check::*;
use error::*;

declare_id!("minc9MLymfBSEs9ho1pUaXbQQPdfnTnxUvJa8TWx85E");

mod account;
mod account_v3;
mod account_booster;
mod check;
mod common;
mod error;
// mod rando;

#[program]
pub mod mortuary {

    use common::{send_back_ash};

    use crate::common::burn_nft_full;

    use super::*;

    const PDA_SEED: &[u8] = b"mortuary";
    const VOXEL_NFT_NAME: &str = "Mortuary Inc Plot";

    // use burn_frequency && ash_by_burn
    // const MINUTES_BY_DAY: u32 = 24 * 60; // 24h frequency

    pub fn initialize_master(ctx: Context<InitializeMaster>, bump: u8) -> Result<()> {
        msg!("Initialize Mortuary account");

        ctx.accounts.master_account.bump = bump;
        ctx.accounts.master_account.initializer = *ctx.accounts.initializer.key;
        ctx.accounts.master_account.bank = *ctx.accounts.bank.to_account_info().key;
        ctx.accounts.master_account.treasury = *ctx.accounts.treasury.to_account_info().key;

        ctx.accounts.master_account.go_live_date = 1638957600; // 8 December 2021 10:00:00 UTC
        ctx.accounts.master_account.burn_frequency = 24 * 60 * 60; // 1 burn every 24 hours
        ctx.accounts.master_account.ash_by_burn = 3; // reward
        ctx.accounts.master_account.checks = 0xffffffff; // all checks enabled

        let (pda, _bump_seed) = Pubkey::find_program_address(&[PDA_SEED], ctx.program_id);

        let ix = spl_token::instruction::set_authority(
            &spl_token::ID,
            ctx.accounts.bank.to_account_info().key,
            Some(&pda),
            AuthorityType::AccountOwner,
            ctx.accounts.initializer.key,
            &[],
        )?;
        solana_program::program::invoke_signed(
            &ix,
            &[
                ctx.accounts.bank.to_account_info(),
                ctx.accounts.initializer.clone(),
                ctx.accounts.token_program.to_account_info(),
            ],
            &[],
        )?;

        Ok(())
    }

    pub fn update_master(
        ctx: Context<UpdateMaster>,
        go_live_date: Option<i64>,
        burn_frequency: Option<u32>,
        ash_by_burn: Option<u32>,
        checks: Option<u32>,
    ) -> Result<()> {
        let master_account = &mut ctx.accounts.master_account;

        msg!("Updating master account");

        if let Some(v) = go_live_date {
            msg!("Go live date changed to {}", v);
            master_account.go_live_date = v;
        }
        if let Some(v) = burn_frequency {
            msg!("Burn frequency changed to {}", v);
            master_account.burn_frequency = v;
        }
        if let Some(v) = ash_by_burn {
            msg!("Ash by burn changed to {}", v);
            master_account.ash_by_burn = v;
        }
        if let Some(v) = checks {
            msg!("Checks changed to {:#034b}", v);
            master_account.checks = v;
        }

        Ok(())
    }

    pub fn withdraw_master(ctx: Context<WithdrawMaster>, amount: u64) -> Result<()> {
        let master_account = &mut ctx.accounts.master_account;
        let bank_account_info = ctx.accounts.bank.to_account_info();

        msg!("Withdrawing some $ash");

        if master_account.bank != *bank_account_info.key {
            return Err(error!(MincError::WrongBankAccount));
        }

        let bank_sold = ctx.accounts.bank.amount;
        if bank_sold - amount <= 0 {
            return Err(error!(MincError::TreasuryOutOfAsh));
        }

        let (_pda, bump_seed) = Pubkey::find_program_address(&[PDA_SEED], ctx.program_id);
        let seeds = &[&PDA_SEED[..], &[bump_seed]];

        let transfer_ix = spl_token::instruction::transfer(
            &spl_token::ID,
            ctx.accounts.bank.to_account_info().key,
            ctx.accounts.owner_token_account.to_account_info().key,
            ctx.accounts.pda_account.key,
            &[],
            amount,
        )?;
        solana_program::program::invoke_signed(
            &transfer_ix,
            &[
                ctx.accounts.bank.to_account_info(),
                ctx.accounts.owner_token_account.to_account_info(),
                ctx.accounts.pda_account.clone(),
                ctx.accounts.token_program.to_account_info(),
            ],
            &[&seeds[..]],
        )?;

        Ok(())
    }

    pub fn initialize_voxel_burn(
        ctx: Context<InitializeVoxelBurn>,
        bump: u8,
        plot_size: u8,
    ) -> Result<()> {
        msg!("Initialize voxel burn account");

        // Check user own the nft
        if *ctx.accounts.user.key != ctx.accounts.voxel_account.owner {
            return Err(error!(MincError::UserNotVoxelOwner));
        }

        // Check account mint/nft mint
        if *ctx.accounts.voxel_mint.key != ctx.accounts.voxel_account.mint {
            return Err(error!(MincError::MintMismatch));
        }

        // Read metadata
        let metadata_seeds = &[
            mpl_token_metadata::state::PREFIX.as_bytes(),
            mpl_token_metadata::ID.as_ref(),
            ctx.accounts.voxel_mint.key.as_ref(),
        ];
        let (metadata_key, _metadata_bump_seed) =
            Pubkey::find_program_address(metadata_seeds, &mpl_token_metadata::ID);
        if *ctx.accounts.voxel_metadata.key != metadata_key {
            return Err(error!(MincError::InvalidMetadataKey));
        }

        let metadata: Metadata =
            mpl_token_metadata::state::Metadata::from_account_info(&ctx.accounts.voxel_metadata)?;

        // Check metadata mint
        if metadata.mint != ctx.accounts.voxel_account.mint {
            return Err(error!(MincError::MintMismatch));
        }

        // Check metadata creator
        // treasury from master == DAO and DAO is one of the creator
        // check creator match treasury + creator did signed
        let creator_signed = check_as_u32(&Checks::CreatorSigned);
        let test_creator_signed =
            (ctx.accounts.master_account.checks & creator_signed) == creator_signed;
        check_booster(
            test_creator_signed,
            &metadata,
            Some(ctx.accounts.master_account.treasury),
            Some(VOXEL_NFT_NAME.to_string()),
        )?;

        // Read plot size from metadata (Mortuary Inc Plot x2 #1254)
        // + check size set in the metadata name
        // + check incoming plot_size
        let char20 = metadata.data.name.chars().nth(19);
        let size: u8 = match char20 {
            Some('2') => 2,
            Some('4') => 4,
            Some('6') => 6,
            Some('8') => 8,
            Some('1') => 10,
            _ => 0,
        };

        if size == 0 || size != plot_size {
            if size == 0 {
                msg!("Wrong plot size: {} v {:?}", size, char20);
                return Err(error!(MincError::IncorrectPlotSize));
            }
            if size != plot_size {
                return Err(error!(MincError::PlotSizeMismatch));
            }
        }

        // All is good, create the burning facility
        ctx.accounts.voxel_burn_account.bump = bump;
        ctx.accounts.voxel_burn_account.mint = *ctx.accounts.voxel_mint.to_account_info().key;
        ctx.accounts.voxel_burn_account.master = *ctx.accounts.master_account.to_account_info().key;
        ctx.accounts.voxel_burn_account.last_burn = [0; 10];
        ctx.accounts.voxel_burn_account.share = 0; // not used
        ctx.accounts.voxel_burn_account.plot_size = size;

        Ok(())
    }

    //
    // DEPRECATED
    //
    pub fn do_voxel_burn2<'a, 'b, 'info>(
        _ctx: Context<'a, 'b, 'a, 'info, DoVoxelBurn2<'info>>,
        _flags: u32,
    ) -> Result<()> {
        msg!("Calling deprecated burn v2");
        Ok(())
    }

    //
    // What we need to check:
    // - master_account is linked to voxel_burn_account
    // - voxel_burn_account is linked to voxel_account
    // - ash receiver is voxel_account owner
    //
    pub fn do_voxel_burn3<'a, 'b, 'info>(
        ctx: Context<'a, 'b, 'a, 'info, DoVoxelBurn3<'info>>,
        _flags: u32,
    ) -> Result<()> {
        // -- 2 $ASH renter | 1 $ASH owner (public rented no boost)
        // -- 3 $ASH renter | 2 $ASH owner (public rented w/ boost)
        // -- 3 $ASH  (private no boost)
        // -- 5 $ASH  (private w/ boost)

        // anchor checks
        //     removed (constraint = voxel_account.owner == user.key())
        //     removed (constraint = ash_token_account.owner == voxel_account.owner)
        //     constraint = voxel_burn_account.mint == voxel_account.mint,
        //     constraint = voxel_burn_account.master == master_account.key(),
        //     has_one = master_account.bank = bank,
        //     has_one = master_account.treasury = treasury,

        let mut using_or_burning_booster = false;
        let mut ash_amount: u64 = ctx.accounts.master_account.ash_by_burn.into();
        let tax_setted: u64 = ctx.accounts.voxel_burn_account.share.into();
        let dyn_tax: u64 = i64_to_u64(ctx.accounts.master_account.go_live_date); // hook (use an old field to get the tax)
        if dyn_tax > 2 {
            return Err(error!(MincError::InvalidTaxAmount));
        }

        // Check burning is live
        let voxel_burn_lived = check_as_u32(&Checks::VoxelBurnLive);
        if (ctx.accounts.master_account.checks & voxel_burn_lived) != voxel_burn_lived {
            return Err(error!(MincError::BurnFacilityNotLive));
        }

        //
        // check NFT ownership
        let plot_owner = ctx.accounts.voxel_account.owner.key();
        let user = ctx.accounts.user.key();

        if tax_setted == 0 && plot_owner != user {
            return Err(error!(MincError::PlotSharingNotEnable));
        }

        //
        // nft check
        // - mint match
        // - owned by spl_token
        // - quantity = 1
        // - rent exempt
        check_nft(
            user,
            &ctx.accounts.nft_burn_account,
            ctx.accounts.nft_burn_mint.key(),
            &ctx.accounts.rent,
            true,
        )?;

        //
        // metadata check
        // - owned by metaplex
        // - mint match nft
        let has_metadata = check_as_u32(&Checks::HasMetadata);
        let test_metadata = (ctx.accounts.master_account.checks & has_metadata) == has_metadata;
        if test_metadata {
            check_metadata(
                &ctx.accounts.nft_burn_metadata,
                &ctx.accounts.nft_burn_mint.key(),
                &ctx.accounts.nft_burn_account,
            )?;
        }

        //
        // master edition check
        // - owned by metaplex
        // - max supply is locked
        // - master edition is the mint authority of the nft
        let has_master_edition = check_as_u32(&Checks::MasterEdition);
        let test_master_edition =
            (ctx.accounts.master_account.checks & has_master_edition) == has_master_edition;
        if test_master_edition {
            check_master_edition(&ctx.accounts.nft_burn_edition, &ctx.accounts.nft_burn_mint)?;
        }

        //
        // Find a free slot
        let mut slot_idx: Option<u8> = None;
        let timestamp_seconds = ctx
            .accounts
            .clock
            .unix_timestamp
            .checked_div(60)
            .expect("Unable to convert current time");
        let timestamp = timestamp_seconds as u32; // truncate, should be good until year 6055
        for idx in 0..ctx.accounts.voxel_burn_account.plot_size {
            let last_burn: u32 = ctx.accounts.voxel_burn_account.last_burn[idx as usize];
            let next_burn_date = last_burn
                .checked_add(ctx.accounts.master_account.burn_frequency)
                .expect("Unable to compute next burn date");
            if next_burn_date < timestamp {
                slot_idx = Some(idx);
                break;
            }
        }
        if slot_idx.is_none() {
            return Err(error!(MincError::DailyBurnConsumed));
        }

        let mut remaining_accounts_counter: usize = 0;
        let mut tax_account: Option<AccountInfo> = None;
        let mut collection_account: Option<AccountInfo> = None;

        // Check sharing
        // ie: share > 0 && user != plot_owner
        if ctx.accounts.voxel_burn_account.share > 0 && plot_owner != user {
            if ctx.remaining_accounts.len() > remaining_accounts_counter {
                let tax_account_info = &ctx.remaining_accounts[remaining_accounts_counter];
                tax_account = Some(tax_account_info.clone());
                remaining_accounts_counter += 1;
            } else {
                return Err(error!(MincError::TaxAccountNotProvided));
            }
        }

        if tax_account.is_some() {
            let mut data: &[u8] = &tax_account.as_ref().unwrap().try_borrow_data()?;
            let tax_token_account = TokenAccount::try_deserialize_unchecked(&mut data)?;
            let tax_account_owner = &tax_token_account.owner;
            if plot_owner != *tax_account_owner {
                return Err(error!(MincError::VoxelNftNotOwnedByCollector));
            }
        } else {
            let ash_account_owner = &ctx.accounts.ash_token_account.owner;
            if plot_owner != *ash_account_owner {
                return Err(error!(MincError::VoxelNftNotOwnedByUser));
            }
        }

        // Get verified collection account
        let metadata: Metadata = mpl_token_metadata::state::Metadata::from_account_info(
            &ctx.accounts.nft_burn_metadata,
        )?;
        if metadata.collection.is_some() && metadata.collection.as_ref().unwrap().verified {
            if ctx.remaining_accounts.len() > remaining_accounts_counter {
                let collection_account_info = &ctx.remaining_accounts[remaining_accounts_counter];
                collection_account = Some(collection_account_info.clone());
                remaining_accounts_counter += 1;
            } else {
                return Err(error!(MincError::CollectionAccountNotProvided));
            }
        }

        // Check sharing
        // ie: share > 0 && user != plot_owner
        if ctx.accounts.voxel_burn_account.share > 0 && plot_owner != user && tax_account.is_none()
        {
            return Err(error!(MincError::TaxAccountNotProvided));
        }

        // Check for booster
        if ctx.remaining_accounts.len() >= (remaining_accounts_counter + 3) {
            let booster_account = &ctx.remaining_accounts[remaining_accounts_counter];
            remaining_accounts_counter += 1;
            let booster_nft_account = &ctx.remaining_accounts[remaining_accounts_counter];
            remaining_accounts_counter += 1;
            let booster_metadata_account = &ctx.remaining_accounts[remaining_accounts_counter];
            // remaining_accounts_counter += 1;

            let mut booster_data: &[u8] = &booster_account.try_borrow_data()?;
            let booster = BoosterAccount::try_deserialize(&mut booster_data)?;

            let mut booster_nft_data: &[u8] = &booster_nft_account.try_borrow_data()?;
            let booster_nft = TokenAccount::try_deserialize_unchecked(&mut booster_nft_data)?;

            let booster_metadata =
                mpl_token_metadata::state::Metadata::from_account_info(booster_metadata_account)?;

            assert_owned_by(booster_account, ctx.program_id, MincError::NotMincAccount)?;

            // booster is owned plot_owner
            check_nft_light(plot_owner, &booster_nft, booster_nft_account)?;

            // check booster metadata
            let mut name = None;
            if booster.name.is_some() {
                let trimed: &[u8] = &booster.name.unwrap();
                let trimed = std::str::from_utf8(trimed).unwrap();
                name = Some(trimed.trim().to_string());
            }

            check_booster(
                booster.check_signed,
                &booster_metadata,
                booster.creator,
                name,
            )?;

            using_or_burning_booster = true;

            // yeppeeee
            if booster.ash_if_burn > 0
                && ctx.accounts.nft_burn_account.key() == booster_nft_account.key()
            {
                // user is burning a Minion, snif
                ash_amount = booster.ash_if_burn.into();
            } else {
                ash_amount = ash_amount.saturating_add(booster.ash_by_burn.into());
            }
        }

        // We have a free plot, save burn date
        ctx.accounts.voxel_burn_account.last_burn[slot_idx.unwrap() as usize] = timestamp;

        //
        // Burn NFT and close account to recover some funds
        burn_nft_full(
            ctx.accounts.nft_burn_mint.to_account_info(),
            ctx.accounts.nft_burn_account.to_account_info(),
            ctx.accounts.user.clone(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.nft_burn_metadata.to_account_info(),
            ctx.accounts.nft_burn_edition.to_account_info(),
            collection_account,
        )?;

        if tax_account.is_some() {
            // no more taxt adjustment, 2 if booster, else 1
            let tax;
            if using_or_burning_booster {
                tax = dyn_tax * 2;
            } else {
                tax = dyn_tax;
            }

            ash_amount = ash_amount.saturating_sub(tax);

            // pay the tax
            send_back_ash(
                tax,
                ctx.program_id,
                PDA_SEED,
                ctx.accounts.bank.to_account_info(),
                tax_account.unwrap(),
                ctx.accounts.pda_account.clone(),
                ctx.accounts.token_program.to_account_info(),
            )?;
        }

        //
        // Send back some free $ASH
        //
        send_back_ash(
            ash_amount,
            ctx.program_id,
            PDA_SEED,
            ctx.accounts.bank.to_account_info(),
            ctx.accounts.ash_token_account.to_account_info(),
            ctx.accounts.pda_account.clone(),
            ctx.accounts.token_program.to_account_info(),
        )?;

        Ok(())
    }

    pub fn set_voxel_burn_tax(ctx: Context<SetVoxelBurnTax>, _bump: u8, tax: u8) -> Result<()> {
        msg!("Set burn tax");

        // Check user own the nft
        if *ctx.accounts.user.key != ctx.accounts.voxel_account.owner {
            return Err(error!(MincError::UserNotVoxelOwner));
        }
        // Check account mint/nft mint
        if *ctx.accounts.voxel_mint.key != ctx.accounts.voxel_account.mint {
            return Err(error!(MincError::MintMismatch));
        }

        let t = match tax {
            0..=8 => tax,
            _ => 8,
        };

        ctx.accounts.voxel_burn_account.share = t;

        Ok(())
    }

    //
    //
    // BOOSTER
    //
    //

    pub fn create_booster(ctx: Context<CreateBooster>) -> Result<()> {
        msg!("Create booster");

        ctx.accounts.booster.initializer = *ctx.accounts.initializer.key;
        ctx.accounts.booster.version = 0;
        ctx.accounts.booster.id = 0;
        ctx.accounts.booster.creator = None;
        ctx.accounts.booster.name = None;
        ctx.accounts.booster.ash_multiplicator = 0;
        ctx.accounts.booster.ash_by_burn = 0;
        ctx.accounts.booster.ash_if_burn = 0;
        ctx.accounts.booster.check_signed = false;
        ctx.accounts.booster.reserved0 = 0;
        ctx.accounts.booster.reserved1 = 0;

        Ok(())
    }

    pub fn update_booster(
        ctx: Context<UpdateBooster>,
        id: Option<u8>,
        creator: Option<Pubkey>,
        name: Option<String>,
        ash_multiplicator: Option<u8>,
        ash_by_burn: Option<u32>,
        ash_if_burn: Option<u32>,
        check_signed: Option<bool>,
    ) -> Result<()> {
        msg!("Update booster");

        let booster = &mut ctx.accounts.booster;
        if let Some(v) = id {
            booster.id = v;
        }
        if let Some(v) = creator {
            booster.creator = Some(v);
        }
        if let Some(v) = name {
            let given_name = v.as_bytes();
            let mut name = [32; 32]; // 32 space (space == 32)
            name[..given_name.len()].copy_from_slice(given_name);
            booster.name = Some(name);
        }
        if let Some(v) = ash_multiplicator {
            booster.ash_multiplicator = v;
        }
        if let Some(v) = ash_by_burn {
            booster.ash_by_burn = v;
        }
        if let Some(v) = ash_if_burn {
            booster.ash_if_burn = v;
        }
        if let Some(v) = check_signed {
            booster.check_signed = v;
        }

        Ok(())
    }
}

#[derive(Copy, Clone)]
pub enum Checks {
    HasMetadata = 1,
    BurnFacilityLive = 2,
    VoxelBurnLive = 4,
    CreatorSigned = 8,
    MasterEdition = 16,
}

fn check_as_u32(c: &Checks) -> u32 {
    *c as u32
}

fn i64_to_u64(v: i64) -> u64 {
    match v >= 0 {
        true => From::from(v as u64),
        false => {
            panic!("Unsigned integer can't be created from negative value");
        }
    }
}

#[derive(Copy, Clone)]
pub enum ExtraAccount {
    TaxOwner = 1,
    Booster = 2,
}

