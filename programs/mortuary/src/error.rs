use anchor_lang::prelude::*;

//
// Error
//

#[error_code]
pub enum MincError {
    #[msg("Burn facility is not live yet")]
    BurnFacilityNotLive,
    #[msg("Treasury out of $ASH")]
    TreasuryOutOfAsh,
    #[msg("Wrong master account")]
    WrongMasterAccount,
    #[msg("Wrong bank account")]
    WrongBankAccount,
    #[msg("Burn rate limit exceeded")]
    DailyBurnConsumed,
    #[msg("Numerical overflow error!")]
    NumericalOverflowError,
    #[msg("Metadata's key does not match")]
    InvalidMetadataKey,
    #[msg("Mint given does not match mint on Metadata")]
    MintMismatch,
    #[msg("Incorrect account owner")]
    IncorrectOwner,
    #[msg("Incorrect token quantity")]
    IncorrectTokenQuantity,

    // 310
    #[msg("Incorrect creator")]
    IncorrectCreator,
    #[msg("Incorrect plot size")]
    IncorrectPlotSize,
    #[msg("Plot size mismatch")]
    PlotSizeMismatch,
    #[msg("Not a booster")]
    NotABooster,

    #[msg("Ash token owner not matching plot owner")]
    AshTokenOwnerNotMatchingPlotOwner,
    #[msg("User is not the voxel owner")]
    UserNotVoxelOwner,
    #[msg("Voxel NFT is not owned by user")]
    VoxelNftNotOwnedByUser,
    #[msg("Burned NFT is not owned by user")]
    BurnedNftNotOwnedByUser,
    #[msg("Booster NFT is not owned by user")]
    BoosterNftNotOwnedByUser,

    #[msg("Not a spl-token")]
    NotSplToken,
    #[msg("Not a metaplex metadata")]
    NotMetaplexMetadata,

    // 320
    #[msg("Not Mortuary-inc data")]
    NotMincAccount,
    #[msg("Tax account not provided")]
    TaxAccountNotProvided,
    #[msg("Plot sharing is not enable")]
    PlotSharingNotEnable,
    #[msg("Not a metaplex edition")]
    NotMetaplexEdition,
    #[msg("Edition's key does not match")]
    InvalidEditionKey,
    #[msg("Invalid edition max supply")]
    InvalidEditionMaxSupply,
    #[msg("Master edition is not the mint authority")]
    MasterEditionIsNotTheMintAuthority,
    #[msg("Master edition invalid")]
    MasterEditionInvalid,
    #[msg("Not Rent Exempt")]
    NotRentExempt,
    #[msg("Collection account not provided")]
    CollectionAccountNotProvided,
    #[msg("Tax amount invalid")]
    InvalidTaxAmount,
    
    #[msg("Burn not open")]
    BurnNotOpen,
    #[msg("Burn close")]
    BurnClose,
    #[msg("Voxel NFT is not owned by collector")]
    VoxelNftNotOwnedByCollector,
}
