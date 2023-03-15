import { keypairIdentity, Metaplex, Nft } from '@metaplex-foundation/js';
import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { SystemProgram } from '@solana/web3.js';
import { Mortuary } from '../target/types/mortuary';
import { creator1, getMasterEditionAddress, getMetadataAddress, getVoxelBurnAddress } from './accounts';
import { createMetaplexNft, createMetaplexNftFull } from './nftcreator';

export async function airDrop(connection: web3.Connection, who: web3.PublicKey, amount: number) {
    let balance = (await connection.getBalance(who) / web3.LAMPORTS_PER_SOL);
    if (balance > amount) return;

    await connection.confirmTransaction(
        await connection.requestAirdrop(who, 2 * amount * web3.LAMPORTS_PER_SOL),
        "confirmed"
    );
}

export async function getTokenWalletAddress(wallet: web3.PublicKey, mint: web3.PublicKey) {
    const adr = await web3.PublicKey.findProgramAddress([wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID)
    return adr[0];
}

export async function createNftCollection(connection: web3.Connection, creator: web3.Keypair, name: string, quantity: number) {
    let promises: Array<Promise<{ mint: web3.PublicKey }>> = [];
    for (let i = 0; i < quantity; i++) {
        let nft = createMetaplexNft(connection, creator, i, name, name.toUpperCase());
        promises.push(nft);
    }
    const nfts = await Promise.all(promises);
    return nfts;
}
export async function createVerifiedNftCollection(connection: web3.Connection, creator: web3.Keypair, name: string, quantity: number) {

    const metaplex = new Metaplex(connection);
    metaplex.use(keypairIdentity(creator));
    const { nft } = await metaplex.nfts().create({
        uri: "https://",
        name: "MyCollection",
        sellerFeeBasisPoints: 200,
        isCollection: true,
        payer: creator,
        updateAuthority: creator,
        mintAuthority: creator,
    }).run();

    let collection = nft as Nft;

    let promises: Array<Promise<{ mint: web3.PublicKey }>> = [];
    for (let i = 0; i < quantity; i++) {
        let nft = createMetaplexNftFull(connection, creator, [creator.publicKey], i, name, name.toUpperCase(), { collectionKey: collection.address, maxSupply: 0 });
        promises.push(nft);
    }
    const nfts = await Promise.all(promises);
    return { nfts, collection };
}

export async function createNonMetaplexNft(connection: web3.Connection, feePayer: web3.Keypair, owner: web3.PublicKey) {
    let authority = new web3.Keypair();
    let mint = await Token.createMint(
        connection,
        feePayer, // fee payer
        authority.publicKey, // mintAuthority
        authority.publicKey, // freezeAuthority
        0,
        TOKEN_PROGRAM_ID);
    let account = await mint.createAssociatedTokenAccount(owner);
    await mint.mintTo(
        account,
        authority.publicKey,
        [authority],
        1
    );
    mint.setAuthority(mint.publicKey, null, 'MintTokens', authority.publicKey, [authority]);
    return {
        mint,
        account
    };
}


export async function getOwnedTokenAccounts(connection: web3.Connection, publicKey: web3.PublicKey) {
    let resp = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
    let data = resp.value.map(({ pubkey, account }) => {
        return {
            publicKey: new web3.PublicKey(pubkey),
            accountInfo: {
                mint: account.data.parsed.info.mint,
                amount: account.data.parsed.info.tokenAmount.amount,
                decimals: account.data.parsed.info.tokenAmount.decimals
            }
        }
    });
    return data;
}


export async function transferNft(connection: web3.Connection, mint: web3.PublicKey, owner: web3.Keypair, destination: web3.PublicKey) {
    let token = new Token(connection, mint, TOKEN_PROGRAM_ID, owner);
    var fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(owner.publicKey);
    var toTokenAccount = await token.getOrCreateAssociatedAccountInfo(destination);
    let res = await token.transfer(fromTokenAccount.address, toTokenAccount.address, owner, [], 1);
    return toTokenAccount;
}



//
// NEED to set all  this global variable
//

let connection: web3.Connection;
let admin: web3.Keypair;
let treasury: web3.Keypair;
let pinpin: web3.Keypair;
let program: Program<Mortuary>;
let masterAccountPubkey: web3.PublicKey;
let ashMintPubkey: web3.PublicKey;
let solchicks: { mint: anchor.web3.PublicKey; }[];
let solchicksVerified: { mint: anchor.web3.PublicKey; }[];

export function setTestHelperGlobals(program0: Program<Mortuary>,
    connection0: web3.Connection,
    admin0: web3.Keypair,
    treasury0: web3.Keypair,
    pinpin0: web3.Keypair,
    masterAccountPubkey0: web3.PublicKey,
    ashMintPubkey0: web3.PublicKey,
    solchicks0: { mint: anchor.web3.PublicKey; }[],
) {
    program = program0;
    connection = connection0;
    admin = admin0;
    treasury = treasury0;
    pinpin = pinpin0;
    masterAccountPubkey = masterAccountPubkey0;
    ashMintPubkey = ashMintPubkey0;
    solchicks = solchicks0;
}


export function setVerifiedCollection(solchicks0: { mint: anchor.web3.PublicKey; }[]) {
    solchicksVerified = solchicks0;
}

// Create a new Voxel nft + transfer to "owner"
export async function createMortuaryVoxelNft(index: number, size: number, newOwner: web3.PublicKey) {
    //
    let nft = await createMetaplexNftFull(connection, treasury, [pinpin.publicKey, treasury.publicKey], index, "Mortuary Inc Plot x" + size, "VOX");
    await connection.confirmTransaction(nft.txId, "confirmed");
    let mint = nft.mint;
    let mintAccount = await transferNft(connection, mint, treasury, newOwner);
    return {
        mint, mintAccount
    };
}

export async function initializeVoxelBurn(user: web3.Keypair, plotSize: number) {
    let { mint: voxelMint, mintAccount: voxelAccount } = await createMortuaryVoxelNft(2000, plotSize, user.publicKey);
    let [burnAccount, burnBump] = await getVoxelBurnAddress(voxelMint);
    let voxelMetadata = await getMetadataAddress(voxelMint);
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
                systemProgram: web3.SystemProgram.programId,
            },
            signers: [
                user
            ]
        }
    );
    return { voxelMint, voxelAccount: voxelAccount.address, voxelMetadata, voxelBurnAccount: burnAccount, voxelBurnBump: burnBump };
}

export async function buyRuggedNft(userPk: web3.PublicKey) {
    let nft = solchicks.pop();
    let mintTokenAccount = await transferNft(connection, nft.mint, creator1, userPk);
    let metadata = await getMetadataAddress(mintTokenAccount.mint);
    let edition = await getMasterEditionAddress(mintTokenAccount.mint);
    return { ruggedNftTokenAccount: mintTokenAccount, ruggedNftMetadata: metadata, ruggedNftEdition: edition };
}

export async function buyRuggedNftVerifiedCollection(userPk: web3.PublicKey) {
    let nft = solchicksVerified.pop();
    let mintTokenAccount = await transferNft(connection, nft.mint, creator1, userPk);
    let metadata = await getMetadataAddress(mintTokenAccount.mint);
    let edition = await getMasterEditionAddress(mintTokenAccount.mint);
    return { ruggedNftTokenAccount: mintTokenAccount, ruggedNftMetadata: metadata, ruggedNftEdition: edition };
}

export async function createAshTokenAccount(user: web3.Keypair) {
    // Create account for user1 to hold some $ASH
    let ashMintToken = new Token(connection, ashMintPubkey, TOKEN_PROGRAM_ID, user);
    let userAshTokenAccount = await ashMintToken.createAssociatedTokenAccount(user.publicKey);
    return { ashToken: ashMintToken, ashTokenAccount: userAshTokenAccount };
}

export async function initBurnAccount(user: web3.Keypair, burnBump: number, plotSize: number, voxelMint: web3.PublicKey, voxelAccount: web3.PublicKey, voxelMetadata: web3.PublicKey, burnAccount: web3.PublicKey) {
    let r = await program.rpc.initializeVoxelBurn(
        burnBump,
        plotSize,
        {
            accounts: {
                masterAccount: masterAccountPubkey,
                user: user.publicKey,
                voxelMint: voxelMint,
                voxelAccount: voxelAccount,
                voxelMetadata: voxelMetadata,
                voxelBurnAccount: burnAccount,
                systemProgram: SystemProgram.programId,
            },
            signers: [
                user
            ]
        }
    );
    return r;
}

export async function updateChecks(test: number) {
    let r = await program.rpc.updateMaster(null, null, null, new anchor.BN(test), {
        accounts: {
            initializer: admin.publicKey,
            masterAccount: masterAccountPubkey,
        },
        signers: [admin],
    });
    return r;
}

export function u64ToNumber(v: u64): number {
    return (v as any).toNumber();
}

export async function getTokenBalance(token: Token, account: web3.PublicKey) {
    let info = await token.getAccountInfo(account);
    return u64ToNumber(info.amount);
}