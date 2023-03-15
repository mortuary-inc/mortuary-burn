use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use mpl_token_metadata::state::{Metadata,TokenMetadataAccount};
use crate::error::{MincError};

pub fn check_metadata(
    metadata: &AccountInfo,
    nft_mint: &Pubkey,
    nft_account: &Account<TokenAccount>,
) -> Result<()> {
    assert_owned_by(
        metadata,
        &mpl_token_metadata::ID,
        MincError::NotMetaplexMetadata,
    )?;
    let metadata_seeds = &[
        mpl_token_metadata::state::PREFIX.as_bytes(),
        mpl_token_metadata::ID.as_ref(),
        nft_mint.as_ref(),
    ];
    let (metadata_key, _metadata_bump_seed) =
        Pubkey::find_program_address(metadata_seeds, &mpl_token_metadata::ID);
    if metadata.key != &metadata_key {
        return Err(error!(MincError::InvalidMetadataKey));
    }
    let metadata : Metadata = mpl_token_metadata::state::Metadata::from_account_info(metadata)?;
    if metadata.mint != nft_account.mint {
        return Err(error!(MincError::MintMismatch));
    }
    Ok(())
}

pub fn check_nft(
    user: Pubkey,
    nft_account: &Account<TokenAccount>,
    mint: Pubkey,
    rent: &Sysvar<Rent>,
    is_burned_nft: bool,
) -> Result<()> {
    let nft_account_info = nft_account.to_account_info();
    msg!("Checking we are ready to burn {}", nft_account_info.key);
    assert_owned_by(&nft_account_info, &spl_token::id(), MincError::NotSplToken)?;
    if nft_account.owner != user {
        if is_burned_nft {
            return Err(error!(MincError::BurnedNftNotOwnedByUser));
        } else {
            return Err(error!(MincError::VoxelNftNotOwnedByUser));
        }
    }
    if nft_account.mint != mint {
        return Err(error!(MincError::MintMismatch));
    }
    if nft_account.amount != 1 {
        return Err(error!(MincError::IncorrectTokenQuantity));
    }
    if !rent.is_exempt(nft_account_info.lamports(), nft_account_info.data_len()) {
        return Err(error!(MincError::NotRentExempt));
    }
    Ok(())
}

pub fn check_nft_light(
    user: Pubkey,
    nft_account: &TokenAccount,
    nft_account_info: &AccountInfo,
) -> Result<()> {
    assert_owned_by(nft_account_info, &spl_token::id(), MincError::NotSplToken)?;
    if nft_account.owner != user {
        return Err(error!(MincError::BoosterNftNotOwnedByUser));
    }
    if nft_account.amount != 1 {
        return Err(error!(MincError::IncorrectTokenQuantity));
    }
    Ok(())
}

pub fn check_master_edition(
    master_edition: &AccountInfo,
    nft_mint: &Account<Mint>,
) -> Result<()> {
    assert_owned_by(
        master_edition,
        &mpl_token_metadata::ID,
        MincError::NotMetaplexEdition,
    )?;

    let nft_mint_key = nft_mint.key();
    let edition_seeds = &[
        mpl_token_metadata::state::PREFIX.as_bytes(),
        mpl_token_metadata::ID.as_ref(),
        nft_mint_key.as_ref(),
        mpl_token_metadata::state::EDITION.as_bytes(),
    ];
    let (edition_key, _) =
        Pubkey::find_program_address(edition_seeds, &mpl_token_metadata::ID);
    if master_edition.key != &edition_key {
        return Err(error!(MincError::InvalidEditionKey));
    }

    let edition = mpl_token_metadata::state::get_master_edition(master_edition);
    if edition.is_err() {
        return Err(error!(MincError::MasterEditionInvalid));
    }
    // let max_supply = edition.max_supply().unwrap_or(100);
    // if max_supply > 1 {
    //     return Err(ErrorCode::InvalidEditionMaxSupply.into());
    // }
    if nft_mint.mint_authority.is_some() && nft_mint.mint_authority.unwrap() != *master_edition.key
    {
        return Err(error!(MincError::MasterEditionIsNotTheMintAuthority));
    }

    Ok(())
}

pub fn assert_owned_by(account: &AccountInfo, owner: &Pubkey, error: MincError) -> Result<()> {
    if account.owner != owner {
        Err(error.into())
    } else {
        Ok(())
    }
}

//
// Use to check funeral plot first (but later used to identify a booster also)
//
pub fn check_booster(
    test_creator_signed: bool,
    metadata: &mpl_token_metadata::state::Metadata,
    creator_key: Option<Pubkey>,
    name: Option<String>,
) -> Result<()> {
    if creator_key.is_some() {
        // Check creator pubkey
        let ck = creator_key.unwrap();
        let creators = &metadata.data.creators;
        if creators.is_none() {
            return Err(error!(MincError::IncorrectCreator));
        } else {
            let find = creators.as_ref().unwrap().iter().find(|&c| {
                if c.address != ck {
                    return false;
                }
                if test_creator_signed && c.verified == false {
                    return false;
                }
                return true;
            });
            if find.is_none() {
                return Err(error!(MincError::IncorrectCreator));
            }
        }
    }

    if name.is_some() {
        // Check name (to not clash with others NFT we may launch)
        if !metadata.data.name.contains(&name.unwrap()) {
            return Err(error!(MincError::NotABooster));
        }
    }

    Ok(())
}
