import * as anchor from '@project-serum/anchor';
import { web3 } from '@project-serum/anchor';
import { getAshMint, getAssociatedTokenAccount, loadMortuaryProgram, loadWalletKey } from '../helpers/accounts';

export async function withdrawMaster(keypair: string, env: string, amount: number, dest: string) {

    // admin need to be the bank owner
    const admin = loadWalletKey(keypair);
    const program = await loadMortuaryProgram(admin, env);
    const connection = program.provider.connection;

    if (dest == null) {
        dest = admin.publicKey.toString();
    }

    const [masterAccount, bump] = await web3.PublicKey.findProgramAddress(
        [admin.publicKey.toBuffer(), Buffer.from("master")],
        program.programId
    );

    console.log("master account: " + masterAccount);

    let destWallet = new web3.PublicKey(dest);
    let ashMint = getAshMint(env);
    let ashTokenAccount = await getAssociatedTokenAccount(connection, ashMint, destWallet);

    console.log("destination wallet: " + destWallet.toString());
    console.log("destination ash account: " + ashTokenAccount.address.toString());

    let masterAccountInfo = await program.account.mortuaryMasterAccount.fetchNullable(masterAccount);
    let bank = masterAccountInfo.bank;

    const [pda, _nonce] = await web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("mortuary"))],
        program.programId
    );

    console.log("$ash to transfer: " + amount);

    // await program.rpc.withdrawMaster(new anchor.BN(amount),
    //     {
    //         accounts: {
    //             masterAccount: masterAccount,
    //             initializer: admin.publicKey,
    //             ownerTokenAccount: ashTokenAccount.address,
    //             bank: bank,
    //             pdaAccount: pda,
    //             tokenProgram: TOKEN_PROGRAM_ID,
    //         },
    //         signers: [admin],
    //     }
    // );

    console.log("transfer executed");
}
