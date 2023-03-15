import { web3 } from '@project-serum/anchor';
import { SystemProgram } from '@solana/web3.js';
import { loadMortuaryProgram, loadWalletKey } from '../helpers/accounts';

export async function createBooster(
  keypair: string,
  env: string
) {

  // admin need to be the bank owner
  const admin = loadWalletKey(keypair);
  const program = await loadMortuaryProgram(admin, env);
  const connection = program.provider.connection;

  // Get master account
  const [masterAccountPubkey, bump] = await web3.PublicKey.findProgramAddress(
    [admin.publicKey.toBuffer(), Buffer.from("master")],
    program.programId
  );

  console.log("Creating booster");
  console.log("Master account pubkey: " + masterAccountPubkey.toBase58());

  let booster = web3.Keypair.generate();

  // Create a booster
  let tx = await program.rpc.createBooster(
    {
      accounts: {
        booster: booster.publicKey,
        masterAccount: masterAccountPubkey,
        initializer: admin.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [admin, booster],
    }
  );

  console.log("Booster created, tx: " + tx);
  console.warn("Save the account id somewhere: " + booster.publicKey);
}
