use anchor_lang::{prelude::*, solana_program};

pub fn burn_nft_full<'a>(
    nft_mint: AccountInfo<'a>,
    nft_account: AccountInfo<'a>,
    nft_owner: AccountInfo<'a>,
    rent_treasury: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
    nft_metadata: AccountInfo<'a>,
    nft_edition: AccountInfo<'a>,
    nft_collection: Option<AccountInfo<'a>>,
) -> Result<()> {
    let lamport_per_signature = 5000;
    let total_lamports = nft_account.lamports() + nft_metadata.lamports() + nft_edition.lamports();
    let to_treasury = total_lamports - lamport_per_signature;

    let mut accounts = Vec::new();
    accounts.push(nft_metadata.clone());
    accounts.push(nft_owner.clone());
    accounts.push(nft_mint.clone());
    accounts.push(nft_account.clone());
    accounts.push(nft_edition.clone());
    accounts.push(token_program.clone());

    let mut collection_key = None;
    if nft_collection.is_some() {
        let c = nft_collection.unwrap();
        collection_key = Some(c.key());
        accounts.push(c);
    }

    let ix = &mpl_token_metadata::instruction::burn_nft(
        mpl_token_metadata::ID,
        nft_metadata.key(),
        nft_owner.key(),
        nft_mint.key(),
        nft_account.key(),
        nft_edition.key(),
        token_program.key(),
        collection_key,
    );

    solana_program::program::invoke(ix, &accounts)?;

    // transfer the rent from user to treasury
    solana_program::program::invoke(
        &solana_program::system_instruction::transfer(
            &nft_owner.key(),
            &rent_treasury.key(),
            to_treasury,
        ),
        &[nft_owner.clone(), rent_treasury.clone()],
    )?;

    Ok(())
}

pub fn send_back_ash<'a>(
    ash_amount: u64,
    program_id: &Pubkey,
    pda_seed: &[u8],
    bank_account: AccountInfo<'a>,
    ash_account: AccountInfo<'a>,
    pda: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
) -> Result<()> {
    let (_pda, bump_seed) = Pubkey::find_program_address(&[pda_seed], program_id);
    let seeds = &[&pda_seed[..], &[bump_seed]];

    let transfer_ix = spl_token::instruction::transfer(
        &spl_token::ID,
        bank_account.key,
        ash_account.key,
        pda.key,
        &[],
        ash_amount,
    )?;
    solana_program::program::invoke_signed(
        &transfer_ix,
        &[bank_account, ash_account, pda, token_program],
        &[&seeds[..]],
    )?;

    Ok(())
}
