import { web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { getTokenLargestAccount, getTreasury, loadMortuaryProgram, loadTokenAccountInfo, loadTokenMintInfo, loadWalletKey } from '../helpers/accounts';


export async function printInfo(keypair: string, env: string, adminPubkey: string, mintPubkey: string) {

    // admin need to be the bank owner
    const admin = loadWalletKey(keypair);
    const program = await loadMortuaryProgram(admin, env);
    const connection = program.provider.connection;

    if (adminPubkey == null) adminPubkey = admin.publicKey.toString();

    if (adminPubkey != null) {
        const [masterAccount, bump] = await web3.PublicKey.findProgramAddress(
            [new web3.PublicKey(adminPubkey).toBuffer(), Buffer.from("master")],
            program.programId
        );

        console.log("master account: " + masterAccount);

        let account = await program.account.mortuaryMasterAccount.fetchNullable(masterAccount);
        if (account == null) {
            throw Error("Unable to find the master account. Is mortuary initialized ? If you are not the admin, pass his address with --admin_pubkey <address>");
        }

        let goLive = new Date(account.goLiveDate.toNumber() * 1000);
        console.log("master account initializer: " + account.initializer);
        console.log("master account goLiveDate: " + account.goLiveDate + " / " + goLive.toUTCString());
        console.log("master account burnFrequency: " + account.burnFrequency);
        console.log("master account ashByBurn: " + account.ashByBurn);

        console.log("master account checks: 0x" + account.checks.toString(16));
        console.log("check has_metadata ? " + ((account.checks & 1) == 1));
        console.log("check burn_facility_live ? " + ((account.checks & 2) == 2));
        console.log("check voxel_burn_live ? " + ((account.checks & 4) == 4));
        console.log("check creator_signed ? " + ((account.checks & 8) == 8));

        let bankAccount = await connection.getParsedAccountInfo(account.bank);
        let parsedData = (bankAccount.value.data as web3.ParsedAccountData);
        console.log("bank account: " + account.bank);
        console.log("bank account mint: " + parsedData.parsed.info.mint);
        console.log("bank account owner (pda): " + parsedData.parsed.info.owner);
        console.log("bank account amount: " + parsedData.parsed.info.tokenAmount.uiAmount);

        let treasury = getTreasury(env);
        console.log("treasury account: " + treasury);
    }

    if (mintPubkey != null) {
        let mint = new PublicKey(mintPubkey);
        let mintInfo = await loadTokenMintInfo(connection, mint);
        console.log("mint: " + mint);
        console.log("mint supply: " + mintInfo.supply);
        console.log("mint mintAuthority: " + mintInfo.mintAuthority);
        console.log("mint freezeAuthority: " + mintInfo.freezeAuthority);

        let holder = await getTokenLargestAccount(connection, mint);
        console.log("holder: " + holder.address);
        console.log("holder supply: " + holder.uiAmount);

        let tokenInfo = await loadTokenAccountInfo(connection, mint, holder.address);
        console.log("holder token address: " + tokenInfo.address);
        console.log("holder token owner: " + tokenInfo.owner);
    }
}
