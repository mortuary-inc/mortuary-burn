import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { SystemProgram } from '@solana/web3.js';
import * as assert from 'assert';
import log from 'loglevel';
import { Mortuary } from "../target/types/mortuary";
import { creator1, getMasterEditionAddress, getMetadataAddress, TOKEN_METADATA_PROGRAM_ID, user1 } from './accounts';
import { airDrop, buyRuggedNft, createAshTokenAccount, createNftCollection, initializeVoxelBurn, setTestHelperGlobals, transferNft } from './helper';
import { createAsh, createBank, createMaster, createTreasury, disableLogging, restoreLogging } from './mortuaryHelper';
import { createMetaplexNftFull } from './nftcreator';



describe("booster-tax-test-suite", () => {

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

    log.debug(`Connecting to ${connection["_rpcEndpoint"]}`);
    log.debug(`Admin: ${admin.publicKey}`);

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

        let data = await program.account.mortuaryMasterAccount.fetch(masterAccountPubkey);
        assert.equal(data.goLiveDate, 1);

        // Create an nft collection
        let balance = await connection.getBalance(creator1.publicKey);
        log.debug(`Creator 1 balance: ${balance}`);
        log.debug(`Creating nft collection to burn`);
        solchicks = await createNftCollection(connection, creator1, "solchicks", 20);

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

    it('Create a booster', async () => {

        console.log("ready for booster");

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
                    nftBurnMetadata: ruggedNftMetadata,
                    nftBurnEdition: ruggedNftEdition,
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



    it('Burn with booster', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 2);
        let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user.publicKey);
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);
        let { minionNft, minionMetadata } = await createMinionNft(1, user.publicKey);

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
                    nftBurnMetadata: ruggedNftMetadata,
                    nftBurnEdition: ruggedNftEdition,
                    ashTokenAccount: ashTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: boosterPubkey, isSigner: false, isWritable: false },
                    { pubkey: minionNft.address, isSigner: false, isWritable: true },
                    { pubkey: minionMetadata, isSigner: false, isWritable: false },
                ],
                signers: [user],
            }
        );

        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 5);

        let treasurySolBalanceAfter = await connection.getBalance(treasuryAccountPubkey);
        assert.ok(treasurySolBalanceAfter > treasurySolBalanceBefore);
    });

    it('Burn a booster', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount } = await initializeVoxelBurn(user, 2);
        let { ashToken, ashTokenAccount } = await createAshTokenAccount(user);
        let { minionNft, minionMetadata, minionEdition } = await createMinionNft(1, user.publicKey);

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
                    nftBurnAccount: minionNft.address,
                    nftBurnMint: minionNft.mint,
                    nftBurnMetadata: minionMetadata,
                    nftBurnEdition: minionEdition,
                    ashTokenAccount: ashTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: boosterPubkey, isSigner: false, isWritable: false },
                    { pubkey: minionNft.address, isSigner: false, isWritable: true },
                    { pubkey: minionMetadata, isSigner: false, isWritable: false },
                ],
                signers: [user],
            }
        );

        a1 = await ashToken.getAccountInfo(ashTokenAccount);
        assert.equal(a1.amount, 100);

        let treasurySolBalanceAfter = await connection.getBalance(treasuryAccountPubkey);
        assert.ok(treasurySolBalanceAfter > treasurySolBalanceBefore);
    });


    it('Set tax and burn with booster', async () => {

        // Create user and fund account
        const user1 = web3.Keypair.generate();
        const user2 = web3.Keypair.generate();
        await Promise.all([
            airDrop(connection, user1.publicKey, 1),
            airDrop(connection, user2.publicKey, 1),
        ]);

        let { ashToken: u1AshToken, ashTokenAccount: u1AshTokenAccount } = await createAshTokenAccount(user1);
        let { ashToken: u2AshToken, ashTokenAccount: u2AshTokenAccount } = await createAshTokenAccount(user2);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount, voxelBurnBump, voxelMint } = await initializeVoxelBurn(user1, 4);

        // Enable tax on plot
        let tax = 5;
        await program.rpc.setVoxelBurnTax(voxelBurnBump, tax,
            {
                accounts: {
                    user: user1.publicKey,
                    voxelAccount: voxelAccount,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelMint: voxelMint,
                },
                signers: [user1]
            });

        let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user1.publicKey);
        let { minionNft, minionMetadata } = await createMinionNft(1, user1.publicKey);

        // User ash balance
        let a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 0);

        // Start the burn process
        await program.rpc.doVoxelBurn3(0,
            {
                accounts: {
                    user: user1.publicKey,
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
                    ashTokenAccount: u1AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: boosterPubkey, isSigner: false, isWritable: false },
                    { pubkey: minionNft.address, isSigner: false, isWritable: true },
                    { pubkey: minionMetadata, isSigner: false, isWritable: false },
                ],
                signers: [user1],
            }
        );

        // user 1 use it's plot: 5 ash
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 5);

        //
        // User get trash nft
        let { ruggedNftTokenAccount: ruggedNftTokenAccount2, ruggedNftMetadata: ruggedNftMetadata2, ruggedNftEdition: ruggedNftEdition2 } = await buyRuggedNft(user2.publicKey);

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
                    nftBurnAccount: ruggedNftTokenAccount2.address,
                    nftBurnMint: ruggedNftTokenAccount2.mint,
                    nftBurnMetadata: ruggedNftMetadata2,
                    nftBurnEdition: ruggedNftEdition2,
                    ashTokenAccount: u2AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: u1AshTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: boosterPubkey, isSigner: false, isWritable: false },
                    { pubkey: minionNft.address, isSigner: false, isWritable: true },
                    { pubkey: minionMetadata, isSigner: false, isWritable: false },
                ],
                signers: [user2],
                options: {
                    skipPreflight: true,
                }
            }
        );

        // user2 use user1 plot: 5 - tax ash (2)
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 7); // 5 + tax 2
        let a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a2.amount, 3); // 3 (5-2)
    });


    it('Set tax to 1 and burn with booster', async () => {

        // Create user and fund account
        const user1 = web3.Keypair.generate();
        const user2 = web3.Keypair.generate();
        await Promise.all([
            airDrop(connection, user1.publicKey, 1),
            airDrop(connection, user2.publicKey, 1),
        ]);

        let { ashToken: u1AshToken, ashTokenAccount: u1AshTokenAccount } = await createAshTokenAccount(user1);
        let { ashToken: u2AshToken, ashTokenAccount: u2AshTokenAccount } = await createAshTokenAccount(user2);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount, voxelBurnBump, voxelMint } = await initializeVoxelBurn(user1, 4);

        // Enable tax on plot
        let tax = 1;
        await program.rpc.setVoxelBurnTax(voxelBurnBump, tax,
            {
                accounts: {
                    user: user1.publicKey,
                    voxelAccount: voxelAccount,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelMint: voxelMint,
                },
                signers: [user1]
            });

        let { minionNft, minionMetadata } = await createMinionNft(1, user1.publicKey);

        // User ash balance
        let a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 0);

        // User get trash nft
        let { ruggedNftTokenAccount: ruggedNftTokenAccount2, ruggedNftMetadata: ruggedNftMetadata2, ruggedNftEdition: ruggedNftEdition2 } = await buyRuggedNft(user2.publicKey);

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
                    nftBurnAccount: ruggedNftTokenAccount2.address,
                    nftBurnMint: ruggedNftTokenAccount2.mint,
                    nftBurnMetadata: ruggedNftMetadata2,
                    nftBurnEdition: ruggedNftEdition2,
                    ashTokenAccount: u2AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: u1AshTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: boosterPubkey, isSigner: false, isWritable: false },
                    { pubkey: minionNft.address, isSigner: false, isWritable: true },
                    { pubkey: minionMetadata, isSigner: false, isWritable: false },
                ],
                signers: [user2],
            }
        );

        // user2 use user1 plot: 8 - tax ash (min is 4)
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 2); // tax 2
        let a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a2.amount, 3); // (5-2)
    });

    it('Set tax to 1 and burn without booster', async () => {

        // Create user and fund account
        const user1 = web3.Keypair.generate();
        const user2 = web3.Keypair.generate();
        await Promise.all([
            airDrop(connection, user1.publicKey, 1),
            airDrop(connection, user2.publicKey, 1),
        ]);

        let { ashToken: u1AshToken, ashTokenAccount: u1AshTokenAccount } = await createAshTokenAccount(user1);
        let { ashToken: u2AshToken, ashTokenAccount: u2AshTokenAccount } = await createAshTokenAccount(user2);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount, voxelBurnBump, voxelMint } = await initializeVoxelBurn(user1, 4);

        // Enable tax on plot
        let tax = 1;
        await program.rpc.setVoxelBurnTax(voxelBurnBump, tax,
            {
                accounts: {
                    user: user1.publicKey,
                    voxelAccount: voxelAccount,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelMint: voxelMint,
                },
                signers: [user1]
            });

        // User ash balance
        let a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 0);

        //
        // User get trash nft
        let { ruggedNftTokenAccount: ruggedNftTokenAccount2, ruggedNftMetadata: ruggedNftMetadata2, ruggedNftEdition: ruggedNftEdition2 } = await buyRuggedNft(user2.publicKey);

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
                    nftBurnAccount: ruggedNftTokenAccount2.address,
                    nftBurnMint: ruggedNftTokenAccount2.mint,
                    nftBurnMetadata: ruggedNftMetadata2,
                    nftBurnEdition: ruggedNftEdition2,
                    ashTokenAccount: u2AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: u1AshTokenAccount, isSigner: false, isWritable: true },
                ],
                signers: [user2],
            }
        );

        // user2 use user1 plot: 2 renter | 1 owner
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 1);
        let a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a2.amount, 2);
    });


    it('Set tax and burn without booster', async () => {

        // Create user and fund account
        const user1 = web3.Keypair.generate();
        const user2 = web3.Keypair.generate();
        await Promise.all([
            airDrop(connection, user1.publicKey, 1),
            airDrop(connection, user2.publicKey, 1),
        ]);

        let { ashToken: u1AshToken, ashTokenAccount: u1AshTokenAccount } = await createAshTokenAccount(user1);
        let { ashToken: u2AshToken, ashTokenAccount: u2AshTokenAccount } = await createAshTokenAccount(user2);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount, voxelBurnBump, voxelMint } = await initializeVoxelBurn(user1, 4);

        // Enable tax on plot
        let tax = 4;
        await program.rpc.setVoxelBurnTax(voxelBurnBump, tax,
            {
                accounts: {
                    user: user1.publicKey,
                    voxelAccount: voxelAccount,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelMint: voxelMint,
                },
                signers: [user1]
            });

        let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user1.publicKey);

        // User ash balance
        let a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 0);

        // Start the burn process
        await program.rpc.doVoxelBurn3(0,
            {
                accounts: {
                    user: user1.publicKey,
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
                    ashTokenAccount: u1AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [],
                signers: [user1],
            }
        );

        // user 1 use it's plot: 3 ash
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 3);

        //
        // User get trash nft
        let { ruggedNftTokenAccount: ruggedNftTokenAccount2, ruggedNftMetadata: ruggedNftMetadata2, ruggedNftEdition: ruggedNftEdition2 } = await buyRuggedNft(user2.publicKey);

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
                    nftBurnAccount: ruggedNftTokenAccount2.address,
                    nftBurnMint: ruggedNftTokenAccount2.mint,
                    nftBurnMetadata: ruggedNftMetadata2,
                    nftBurnEdition: ruggedNftEdition2,
                    ashTokenAccount: u2AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: u1AshTokenAccount, isSigner: false, isWritable: true },
                ],
                signers: [user2],
            }
        );

        // user2 use user1 plot: 2 renter | 1 owner
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 4); // 3 + tax 1
        let a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a2.amount, 2);
    });


    it('Set tax and remove tax', async () => {

        // Create user and fund account
        const user1 = web3.Keypair.generate();
        const user2 = web3.Keypair.generate();
        await Promise.all([
            airDrop(connection, user1.publicKey, 1),
            airDrop(connection, user2.publicKey, 1),
        ]);

        let { ashToken: u1AshToken, ashTokenAccount: u1AshTokenAccount } = await createAshTokenAccount(user1);
        let { ashToken: u2AshToken, ashTokenAccount: u2AshTokenAccount } = await createAshTokenAccount(user2);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount, voxelBurnBump, voxelMint } = await initializeVoxelBurn(user1, 4);

        // Enable tax on plot
        let tax = 2;
        await program.rpc.setVoxelBurnTax(voxelBurnBump, tax,
            {
                accounts: {
                    user: user1.publicKey,
                    voxelAccount: voxelAccount,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelMint: voxelMint,
                },
                signers: [user1]
            });

        // User ash balance
        let a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 0);

        //
        // User get trash nft
        let { ruggedNftTokenAccount: ruggedNftTokenAccount2, ruggedNftMetadata: ruggedNftMetadata2, ruggedNftEdition: ruggedNftEdition2 } = await buyRuggedNft(user2.publicKey);

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
                    nftBurnAccount: ruggedNftTokenAccount2.address,
                    nftBurnMint: ruggedNftTokenAccount2.mint,
                    nftBurnMetadata: ruggedNftMetadata2,
                    nftBurnEdition: ruggedNftEdition2,
                    ashTokenAccount: u2AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: u1AshTokenAccount, isSigner: false, isWritable: true },
                ],
                signers: [user2],
            }
        );

        // user2 use user1 plot: 2 renter | 1 onwer
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 1);
        let a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a2.amount, 2);

        // disable share
        await program.rpc.setVoxelBurnTax(voxelBurnBump, 0,
            {
                accounts: {
                    user: user1.publicKey,
                    voxelAccount: voxelAccount,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelMint: voxelMint,
                },
                signers: [user1]
            });

        let { ruggedNftTokenAccount: ruggedNftTokenAccount3, ruggedNftMetadata: ruggedNftMetadata3, ruggedNftEdition: ruggedNftEdition3 } = await buyRuggedNft(user2.publicKey);

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
                        nftBurnAccount: ruggedNftTokenAccount3.address,
                        nftBurnMint: ruggedNftTokenAccount3.mint,
                        nftBurnMetadata: ruggedNftMetadata3,
                        nftBurnEdition: ruggedNftEdition3,
                        ashTokenAccount: u2AshTokenAccount,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        clock: web3.SYSVAR_CLOCK_PUBKEY,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                        systemProgram: web3.SystemProgram.programId,
                        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                    },
                    remainingAccounts: [
                        { pubkey: u1AshTokenAccount, isSigner: false, isWritable: true },
                    ],
                    signers: [user2],
                }
            );
            assert.ok(false);
        } catch (e) {
            console.log(e);
            assert.ok(true);
            assert.equal(e.error.errorMessage, "Plot sharing is not enable");
        }
        restoreLogging(loggers);

        // owner burn
        let { ruggedNftTokenAccount, ruggedNftMetadata, ruggedNftEdition } = await buyRuggedNft(user1.publicKey);
        // Start the burn process
        await program.rpc.doVoxelBurn3(0,
            {
                accounts: {
                    user: user1.publicKey,
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
                    ashTokenAccount: u1AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [],
                signers: [user1],
            }
        );

        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 1 + 3);

    });


    it('Set tax too high', async () => {

        // Create user and fund account
        const user1 = web3.Keypair.generate();
        const user2 = web3.Keypair.generate();
        await Promise.all([
            airDrop(connection, user1.publicKey, 1),
            airDrop(connection, user2.publicKey, 1),
        ]);

        let { ashToken: u1AshToken, ashTokenAccount: u1AshTokenAccount } = await createAshTokenAccount(user1);
        let { ashToken: u2AshToken, ashTokenAccount: u2AshTokenAccount } = await createAshTokenAccount(user2);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount, voxelBurnBump, voxelMint } = await initializeVoxelBurn(user1, 4);

        // Enable tax on plot
        let tax = 30;
        await program.rpc.setVoxelBurnTax(voxelBurnBump, tax,
            {
                accounts: {
                    user: user1.publicKey,
                    voxelAccount: voxelAccount,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelMint: voxelMint,
                },
                signers: [user1]
            });

        // User ash balance
        let a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 0);

        //
        // User get trash nft
        let { ruggedNftTokenAccount: ruggedNftTokenAccount2, ruggedNftMetadata: ruggedNftMetadata2, ruggedNftEdition: ruggedNftEdition2 } = await buyRuggedNft(user2.publicKey);

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
                    nftBurnAccount: ruggedNftTokenAccount2.address,
                    nftBurnMint: ruggedNftTokenAccount2.mint,
                    nftBurnMetadata: ruggedNftMetadata2,
                    nftBurnEdition: ruggedNftEdition2,
                    ashTokenAccount: u2AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: u1AshTokenAccount, isSigner: false, isWritable: true },
                ],
                signers: [user2],
            }
        );

        // user2 use user1 plot: 2 | 1
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        assert.equal(a1.amount, 1);
        let a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a2.amount, 2);
    });


    it('Dynamic ashForBurn, booster and tax', async () => {

        // Create user and fund account
        const user1 = web3.Keypair.generate();
        const user2 = web3.Keypair.generate();
        await Promise.all([
            airDrop(connection, user1.publicKey, 1),
            airDrop(connection, user2.publicKey, 1),
        ]);

        let { ashToken: u1AshToken, ashTokenAccount: u1AshTokenAccount } = await createAshTokenAccount(user1);
        let { ashToken: u2AshToken, ashTokenAccount: u2AshTokenAccount } = await createAshTokenAccount(user2);

        // Create a valid voxel NFT and init a burning plot
        let { voxelAccount, voxelBurnAccount, voxelBurnBump, voxelMint } = await initializeVoxelBurn(user1, 4);
        
        // Enable plot sharing
        await program.rpc.setVoxelBurnTax(voxelBurnBump, 1,
            {
                accounts: {
                    user: user1.publicKey,
                    voxelAccount: voxelAccount,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelMint: voxelMint,
                },
                signers: [user1]
            });

        let { minionNft, minionMetadata } = await createMinionNft(1, user1.publicKey);


        // Set new tax and burn reward
        let nexTax = 2;
        let burnReward = 5;
        let boosterReward = 3;
        await program.rpc.updateMaster(new anchor.BN(nexTax), null, new anchor.BN(burnReward), null, {
            accounts: {
                initializer: admin.publicKey,
                masterAccount: masterAccountPubkey,
            },
            signers: [admin],
        });
        await program.rpc.updateBooster(
            1, coyotte.publicKey, "Minion", null, boosterReward, 100, true,
            {
                accounts: {
                    booster: boosterPubkey,
                    initializer: admin.publicKey,
                },
                signers: [admin],
            }
        );

        // User ash balance
        let expectedU1Ash = 0;
        let expectedU2Ash = 0;
        let a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        let a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a1.amount, expectedU1Ash);
        assert.equal(a2.amount, expectedU2Ash);


        // Taxed burn without booster
        let { ruggedNftTokenAccount: ruggedNftTokenAccount1, ruggedNftMetadata: ruggedNftMetadata1, ruggedNftEdition: ruggedNftEdition1 } = await buyRuggedNft(user2.publicKey);
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
                    nftBurnAccount: ruggedNftTokenAccount1.address,
                    nftBurnMint: ruggedNftTokenAccount1.mint,
                    nftBurnMetadata: ruggedNftMetadata1,
                    nftBurnEdition: ruggedNftEdition1,
                    ashTokenAccount: u2AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: u1AshTokenAccount, isSigner: false, isWritable: true },
                ],
                signers: [user2],
            }
        );

        expectedU1Ash += 2;
        expectedU2Ash += 3;
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a1.amount, expectedU1Ash);
        assert.equal(a2.amount, expectedU2Ash);


        // Taxed burn with booster
        let { ruggedNftTokenAccount: ruggedNftTokenAccount2, ruggedNftMetadata: ruggedNftMetadata2, ruggedNftEdition: ruggedNftEdition2 } = await buyRuggedNft(user2.publicKey);
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
                    nftBurnAccount: ruggedNftTokenAccount2.address,
                    nftBurnMint: ruggedNftTokenAccount2.mint,
                    nftBurnMetadata: ruggedNftMetadata2,
                    nftBurnEdition: ruggedNftEdition2,
                    ashTokenAccount: u2AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: u1AshTokenAccount, isSigner: false, isWritable: true },
                    { pubkey: boosterPubkey, isSigner: false, isWritable: false },
                    { pubkey: minionNft.address, isSigner: false, isWritable: true },
                    { pubkey: minionMetadata, isSigner: false, isWritable: false },
                ],
                signers: [user2],
            }
        );

        expectedU1Ash += 4;
        expectedU2Ash += 4;
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a1.amount, expectedU1Ash);
        assert.equal(a2.amount, expectedU2Ash);

        // Simple burn without booster
        let { ruggedNftTokenAccount: ruggedNftTokenAccount3, ruggedNftMetadata: ruggedNftMetadata3, ruggedNftEdition: ruggedNftEdition3 } = await buyRuggedNft(user1.publicKey);
        await program.rpc.doVoxelBurn3(0,
            {
                accounts: {
                    user: user1.publicKey,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelAccount: voxelAccount,
                    masterAccount: masterAccountPubkey,
                    bank: bankAccountPubkey,
                    treasury: treasuryAccountPubkey,
                    pdaAccount: pdaAccountPubkey,
                    nftBurnAccount: ruggedNftTokenAccount3.address,
                    nftBurnMint: ruggedNftTokenAccount3.mint,
                    nftBurnMetadata: ruggedNftMetadata3,
                    nftBurnEdition: ruggedNftEdition3,
                    ashTokenAccount: u1AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: u1AshTokenAccount, isSigner: false, isWritable: true },
                ],
                signers: [user1],
            }
        );

        expectedU1Ash += 5;
        expectedU2Ash += 0;
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a1.amount, expectedU1Ash);
        assert.equal(a2.amount, expectedU2Ash);

        // Simple burn with booster
        let { ruggedNftTokenAccount: ruggedNftTokenAccount4, ruggedNftMetadata: ruggedNftMetadata4, ruggedNftEdition: ruggedNftEdition4 } = await buyRuggedNft(user1.publicKey);
        await program.rpc.doVoxelBurn3(0,
            {
                accounts: {
                    user: user1.publicKey,
                    voxelBurnAccount: voxelBurnAccount,
                    voxelAccount: voxelAccount,
                    masterAccount: masterAccountPubkey,
                    bank: bankAccountPubkey,
                    treasury: treasuryAccountPubkey,
                    pdaAccount: pdaAccountPubkey,
                    nftBurnAccount: ruggedNftTokenAccount4.address,
                    nftBurnMint: ruggedNftTokenAccount4.mint,
                    nftBurnMetadata: ruggedNftMetadata4,
                    nftBurnEdition: ruggedNftEdition4,
                    ashTokenAccount: u1AshTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: web3.SYSVAR_CLOCK_PUBKEY,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM_ID,
                },
                remainingAccounts: [
                    { pubkey: boosterPubkey, isSigner: false, isWritable: false },
                    { pubkey: minionNft.address, isSigner: false, isWritable: true },
                    { pubkey: minionMetadata, isSigner: false, isWritable: false },
                ],
                signers: [user1],
            }
        );

        expectedU1Ash += 8;
        expectedU2Ash += 0;
        a1 = await u1AshToken.getAccountInfo(u1AshTokenAccount);
        a2 = await u2AshToken.getAccountInfo(u2AshTokenAccount);
        assert.equal(a1.amount, expectedU1Ash);
        assert.equal(a2.amount, expectedU2Ash);
    });


    // Create a minion nft + transfer to "owner"
    async function createMinionNft(index: number, newOwner: web3.PublicKey) {
        //
        let nft = await createMetaplexNftFull(connection, coyotte, [pinpin.publicKey, coyotte.publicKey], index, "The Minion" + index, "VOX");
        await connection.confirmTransaction(nft.txId, "confirmed");
        let mint = nft.mint;
        let metadata = await getMetadataAddress(nft.mint);
        let edition = await getMasterEditionAddress(nft.mint);
        let mintAccount = await transferNft(connection, mint, coyotte, newOwner);
        return {
            minionMint: mint, minionNft: mintAccount, minionMetadata: metadata, minionEdition: edition
        };
    }


});
