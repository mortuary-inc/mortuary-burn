import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { SystemProgram } from '@solana/web3.js';
import * as assert from 'assert';
import log from 'loglevel';
import { Mortuary } from "../target/types/mortuary";
import { creator1, getMasterEditionAddress, getMetadataAddress, getVoxelBurnAddress, TOKEN_METADATA_PROGRAM_ID, user1 } from './accounts';
import { airDrop, buyRuggedNft, createAshTokenAccount, createMortuaryVoxelNft, createNftCollection, createNonMetaplexNft, initBurnAccount, initializeVoxelBurn, setTestHelperGlobals, transferNft, updateChecks } from './helper';
import { computeNextBurnDate, createAsh, createBank, createMaster, createTreasury, disableLogging, restoreLogging, VoxelBurnAccount } from './mortuaryHelper';
import { createMetaplexNftFull } from './nftcreator';



describe("v2burn", () => {

    log.setLevel(log.levels.INFO);

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Mortuary as Program<Mortuary>;
    const connection = provider.connection;
    const admin = web3.Keypair.generate();
    const pinpin = web3.Keypair.generate();
    let treasury: web3.Keypair;

    let bankAccountPubkey: web3.PublicKey;
    let treasuryAccountPubkey: web3.PublicKey;
    let masterAccountPubkey: web3.PublicKey;
    let pdaAccountPubkey: web3.PublicKey;
    let ashMintPubkey: web3.PublicKey;

    let solchicks: { mint: anchor.web3.PublicKey; }[]; // nft collection 1

    log.debug(`Connecting to ${connection["_rpcEndpoint"]}`);
    log.debug(`Admin: ${admin.publicKey}`);

    it('Initialize', async () => {

        // Give admin some SOL
        await airDrop(connection, provider.wallet.publicKey, 2);
        await airDrop(connection, admin.publicKey, 2);
        await airDrop(connection, creator1.publicKey, 2);
        await airDrop(connection, user1.publicKey, 2);

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

        let data = await program.account.mortuaryMasterAccount.fetch(masterAccountPubkey);
        assert.equal(data.goLiveDate, 1);

        // Create an nft collection
        log.debug(`Creating nft collection to burn`);
        solchicks = await createNftCollection(connection, creator1, "solchicks", 20);
        // solchicks.forEach((s, idx) => {
        //     log.debug(`NFT item ${idx}: ${s.mint}`);
        // });

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
    });


    it('Create a burn plot', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);
        const hacker = web3.Keypair.generate();
        await airDrop(connection, hacker.publicKey, 1);

        // Create a valid voxel NFT
        {
            let plotSize = 2;
            let { mint: voxelMint, mintAccount: voxelAccount } = await createMortuaryVoxelNft(2000, plotSize, user.publicKey);
            let [burnAccount, burnBump] = await getVoxelBurnAddress(voxelMint);
            let voxelMetadata = await getMetadataAddress(voxelMint);

            // Ok
            await program.rpc.initializeVoxelBurn(
                burnBump,
                plotSize,
                {
                    accounts: {
                        masterAccount: masterAccountPubkey,
                        user: user.publicKey,
                        voxelMint: voxelMint,
                        voxelAccount: voxelAccount.address,
                        voxelMetadata: voxelMetadata,
                        voxelBurnAccount: burnAccount,
                        systemProgram: SystemProgram.programId,
                    },
                    signers: [
                        user
                    ]
                }
            );
        }

        // Send wrong plot_size
        {
            let plotSize = 2;
            let { mint: voxelMint, mintAccount: voxelAccount } = await createMortuaryVoxelNft(2000, plotSize, user.publicKey);
            let [burnAccount, burnBump] = await getVoxelBurnAddress(voxelMint);
            let voxelMetadata = await getMetadataAddress(voxelMint);
            let loggers = disableLogging();
            try {
                await initBurnAccount(user, burnBump, 8, voxelMint, voxelAccount.address, voxelMetadata, burnAccount);
                assert.ok(false);
            } catch (e) {
                assert.ok(true);
                assert.equal(e.error.errorMessage, "Plot size mismatch");
            }
            restoreLogging(loggers);
        }

        // Hacker user another one nft
        {
            let plotSize = 10;
            let { mint: voxelMint, mintAccount: voxelAccount } = await createMortuaryVoxelNft(2000, plotSize, user.publicKey);
            let [burnAccount, burnBump] = await getVoxelBurnAddress(voxelMint);
            let voxelMetadata = await getMetadataAddress(voxelMint);
            let loggers = disableLogging();
            try {
                await initBurnAccount(hacker, burnBump, plotSize, voxelMint, voxelAccount.address, voxelMetadata, burnAccount);
                assert.ok(false);
            } catch (e) {
                assert.ok(true);
                assert.equal(e.error.errorMessage, "User is not the voxel owner");
            }
            restoreLogging(loggers);
        }

        // Unsigned creators
        {
            // Creator will sign the metadata, not treasury in that use case
            // But we expect that treasury is inside the creator and is a signed creator
            let nft = await createMetaplexNftFull(connection, creator1, [creator1.publicKey, treasury.publicKey], 0, "Mortuary Inc Plot x2", "VOX");
            await connection.confirmTransaction(nft.txId, "confirmed");
            let voxelMint = nft.mint;
            let voxelAccount = await transferNft(connection, voxelMint, creator1, user.publicKey);

            let [burnAccount, burnBump] = await getVoxelBurnAddress(voxelMint);
            let voxelMetadata = await getMetadataAddress(voxelMint);
            let loggers = disableLogging();
            try {
                await initBurnAccount(user, burnBump, 2, voxelMint, voxelAccount.address, voxelMetadata, burnAccount);
                assert.ok(false);
            } catch (e) {
                assert.ok(true);
                assert.equal(e.error.errorMessage, "Incorrect creator");
            }
            restoreLogging(loggers);

            await updateChecks(0xfffffff ^ 8); // relax signed creator rules

            await initBurnAccount(user, burnBump, 2, voxelMint, voxelAccount.address, voxelMetadata, burnAccount);
            assert.ok(true);

            await updateChecks(0xfffffff); // reset to default
        }
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

    it('Burn suspended', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 2);
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);

        // Create an invalid nft to buen
        let fakeNftData = await createNonMetaplexNft(connection, creator1, user.publicKey);
        let fakeNaftMetaDataAccount = await getMetadataAddress(fakeNftData.mint.publicKey);
        let fakeNftEdition = await getMasterEditionAddress(fakeNftData.mint.publicKey);

        // User ash balance
        let a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);

        // Start the burn process
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
                        nftBurnAccount: fakeNftData.account,
                        nftBurnMint: fakeNftData.mint.publicKey,
                        nftBurnEdition: fakeNftEdition,
                        nftBurnMetadata: fakeNaftMetaDataAccount,
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
            assert.ok(true);
            assert.equal(e.error.errorMessage, "Not a metaplex metadata");
        }
        restoreLogging(loggers);

        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);
    });


    it('Invalid rugged NFT', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 2);
        let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user.publicKey);
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);

        // User ash balance
        let a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);

        await updateChecks(0xfffffff ^ 4);

        // Start the burn process
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
            assert.ok(true);
            assert.equal(e.error.errorMessage, "Burn facility is not live yet");
        }
        restoreLogging(loggers);

        await updateChecks(0xfffffff); // reset to default

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
    });


    it('Burn limit x2', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 2);

        // User ash balance
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);
        let a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);

        // 2x plots
        for (let i = 0; i < 2; i++) {
            let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user.publicKey);
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
        }

        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 6);

        {
            // Burning a 3rd nft is not allowed
            let loggers = disableLogging();
            try {
                let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user.publicKey);
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
                assert.ok(true);
                assert.equal(e.error.errorMessage, "Burn rate limit exceeded");
            }
            restoreLogging(loggers);
        }

        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 6);

        // let burnInfo = await program.account.voxelBurnAccount.fetch(voxelBurnAccount) as VoxelBurnAccount;
        // burnInfo.lastBurn.forEach((d, i) => {
        //     if (d > 0) console.log(`${i}: next burn ${computeNextBurnDate(d).toUTCString()}`);
        // });
    });

    it('Transfer voxel nft', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 2);

        const user2 = web3.Keypair.generate();
        await airDrop(connection, user2.publicKey, 2);

        // Create a valid voxel NFT and init a burning plot
        let { voxelMint, voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 2);

        {
            // user 1 burn 1
            let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);
            let a1 = await ashToken.getAccountInfo(ashTokenAccount);
            assert.equal(a1.amount, 0);
            let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user.publicKey);
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
        }

        // user 1 transfer to user2
        let voxelAccountUser2 = await transferNft(connection, voxelMint, user, user2.publicKey);

        {
            // user 2 burn 1
            let { ashToken, ashTokenAccount } = await createAshTokenAccount(user2);
            let a1 = await ashToken.getAccountInfo(ashTokenAccount);
            assert.equal(a1.amount, 0);
            let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user2.publicKey);
            await program.rpc.doVoxelBurn3(0,
                {
                    accounts: {
                        user: user2.publicKey,
                        voxelBurnAccount: voxelBurnAccount,
                        voxelAccount: voxelAccountUser2.address,
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
                    signers: [user2],
                }
            );
            a1 = await ashToken.getAccountInfo(ashTokenAccount);
            assert.equal(a1.amount, 3);
        }

        // Check 2 burn slots are full
        let burnInfo = await program.account.voxelBurnAccount.fetch(voxelBurnAccount) as VoxelBurnAccount;
        assert.notEqual(burnInfo.lastBurn[0], 0);
        assert.notEqual(burnInfo.lastBurn[1], 0);
        assert.equal(burnInfo.lastBurn[2], 0);
    });


    it('User 2 burn on user 1 voxel', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 2);

        const user2 = web3.Keypair.generate();
        await airDrop(connection, user2.publicKey, 2);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 2);
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);
        let a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);

        let { ashToken: user2AshToken, ashTokenAccount: user2AshTokenAccount } = await createAshTokenAccount(user2);
        let a2 = await user2AshToken.getAccountInfo(user2AshTokenAccount);
        assert.equal(a2.amount, 0);

        {
            // user 2 burn 1
            let loggers = disableLogging();
            try {
                let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user2.publicKey);
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
                            ashTokenAccount: ashTokenAccount,
                            tokenProgram: TOKEN_PROGRAM_ID,
                            clock: web3.SYSVAR_CLOCK_PUBKEY,
                            rent: web3.SYSVAR_RENT_PUBKEY,
                            systemProgram: web3.SystemProgram.programId,
                            metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                        },
                        signers: [user2],
                    }
                );
                assert.ok(false);
            } catch (e) {
                assert.ok(true);
                assert.equal(e.error.errorMessage, "Plot sharing is not enable");
            }
            restoreLogging(loggers);
        }

        // user 1 get 5 $ASH
        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);

        {
            // user 2 burn 1 but try to get the ASH
            let loggers = disableLogging();
            try {
                let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user2.publicKey);
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
                assert.ok(false);
            } catch (e) {
                assert.ok(true);
            }
            restoreLogging(loggers);
        }

        // user 2 get 0 $ASH
        a2 = await user2AshToken.getAccountInfo(user2AshTokenAccount);
        assert.equal(a2.amount, 0);

        // Check 2 burn slots are free
        let burnInfo = await program.account.voxelBurnAccount.fetch(voxelBurnAccount) as VoxelBurnAccount;
        assert.equal(burnInfo.lastBurn[0], 0);
        assert.equal(burnInfo.lastBurn[1], 0);

    });

    it.skip('Burn limit x10', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 10);

        // User ash balance
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);
        let a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 0);

        // 2x plots
        for (let i = 0; i < 10; i++) {
            let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user.publicKey);
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
        }

        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 50);

        {
            // Burning a 3rd nft is not allowed
            let loggers = disableLogging();
            try {
                let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user.publicKey);
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
                assert.ok(true);
                assert.equal(e.error.errorMessage, "Burn rate limit exceeded");
            }
            restoreLogging(loggers);
        }

        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 50);

        let burnInfo = await program.account.voxelBurnAccount.fetch(voxelBurnAccount) as VoxelBurnAccount;
        burnInfo.lastBurn.forEach((d, i) => {
            if (d > 0) console.log(`${i}: next burn ${computeNextBurnDate(d).toUTCString()}`);
        });
    });

});
