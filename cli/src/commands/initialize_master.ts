import { web3 } from '@project-serum/anchor';
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram } from '@solana/web3.js';
import { getAshMint, getTreasury, loadMortuaryProgram, loadWalletKey } from '../helpers/accounts';

export async function createMaster(
  keypair: string,
  env: string
) {

  // admin need to be the bank owner
  const admin = loadWalletKey(keypair);
  const program = await loadMortuaryProgram(admin, env);
  const connection = program.provider.connection;

  let ashMint = getAshMint(env);
  let treasury = getTreasury(env);

  //
  // Create instruction to 
  // - create bank account
  // - transfer some $ASH in it (from admin)
  let bankKeypair = new web3.Keypair();
  const createBankAccountIx = SystemProgram.createAccount({
    programId: TOKEN_PROGRAM_ID,
    space: AccountLayout.span,
    lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
    fromPubkey: admin.publicKey,
    newAccountPubkey: bankKeypair.publicKey
  });
  const initBankAccountIx = Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, ashMint, bankKeypair.publicKey, admin.publicKey);

  //
  // Initialize mortuary master account
  // - bank owner must equals initializer
  // - after initialization, the smart-contract owns the bank account
  //
  const [masterAccountPubkey, bump] = await web3.PublicKey.findProgramAddress(
    [admin.publicKey.toBuffer(), Buffer.from("master")],
    program.programId
  );
  await program.rpc.initializeMaster(bump,
    {
      accounts: {
        initializer: admin.publicKey,
        masterAccount: masterAccountPubkey,
        bank: bankKeypair.publicKey,
        treasury: treasury,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      instructions: [
        createBankAccountIx,
        initBankAccountIx
      ],
      signers: [admin, bankKeypair],
    }
  );

  console.log("Master account created");
  console.log("Bank account: " + bankKeypair.publicKey);
  console.log("Master account: " + masterAccountPubkey);
  console.log("You can know transfer some $ASH to the bank and schedule a go_live for the mortuary");

}
