# Mortuary Inc burn program

Solana on-chain program that allow a user to burn a NFT against a fixed amount of $ASH (spl-token).

In order to use the service, the user must:
- owned a plot (Mortuary Inc voxel NFT collection)
- burn an NFT implementing the metaplex protocol
- eventually use a `booster` to get more spl-token

Burning is limited by the plot capacity. 

# Accounts

## Master acccount

The master account is created once by a project owner, it holds:
- initializer: Pubkey of the owner
- bank: Account that hold the ASH and is controlled by the program
- treasury: Account that get the rent released after a burn
- burn_frequency: in seconds, for how long a plot slot if locked after a burn
- ash_by_burn: ASH to be sent to the user after a succesfull burn
- checks: bit flag to turn on/off specific functionnalities of the burn contract (like checking master editon, checking burning is live, etc)

## VoxelBurnAccount

To be initialized by the project owner (or each user), for each plot of the collection. It's use to check the state of the plot. It holds mostly:
- mint: mint of the plot
- master: master account
- last_burn: last burn date for each slot of the plot
- share: in case the plot owner marked his plot as public, amount of the "tax" if the plot is used by someone else (no more use)
- plot_size: the plot capacity (ie: 2, 4, 6, 8, or 10)

## BoosterAccount

Booster are created by the project owner. It is used to add specific rules if the user hold (or burn) one of this booster.
To use a booster, the user must hold an NFT matching the booster criteria (name and/or creator).
Fields:
- creator: the pubkey of a (verified) creator, it can be the Candy Machine that issue a specific collection
- name: name of the NFT to match partially
- ash_by_burn: Additional ASH to be send, if the user owned an NFT that match the booster
- ash_if_burn: ASH to be send if an NFT matching the booster criteria is burn

# Build
```
anchor build
```

# Test

To test against a local validator:
```
solana-test-validator -r -u mainnet-beta -c metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s -c p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98 -c PwDiXFxQsGra4sFFTT8r1QWRMd4vfumiWC1jfWNfdYT -c cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ -c cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ
anchor deploy --provider.cluster localnet
anchor test --skip-local-validator
```

