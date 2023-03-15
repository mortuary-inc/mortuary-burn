import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { SystemProgram } from '@solana/web3.js';
import * as assert from 'assert';
import log from 'loglevel';
import { Mortuary } from "../target/types/mortuary";
import { creator1, leaked_key, user1 } from './accounts';
import { airDrop, createNftCollection, u64ToNumber } from './helper';
import { createAsh, createBank, createMaster, createTreasury, disableLogging, restoreLogging } from './mortuaryHelper';



describe("burn-poc-test-suite", () => {

    log.setLevel(log.levels.INFO);

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Mortuary as Program<Mortuary>;
    const connection = provider.connection;
    const admin = web3.Keypair.generate();

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
        try {
            await airDrop(connection, provider.wallet.publicKey, 2);
            await airDrop(connection, admin.publicKey, 2);
            await airDrop(connection, creator1.publicKey, 2);
            await airDrop(connection, user1.publicKey, 2);
            await airDrop(connection, leaked_key.publicKey, 2);
        } catch (e) {
            console.error(e);
        }

        //
        // Treasury account
        //
        let treasury = await createTreasury(connection, admin);
        treasuryAccountPubkey = treasury.publicKey;

        //
        // Create $ASH and mint some
        //        
        let ashMintToken = await createAsh(connection, admin, 5000);
        ashMintPubkey = ashMintToken.publicKey;

        let adminAshAccountInfo = await ashMintToken.getOrCreateAssociatedAccountInfo(admin.publicKey);
        log.debug(`Admin $ASH account ${adminAshAccountInfo.address} balance: ${adminAshAccountInfo.amount}`);
        assert.equal(adminAshAccountInfo.amount, 5000);

        //
        // Create instruction to 
        // - create bank account
        // - transfer some $ASH in it (from admin)
        const {
            bankKeypair,
            createBankAccountIx,
            initBankAccountIx,
            transferAshToBankAccIx
        } = await createBank(connection, admin, adminAshAccountInfo);
        bankAccountPubkey = bankKeypair.publicKey;

        //
        // Initialize mortuary master account
        // - bank owner must equals initializer
        // - after initialization, the smart-contract owns the bank account
        //
        const { masterAccount, pda } = await createMaster(program, admin, bankKeypair, treasuryAccountPubkey, [createBankAccountIx, initBankAccountIx, transferAshToBankAccIx]);
        masterAccountPubkey = masterAccount;
        pdaAccountPubkey = pda;

        //
        // Set burning live
        //
        let goLiveDate = 1;
        let ashByBurn = 1;
        await program.rpc.updateMaster(new anchor.BN(goLiveDate), null, new anchor.BN(ashByBurn), null, {
            accounts: {
                initializer: admin.publicKey,
                masterAccount: masterAccountPubkey,
            },
            signers: [admin],
        });

        let data = await program.account.mortuaryMasterAccount.fetch(masterAccountPubkey);
        assert.equal(data.goLiveDate, 1);

        //
        // Extra test to check admin can no more transfer coin out from bank account
        let dumb = new web3.Keypair();
        let dumbAccount = await ashMintToken.createAssociatedTokenAccount(dumb.publicKey);
        await ashMintToken.transfer(adminAshAccountInfo.address, dumbAccount, admin.publicKey, [admin], 10);
        let a1 = await ashMintToken.getAccountInfo(dumbAccount);
        assert.equal(a1.amount, 10);

        let loggers = disableLogging();
        try {
            await ashMintToken.transfer(bankAccountPubkey, dumbAccount, admin.publicKey, [admin], 5);
            assert.ok(false);
        } catch (e) {
            a1 = await ashMintToken.getAccountInfo(bankAccountPubkey);
            assert.equal(a1.amount, 4095);
        }
        restoreLogging(loggers);

        //
        // Create an nft collection
        //
        solchicks = await createNftCollection(connection, creator1, "solchicks", 10);
        solchicks.forEach((s, idx) => {
            log.debug(`NFT item ${idx}: ${s.mint}`);
        });
    });

    it('Admin withdraw some $ash', async () => {

        let ashMintToken = new Token(connection, ashMintPubkey, TOKEN_PROGRAM_ID, admin);
        let adminAshTokenAccount = await ashMintToken.getOrCreateAssociatedAccountInfo(admin.publicKey);

        let amount = 50;
        let bankAshBalanceBefore = await ashMintToken.getAccountInfo(bankAccountPubkey);
        let adminAshBalanceBefore = await ashMintToken.getAccountInfo(adminAshTokenAccount.address);

        await program.rpc.withdrawMaster(new anchor.BN(amount),
            {
                accounts: {
                    masterAccount: masterAccountPubkey,
                    initializer: admin.publicKey,
                    ownerTokenAccount: adminAshTokenAccount.address,
                    bank: bankAccountPubkey,
                    pdaAccount: pdaAccountPubkey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                },
                signers: [admin],
            }
        );

        let bankAshBalanceAfter = await ashMintToken.getAccountInfo(bankAccountPubkey);
        let adminAshBalanceAfter = await ashMintToken.getAccountInfo(adminAshTokenAccount.address);
        assert.equal(u64ToNumber(bankAshBalanceAfter.amount) + amount, bankAshBalanceBefore.amount);
        assert.equal(adminAshBalanceAfter.amount, u64ToNumber(adminAshBalanceBefore.amount) + amount);
    });

    it('Hacker withdraw some $ash', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create account for user1 to hold some $ASH
        let ashMintToken = new Token(connection, ashMintPubkey, TOKEN_PROGRAM_ID, user);
        let userAshTokenAccount = await ashMintToken.createAssociatedTokenAccount(user.publicKey);
        let leakedAshTokenAccount = await ashMintToken.createAssociatedTokenAccount(leaked_key.publicKey);

        {
            // verify admin can withdraw
            let adminAshTokenAccount = await ashMintToken.getOrCreateAssociatedAccountInfo(admin.publicKey);
            await program.rpc.withdrawMaster(new anchor.BN(5),
                {
                    accounts: {
                        masterAccount: masterAccountPubkey,
                        initializer: admin.publicKey,
                        ownerTokenAccount: adminAshTokenAccount.address,
                        bank: bankAccountPubkey,
                        pdaAccount: pdaAccountPubkey,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    signers: [admin],
                }
            );
        }

        let amount = 5;
        let bankAshBalanceBefore = await ashMintToken.getAccountInfo(bankAccountPubkey);
        let hackerAshBalanceBefore = await ashMintToken.getAccountInfo(userAshTokenAccount);

        let loggers = disableLogging();
        restoreLogging(loggers);
        try {
            // attempt 1
            await program.rpc.withdrawMaster(new anchor.BN(amount),
                {
                    accounts: {
                        masterAccount: masterAccountPubkey,
                        initializer: admin.publicKey,
                        ownerTokenAccount: userAshTokenAccount,
                        bank: bankAccountPubkey,
                        pdaAccount: pdaAccountPubkey,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    signers: [user],
                }
            );
            assert.ok(false);
        } catch (e) {
            console.log("ASH MINT " + ashMintPubkey.toBase58());
            console.log("MASTER ACCOUNT " + masterAccountPubkey.toBase58());
            console.log("User attempting to withdraw: " + user.publicKey);
            console.error("It's OK not to withdraw here", e);
            assert.ok(true);
        }
        restoreLogging(loggers);


        loggers = disableLogging();
        try {
            // attempt 2
            // create a master account with an empty bank
            let bankKeypair = new web3.Keypair();
            let treasuryKeypair = new web3.Keypair();
            const [key, bump] = await web3.PublicKey.findProgramAddress(
                [user.publicKey.toBuffer(), Buffer.from("master")],
                program.programId
            );
            const createTreasuryAccountIx = SystemProgram.createAccount({
                programId: TOKEN_PROGRAM_ID,
                space: AccountLayout.span,
                lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
                fromPubkey: user.publicKey,
                newAccountPubkey: treasuryKeypair.publicKey
            });
            const createBankAccountIx = SystemProgram.createAccount({
                programId: TOKEN_PROGRAM_ID,
                space: AccountLayout.span,
                lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
                fromPubkey: user.publicKey,
                newAccountPubkey: bankKeypair.publicKey
            });
            const initBankAccountIx = Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, ashMintPubkey, bankKeypair.publicKey, user.publicKey);
            await program.rpc.initializeMaster(bump,
                {
                    accounts: {
                        initializer: user.publicKey,
                        masterAccount: key,
                        bank: bankKeypair.publicKey,
                        treasury: treasuryKeypair.publicKey,
                        systemProgram: SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    instructions: [
                        createTreasuryAccountIx,
                        createBankAccountIx,
                        initBankAccountIx,
                    ],
                    signers: [user, bankKeypair, treasuryKeypair],
                }
            );
            // try withdraw
            await program.rpc.withdrawMaster(new anchor.BN(amount),
                {
                    accounts: {
                        masterAccount: key,
                        initializer: user.publicKey,
                        ownerTokenAccount: userAshTokenAccount,
                        bank: bankAccountPubkey, // the real bank
                        pdaAccount: pdaAccountPubkey,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    signers: [user],
                }
            );
            assert.ok(false);
        } catch (e) {
            console.error("It's OK not to withdraw here", e);
            assert.ok(true);
        }
        restoreLogging(loggers);

        let bankAshBalanceAfter = await ashMintToken.getAccountInfo(bankAccountPubkey);
        let hackerAshBalanceAfter = await ashMintToken.getAccountInfo(userAshTokenAccount);
        assert.equal(u64ToNumber(bankAshBalanceAfter.amount), u64ToNumber(bankAshBalanceBefore.amount));
        assert.equal(u64ToNumber(hackerAshBalanceAfter.amount), u64ToNumber(hackerAshBalanceBefore.amount));
    });

    it('Hacker create master with existing bank', async () => {

        // Create user and fund account
        const user = web3.Keypair.generate();
        await airDrop(connection, user.publicKey, 1);

        // Create account for user1 to hold some $ASH
        let ashMintToken = new Token(connection, ashMintPubkey, TOKEN_PROGRAM_ID, user);
        let userAshTokenAccount = await ashMintToken.createAssociatedTokenAccount(user.publicKey);

        let bankAshBalanceBefore = await ashMintToken.getAccountInfo(bankAccountPubkey);
        let hackerAshBalanceBefore = await ashMintToken.getAccountInfo(userAshTokenAccount);

        let loggers = disableLogging();
        try {
            // attempt 3
            // create a master account link to the existing bank
            const [key, bump] = await web3.PublicKey.findProgramAddress(
                [user.publicKey.toBuffer(), Buffer.from("master")],
                program.programId
            );
            await program.rpc.initializeMaster(bump,
                {
                    accounts: {
                        initializer: user.publicKey,
                        masterAccount: key,
                        bank: bankAccountPubkey,
                        treasury: treasuryAccountPubkey,
                        systemProgram: SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    signers: [user],
                }
            );
            assert.ok(false);
        } catch (e) {
            assert.ok(true);
        }
        restoreLogging(loggers);

        let bankAshBalanceAfter = await ashMintToken.getAccountInfo(bankAccountPubkey);
        let hackerAshBalanceAfter = await ashMintToken.getAccountInfo(userAshTokenAccount);
        assert.equal(u64ToNumber(bankAshBalanceAfter.amount), u64ToNumber(bankAshBalanceBefore.amount));
        assert.equal(u64ToNumber(hackerAshBalanceAfter.amount), u64ToNumber(hackerAshBalanceBefore.amount));
    });


});
