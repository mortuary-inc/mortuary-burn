import * as anchor from '@project-serum/anchor';
import { Program, web3 } from '@project-serum/anchor';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import log from 'loglevel';
import { Mortuary } from '../idl/mortuary';
import mortuaryidl from '../idl/mortuary.json';

export const MORTUARY_PROGRAM_ID = new PublicKey(
    'minc9MLymfBSEs9ho1pUaXbQQPdfnTnxUvJa8TWx85E',
);

export function getTreasury(env: string) {
    if (env == "mainnet-beta") {
        return new PublicKey("hHF5RWHYKsLKhaKtw4yRFcLZm2JiruUGCh6buQ6pCuh");
    } else {
        return new PublicKey('DAXKsadqnVTLm7AXkqmZx6GBVQCqqsE6QTqiEdHDtDH4');
    }
}
export function getAshMint(env: string) {
    if (env == "mainnet-beta") {
        return new PublicKey("ASHTTPcMddo7RsYHEyTv3nutMWvK8S4wgFUy3seAohja");
    } else {
        return new PublicKey('3pS315UKoD5s9AQkaWJNaPSDPnCX6YZmV3thRCSgFo2u');
    }
}

export function loadWalletKey(keypair): Keypair {
    if (!keypair || keypair == '') {
        throw new Error('Keypair is required!');
    }
    const loaded = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString())),
    );
    log.info(`wallet public key: ${loaded.publicKey}`);
    return loaded;
}

export async function loadMortuaryProgram(walletKeyPair: Keypair, env: string) {

    let solConnection: web3.Connection;
    if (env == "localnet") {
        solConnection = new web3.Connection("http://127.0.0.1:8899", "confirmed");
    } else if (env == "mainnet-beta") {
        solConnection = new web3.Connection("https://api.metaplex.solana.com/", "confirmed");
    }
    else {
        // @ts-ignore
        solConnection = new web3.Connection(web3.clusterApiUrl(env));
    }

    const walletWrapper = new anchor.Wallet(walletKeyPair);
    const provider = new anchor.AnchorProvider(solConnection, walletWrapper, {
        preflightCommitment: 'recent',
    });

    const idl = mortuaryidl as any;
    const program = new anchor.Program(idl, MORTUARY_PROGRAM_ID, provider) as Program<Mortuary>;
    log.info('program id from anchor: ', program.programId.toBase58());
    return program;
}

const tempKeypair = Keypair.fromSecretKey(
    Uint8Array.from([
        208, 175, 150, 242, 88, 34, 108, 88, 177, 16, 168, 75, 115, 181, 199, 242, 120, 4, 78, 75, 19,
        227, 13, 215, 184, 108, 226, 53, 111, 149, 179, 84, 137, 121, 79, 1, 160, 223, 124, 241, 202,
        203, 220, 237, 50, 242, 57, 158, 226, 207, 203, 188, 43, 28, 70, 110, 214, 234, 251, 15, 249,
        157, 62, 80,
    ])
);

export function asToken(connection: web3.Connection, mintPubkey: PublicKey) {
    return new Token(connection, mintPubkey, TOKEN_PROGRAM_ID, tempKeypair);
}

export async function loadTokenAccountInfo(connection: web3.Connection, mintPubkey: PublicKey, tokenAccountPubkey: PublicKey) {
    const t = asToken(connection, mintPubkey);
    return t.getAccountInfo(tokenAccountPubkey);
}

export async function loadTokenMintInfo(connection: web3.Connection, mintPubkey: PublicKey) {
    const t = asToken(connection, mintPubkey);
    return t.getMintInfo();
}

export async function getAssociatedTokenAccount(connection: web3.Connection, mintPubkey: PublicKey, wallet: web3.PublicKey) {
    let t = asToken(connection, mintPubkey);
    let associated = await t.getOrCreateAssociatedAccountInfo(wallet);
    return associated;
}

export async function getTokenBalance(connection: web3.Connection, tokenAccountPubkey: PublicKey) {
    const balance = await connection.getTokenAccountBalance(tokenAccountPubkey);
    if (!balance.value.uiAmount) {
        return 0;
    }
    return balance.value.uiAmount;
}

export async function getTokenLargestAccount(connection: web3.Connection, mintPubkey: PublicKey) {
    const response = await connection.getTokenLargestAccounts(mintPubkey);
    let tokens = response.value;
    tokens.sort((a, b) => {
        return a.uiAmount - b.uiAmount;
    });
    return tokens[tokens.length - 1];
}

export async function getAccountBalance(connection: web3.Connection, pubkey: PublicKey) {
    const response = await connection.getBalance(pubkey);
    return response;
}
