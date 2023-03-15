import { Nft } from '@metaplex-foundation/js';
import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { SystemProgram } from '@solana/web3.js';
import * as assert from 'assert';
import log from 'loglevel';
import { Mortuary } from "../target/types/mortuary";
import { creator1, TOKEN_METADATA_PROGRAM_ID, user1 } from './accounts';
import { airDrop, buyRuggedNft, buyRuggedNftVerifiedCollection, createAshTokenAccount, createNftCollection, createVerifiedNftCollection, initializeVoxelBurn, setTestHelperGlobals, setVerifiedCollection } from './helper';
import { createAsh, createBank, createMaster, createTreasury, disableLogging, restoreLogging } from './mortuaryHelper';
import { createMetaplexNftFull } from './nftcreator';



describe("v3burn", () => {

    log.setLevel(log.levels.INFO);

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Mortuary as Program<Mortuary>;
    const connection = provider.connection;
    const admin = web3.Keypair.generate();
    const pinpin = web3.Keypair.generate();
    const coyotte = web3.Keypair.generate();
    let treasury: web3.Keypair;

    let bankAccountPubkey: web3.PublicKey;
    let treasuryAccountPubkey: web3.PublicKey;
    let masterAccountPubkey: web3.PublicKey;
    let pdaAccountPubkey: web3.PublicKey;
    let ashMintPubkey: web3.PublicKey;

    let boosterPubkey: web3.PublicKey;

    let solchicks: { mint: anchor.web3.PublicKey; }[]; // nft collection 1
    let verifiedCollection: Nft;

    it('Initialize', async () => {

        // Give admin some SOL
        await Promise.all([
            airDrop(connection, provider.wallet.publicKey, 2),
            airDrop(connection, admin.publicKey, 2),
            airDrop(connection, creator1.publicKey, 2),
            airDrop(connection, user1.publicKey, 2),
            airDrop(connection, coyotte.publicKey, 2),
        ]);

        treasury = await createTreasury(connection, admin);
        treasuryAccountPubkey = treasury.publicKey;

        await airDrop(connection, treasury.publicKey, 2);

        let ashMintToken = await createAsh(connection, admin, 1_500_000);
        ashMintPubkey = ashMintToken.publicKey;

        let adminAshAccountInfo = await ashMintToken.getOrCreateAssociatedAccountInfo(admin.publicKey);
        log.debug(`Admin $ASH account ${adminAshAccountInfo.address} balance: ${adminAshAccountInfo.amount}`);
        assert.equal(adminAshAccountInfo.amount, 1_500_000);

        const {
            bankKeypair,
            createBankAccountIx,
            initBankAccountIx,
            transferAshToBankAccIx
        } = await createBank(connection, admin, adminAshAccountInfo, 1_500_000);
        bankAccountPubkey = bankKeypair.publicKey;

        const { masterAccount, pda } = await createMaster(program, admin, bankKeypair, treasuryAccountPubkey, [createBankAccountIx, initBankAccountIx, transferAshToBankAccIx]);
        masterAccountPubkey = masterAccount;
        pdaAccountPubkey = pda;

        let goLiveDate = 1;
        await program.rpc.updateMaster(new anchor.BN(goLiveDate), null, new anchor.BN(3), null, {
            accounts: {
                initializer: admin.publicKey,
                masterAccount: masterAccountPubkey,
            },
            signers: [admin],
        });

        // Create an nft collection
        log.debug(`Creating nft collection to burn`);
        console.log("Create collection 1");
        solchicks = await createNftCollection(connection, creator1, "solchicks", 20);
        console.log("Create collection 2");
        let { nfts: nfts0, collection: collection0 } = await createVerifiedNftCollection(connection, creator1, "sv", 5);

        setTestHelperGlobals(
            program,
            connection,
            admin,
            treasury,
            pinpin,
            masterAccountPubkey,
            ashMintPubkey,
            solchicks
        );
        setVerifiedCollection(nfts0);
        verifiedCollection = collection0;
    });

    it('Create a booster', async () => {
        let booster = web3.Keypair.generate();
        boosterPubkey = booster.publicKey;

        // Create a booster
        await program.rpc.createBooster(
            {
                accounts: {
                    booster: boosterPubkey,
                    masterAccount: masterAccountPubkey,
                    initializer: admin.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                signers: [admin, booster],
            }
        );

        // Update the booster to have data
        await program.rpc.updateBooster(
            1, coyotte.publicKey, "Minion", null, 2, 100, true,
            {
                accounts: {
                    booster: boosterPubkey,
                    initializer: admin.publicKey,
                },
                signers: [admin],
            }
        );

    });

    it('Simple burn', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 2);
        let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user.publicKey);
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);

        // Check rugged nft supply
        let nftCount = await connection.getTokenSupply(ruggedNftTokenAccount.mint);
        assert.equal(nftCount.value.uiAmount, 1);

        // Check treasury balance
        let treasurySolBalanceBefore = await connection.getBalance(treasuryAccountPubkey);

        // User ash balance
        let a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);

        // Start the burn process
        await program.rpc.doVoxelBurn3(0,
            {
                accounts: {
                    user: user.publicKey,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelAccount: voxelAccount,
                    masterAccount: masterAccountPubkey,
                    bank: bankAccountPubkey,
                    treasury: treasuryAccountPubkey,
                    pdaAccount: pdaAccountPubkey,
                    nftBurnAccount: ruggedNftTokenAccount.address,
                    nftBurnMint: ruggedNftTokenAccount.mint,
                    nftBurnEdition: ruggedNftEdition,
                    nftBurnMetadata: ruggedNftMetadata,
                    ashTokenAccount: ashTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                signers: [user],
            }
        );

        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 3);

        nftCount = await connection.getTokenSupply(ruggedNftTokenAccount.mint);
        assert.equal(nftCount.value.uiAmount, 0);

        let treasurySolBalanceAfter = await connection.getBalance(treasuryAccountPubkey);
        assert.ok(treasurySolBalanceAfter > treasurySolBalanceBefore);
    });


    it.skip('Try burn an NFT with many supply', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create NFT with max supply > 1
        let badNft = await createMetaplexNftFull(connection, creator1, [creator1.publicKey], 0, "mint100", "MINT100", { maxSupply: 10, collectionKey: null });
        solchicks.push(badNft);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 2);
        let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user.publicKey);
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);

        // Check rugged nft supply
        let nftCount = await connection.getTokenSupply(ruggedNftTokenAccount.mint);
        assert.equal(nftCount.value.uiAmount, 1);

        // User ash balance
        let a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);

        let loggers = disableLogging();
        try {
            // Start the burn process
            await program.rpc.doVoxelBurn3(0,
                {
                    accounts: {
                        user: user.publicKey,
                        voxelBurnAccount: voxelBurnAccount,
                        voxelAccount: voxelAccount,
                        masterAccount: masterAccountPubkey,
                        bank: bankAccountPubkey,
                        treasury: treasuryAccountPubkey,
                        pdaAccount: pdaAccountPubkey,
                        nftBurnAccount: ruggedNftTokenAccount.address,
                        nftBurnMint: ruggedNftTokenAccount.mint,
                        nftBurnEdition: ruggedNftEdition,
                        nftBurnMetadata: ruggedNftMetadata,
                        ashTokenAccount: ashTokenAccount,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        clock: web3.SYSVAR_CLOCK_PUBKEY,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                        systemProgram: web3.SystemProgram.programId,
                        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                    },
                    signers: [user],
                }
            );
            assert.ok(false);
        } catch (e) {
            assert.equal(e.error.errorMessage, "Invalid edition max supply");
        }
        restoreLogging(loggers);

        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);
    });


    it('Burn from verified collection', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 2);
        let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNftVerifiedCollection(user.publicKey);
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);

        // Check rugged nft supply
        let nftCount = await connection.getTokenSupply(ruggedNftTokenAccount.mint);
        assert.equal(nftCount.value.uiAmount, 1);

        // Check treasury balance
        let treasurySolBalanceBefore = await connection.getBalance(treasuryAccountPubkey);

        // User ash balance
        let a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);

        let loggers = disableLogging();
        try {
            await program.rpc.doVoxelBurn3(0,
                {
                    accounts: {
                        user: user.publicKey,
                        voxelBurnAccount: voxelBurnAccount,
                        voxelAccount: voxelAccount,
                        masterAccount: masterAccountPubkey,
                        bank: bankAccountPubkey,
                        treasury: treasuryAccountPubkey,
                        pdaAccount: pdaAccountPubkey,
                        nftBurnAccount: ruggedNftTokenAccount.address,
                        nftBurnMint: ruggedNftTokenAccount.mint,
                        nftBurnEdition: ruggedNftEdition,
                        nftBurnMetadata: ruggedNftMetadata,
                        ashTokenAccount: ashTokenAccount,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        clock: web3.SYSVAR_CLOCK_PUBKEY,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                        systemProgram: web3.SystemProgram.programId,
                        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                    },
                    signers: [user],
                }
            );
            assert.ok(false);
        } catch (e) {
            console.log(e.error.errorMessage);
            assert.equal(e.error.errorMessage, "Collection account not provided");
        }

        restoreLogging(loggers);

        // burn by providing the collection account
        await program.rpc.doVoxelBurn3(0,
            {
                accounts: {
                    user: user.publicKey,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelAccount: voxelAccount,
                    masterAccount: masterAccountPubkey,
                    bank: bankAccountPubkey,
                    treasury: treasuryAccountPubkey,
                    pdaAccount: pdaAccountPubkey,
                    nftBurnAccount: ruggedNftTokenAccount.address,
                    nftBurnMint: ruggedNftTokenAccount.mint,
                    nftBurnEdition: ruggedNftEdition,
                    nftBurnMetadata: ruggedNftMetadata,
                    ashTokenAccount: ashTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                signers: [user],
                remainingAccounts: [
                    { pubkey: verifiedCollection.metadataAddress, isSigner: false, isWritable: true }
                ],
                options: {
                    skipPreflight: true,
                }
            }
        );


        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 3);

        nftCount = await connection.getTokenSupply(ruggedNftTokenAccount.mint);
        assert.equal(nftCount.value.uiAmount, 0);

        let treasurySolBalanceAfter = await connection.getBalance(treasuryAccountPubkey);
        assert.ok(treasurySolBalanceAfter > treasurySolBalanceBefore);
    });

    it('Check plot owner adn tax collector', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        const user2 = web3.Keypair.generate();
        await airDrop(connection, user2.publicKey, 1);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount, voxelBurnBump, voxelMint } = await initializeVoxelBurn(user, 2);
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);

        let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNftVerifiedCollection(user2.publicKey);

        // User ash balance
        let a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);

        let { ashToken: user2AshToken, ashTokenAccount: user2AshTokenAccount } = await createAshTokenAccount(user2);
        let a2 = await user2AshToken.getAccountInfo(user2AshTokenAccount);
        assert.equal(a2.amount, 0);

        let tax = 1;
        await program.rpc.setVoxelBurnTax(voxelBurnBump, tax,
            {
                accounts: {
                    user: user.publicKey,
                    voxelAccount: voxelAccount,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelMint: voxelMint,
                },
                signers: [user]
            });

        let loggers = disableLogging();
        try {
            await program.rpc.doVoxelBurn3(0,
                {
                    accounts: {
                        user: user2.publicKey,
                        voxelBurnAccount: voxelBurnAccount,
                        voxelAccount: voxelAccount,
                        masterAccount: masterAccountPubkey,
                        bank: bankAccountPubkey,
                        treasury: treasuryAccountPubkey,
                        pdaAccount: pdaAccountPubkey,
                        nftBurnAccount: ruggedNftTokenAccount.address,
                        nftBurnMint: ruggedNftTokenAccount.mint,
                        nftBurnEdition: ruggedNftEdition,
                        nftBurnMetadata: ruggedNftMetadata,
                        ashTokenAccount: user2AshTokenAccount,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        clock: web3.SYSVAR_CLOCK_PUBKEY,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                        systemProgram: web3.SystemProgram.programId,
                        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                    },
                    signers: [user2],
                }
            );
            assert.ok(false, "should not go here");
        } catch (e) {
            console.log(e);
            console.log(e?.error?.errorMessage);
            assert.equal(e.error.errorMessage, "Tax account not provided");
        }


        try {
            await program.rpc.doVoxelBurn3(0,
                {
                    accounts: {
                        user: user2.publicKey,
                        voxelBurnAccount: voxelBurnAccount,
                        voxelAccount: voxelAccount,
                        masterAccount: masterAccountPubkey,
                        bank: bankAccountPubkey,
                        treasury: treasuryAccountPubkey,
                        pdaAccount: pdaAccountPubkey,
                        nftBurnAccount: ruggedNftTokenAccount.address,
                        nftBurnMint: ruggedNftTokenAccount.mint,
                        nftBurnMetadata: ruggedNftMetadata,
                        nftBurnEdition: ruggedNftEdition,
                        ashTokenAccount: user2AshTokenAccount,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        clock: web3.SYSVAR_CLOCK_PUBKEY,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                        systemProgram: web3.SystemProgram.programId,
                        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                    },
                    remainingAccounts: [
                        { pubkey: user2AshTokenAccount, isSigner: false, isWritable: true },
                        { pubkey: verifiedCollection.metadataAddress, isSigner: false, isWritable: true }
                    ],
                    signers: [user2],
                }
            );
            assert.ok(false, "should not go here");
        } catch (e) {
            console.log(e);
            console.log(e?.error?.errorMessage);
            assert.equal(e.error.errorMessage, "Voxel NFT is not owned by collector");
        }

        await program.rpc.doVoxelBurn3(0,
            {
                accounts: {
                    user: user2.publicKey,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelAccount: voxelAccount,
                    masterAccount: masterAccountPubkey,
                    bank: bankAccountPubkey,
                    treasury: treasuryAccountPubkey,
                    pdaAccount: pdaAccountPubkey,
                    nftBurnAccount: ruggedNftTokenAccount.address,
                    nftBurnMint: ruggedNftTokenAccount.mint,
                    nftBurnMetadata: ruggedNftMetadata,
                    nftBurnEdition: ruggedNftEdition,
                    ashTokenAccount: user2AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: ashTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: verifiedCollection.metadataAddress, isSigner: false, isWritable: true }
                ],
                signers: [user2],
            }
        );

        restoreLogging(loggers);
    });

});
