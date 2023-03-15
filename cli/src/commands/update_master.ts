import * as anchor from '@project-serum/anchor';
import { web3 } from '@project-serum/anchor';
import { loadMortuaryProgram, loadWalletKey } from '../helpers/accounts';

export async function updateMaster(keypair: string, env: string, goLive: anchor.BN, ashByBurn: number, frequency: number) {

    // admin need to be the bank owner
    const admin = loadWalletKey(keypair);
    const program = await loadMortuaryProgram(admin, env);

    let [masterAccount, bump] = await web3.PublicKey.findProgramAddress(
        [admin.publicKey.toBuffer(), Buffer.from("master")],
        program.programId
    );

    if(env == "devnet") {
        masterAccount = new web3.PublicKey("Hc3YMZqrHzWgGu84sBBFLjWzeYw76QdzzEoZvjKMKKJd");
    }
    if(env == "mainnet-beta") {
        masterAccount = new web3.PublicKey("4osPavVbxbBsCD3uaF8yuYmNgznNv79XCuAViX8AiDWM");
    }

    console.log("signer: " + admin.publicKey);
    console.log("master account: " + masterAccount);

    let activeChecks: anchor.BN = null;
    // let checks = 0xfffffff; // all checks on
    // let checks = 0xfffffff ^ 8; // relax signed creator rules
    // activeChecks = new anchor.BN(checks);

    // v2
    // frequency = 8 * 60; // 8h
    // ashByBurn = 5;
    // goLive = 2; // tax...

    // v3
    // - cooldown period: 24h
    // - on regular plot: 3 $ASH
    // - on boosted plot: 5 $ASH
    // - on public plot: owner get 1 $ASH, burner get 2 $ASH
    // - on boosted plot: owner get 2 $ASH, burner get 3 $ASH
    // 
    frequency = 24 * 60; // 24h
    ashByBurn = 3;
    goLive = 1; // tax...

    // let res = await program.rpc.updateMaster(new anchor.BN(goLive), frequency, ashByBurn, activeChecks, {
    //     accounts: {
    //         initializer: admin.publicKey,
    //         masterAccount: masterAccount,
    //     },
    //     signers: [admin],
    // });
    // console.log("Updated: tx: " + res);

    let account = await program.account.mortuaryMasterAccount.fetch(masterAccount);
    console.log("master account initializer: " + account.initializer);
    console.log("bank account: " + account.bank);
    console.log("master account goLiveDate: " + account.goLiveDate);
    console.log("master account burnFrequency: " + account.burnFrequency);
    console.log("master account ashByBurn: " + account.ashByBurn);

}
