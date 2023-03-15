#!/usr/bin/env ts-node
import * as anchor from '@project-serum/anchor';
import { program } from 'commander';
import log from 'loglevel';
import { createBooster } from './commands/create_booster';
import { createMaster } from './commands/initialize_master';
import { printInfo } from './commands/print_info';
import { updateBooster } from './commands/update_booster';
import { updateMaster } from './commands/update_master';
import { withdrawMaster } from './commands/withdraw_master';

log.setLevel(log.levels.INFO);

programCommand('create_master')
  .action(async (directory, cmd) => {

    const { keypair, env } = cmd.opts();
    console.log("create master account");
    await createMaster(keypair, env);
    console.log("done");
  });

programCommand('update_master')
  .option('-d, --date <string>', 'timestamp - eg "04 Dec 1995 00:12:00 GMT" or "now"',)
  .option('-a, --ash <string>', '$ASH to get back on burn')
  .option('-f, --frequency <string>', 'Burn frequency in seconds')
  .action(async (directory, cmd) => {

    const { keypair, env, date, ash, frequency } = cmd.opts();

    console.log("update master account");
    const goLive = date ? new anchor.BN(parseDate(date)) : null;
    const ashn = ash ? parseInt(ash) : null;
    const frequencyn = frequency ? parseInt(frequency) : null;

    await updateMaster(keypair, env, goLive, ashn, frequencyn);

    console.log("done");
  });

programCommand('withdraw_master')
  .option('-a, --amount <number>', 'token amount to transfer to bank',)
  .option('-w, --wallet <wallet>', 'wallet that will get the ash',)
  .action(async (directory, cmd) => {

    const { keypair, env, amount, wallet } = cmd.opts();
    const amountn = parseInt(amount);
    if (Number.isNaN(amountn)) throw Error("Amount invalid");

    await withdrawMaster(keypair, env, amountn, null);
  });

programCommand('print_info')
  .option('-m, --admin_pubkey <pubkey>', 'Admin pubkey (optional)')
  .option('-n, --nft <pubkey>', 'NFT/mint to get info (optional)')
  .action(async (directory, cmd) => {
    const { keypair, env, admin_pubkey, nft } = cmd.opts();
    await printInfo(keypair, env, admin_pubkey, nft);
  });


  programCommand('create_booster')
  .action(async (directory, cmd) => {

    const { keypair, env } = cmd.opts();
    console.log("create booster");
    await createBooster(keypair, env);
    console.log("done");
  });

programCommand('update_booster')
  .option('-b, --booster <booster>', 'booster pubkey',)
  .action(async (directory, cmd) => {

    const { keypair, env, booster } = cmd.opts();

    console.log("update booster");
    await updateBooster(keypair, env, booster);

    console.log("done");
  });

function programCommand(name: string) {
  return program
    .command(name)
    .option(
      '-e, --env <string>',
      'Solana cluster env name',
      'devnet', //mainnet-beta, testnet, devnet
    )
    .option(
      '-k, --keypair <path>',
      `Solana wallet location`,
      '../../../.config/solana/devnet.json',
    )
    .option('-l, --log-level <string>', 'log level', setLogLevel)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setLogLevel(value, prev) {
  if (value === undefined || value === null) {
    return;
  }
  log.info('setting the log value to: ' + value);
  log.setLevel(value);
}

program.parse(process.argv);


function parseDate(date: any) {
  if (date === 'now') {
    return Date.now() / 1000;
  }
  return Date.parse(date) / 1000;
}

