import * as anchor from '@project-serum/anchor';
import { IdlAccounts, Program } from '@project-serum/anchor';
import { AccountInfo, AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { SystemProgram } from '@solana/web3.js';
import log from 'loglevel';
import { Mortuary } from "../target/types/mortuary";

export type MortuaryMasterAccount = IdlAccounts<Mortuary>['mortuaryMasterAccount'];
export type VoxelBurnAccount = IdlAccounts<Mortuary>['voxelBurnAccount'];

export async function createTreasury(connection: web3.Connection, admin: web3.Keypair) {

    //
    // Treasury account
    //
    const treasury = new web3.Keypair();
    // const createTreasuryIx = new web3.Transaction().add(
    //     SystemProgram.createAccount({
    //         programId: SystemProgram.programId,
    //         space: AccountLayout.span,
    //         lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
    //         fromPubkey: admin.publicKey,
    //         newAccountPubkey: treasury.publicKey
    //     })
    // );
    // await web3.sendAndConfirmTransaction(connection, createTreasuryIx, [admin, treasury]);
    log.debug(`Treasury: ${treasury.publicKey}`);
    return treasury;
}

export async function createAsh(connection: web3.Connection, admin: web3.Keypair, quantity: number) {

    let ashMintToken = await Token.createMint(
        connection,
        admin, // fee payer
        admin.publicKey, // mintAuthority
        admin.publicKey, // freezeAuthority
        0,
        TOKEN_PROGRAM_ID);

    // Create a $ASH account for admin and mint some token in it
    let adminAshAccount = await ashMintToken.createAssociatedTokenAccount(admin.publicKey);
    await ashMintToken.mintTo(
        adminAshAccount,
        admin.publicKey,
        [admin],
        quantity
    );

    log.debug(`$ASH token ${ashMintToken.publicKey}`);

    return ashMintToken;
}

export async function createBank(connection: web3.Connection, admin: web3.Keypair, adminAshAccountInfo: AccountInfo, quantity = 4095) {
    let bankKeypair = new web3.Keypair();
    const createBankAccountIx = SystemProgram.createAccount({
        programId: TOKEN_PROGRAM_ID,
        space: AccountLayout.span,
        lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
        fromPubkey: admin.publicKey,
        newAccountPubkey: bankKeypair.publicKey
    });
    const initBankAccountIx = Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, adminAshAccountInfo.mint, bankKeypair.publicKey, admin.publicKey);
    const transferAshToBankAccIx = Token.createTransferInstruction(TOKEN_PROGRAM_ID, adminAshAccountInfo.address, bankKeypair.publicKey, admin.publicKey, [], quantity);
    log.debug(`Bank: ${bankKeypair.publicKey}`);
    return {
        bankKeypair,
        createBankAccountIx,
        initBankAccountIx,
        transferAshToBankAccIx
    }
}


export async function createMaster(program: Program<Mortuary>, admin: web3.Keypair, bank: web3.Keypair, treasury: web3.PublicKey, instructions: web3.TransactionInstruction[]) {

    const [masterAccountPubkey, bump] = await web3.PublicKey.findProgramAddress(
        [admin.publicKey.toBuffer(), Buffer.from("master")],
        program.programId
    );
    await program.rpc.initializeMaster(bump,
        {
            accounts: {
                initializer: admin.publicKey,
                masterAccount: masterAccountPubkey,
                bank: bank.publicKey,
                treasury: treasury,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            },
            instructions: instructions,
            signers: [admin, bank],
        }
    );

    // Compute pda key
    const [pda, _nonce] = await web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("mortuary"))],
        program.programId
    );


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

    return { masterAccount: masterAccountPubkey, pda }
}

export function disableLogging() {
    let consoleErr = console.error;
    let consoleLog = console.log;
    console.error = function () { };
    console.log = function () { };
    return [consoleErr, consoleLog]
}
export function restoreLogging(fns: Array<Function>) {
    console.error = fns[0] as any;
    console.log = fns[1] as any;
}

export function voxelBurnDateToTimestamp(timeInMinutes: number) {
    return new Date(timeInMinutes * 60 * 1000);
}
export function computeNextBurnDate(voxelBurnDate: number) {
    return new Date(voxelBurnDate * 60 * 1000 + 24 * 60 * 60 * 1000);
}