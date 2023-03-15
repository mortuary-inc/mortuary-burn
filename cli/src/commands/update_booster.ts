import { web3 } from '@project-serum/anchor';
import { loadMortuaryProgram, loadWalletKey } from '../helpers/accounts';

export async function updateBooster(keypair: string, env: string, boosterPubkey: string) {

    // devnet
    // npx ts-node src/cli.ts update_booster -e devnet -k ~/.config/solana/devnet2.json -b 5tUuKze2RpKmmttEYqqSVE9weBAiEDqd8pEC767LasUH

    // admin need to be the bank owner
    const admin = loadWalletKey(keypair);
    const program = await loadMortuaryProgram(admin, env);

    let booster = new web3.PublicKey(boosterPubkey);
    let readonly = false;

    if (!readonly) {

        let id: number;
        let name: string;
        let ashMultiplicator = null;
        let ashByBurn = 2;
        let ashIfBurn = 100;
        let checkSigned = true;

        let creator: web3.PublicKey;
        if (env == "devnet") {
            // devnet
            if (boosterPubkey == "CunfEH5RQdzznJ8d5cEu4WNGr6rRUVSKKkMpCUiwyBsp") {
                // minion
                creator = new web3.PublicKey("EM1EoqaEo2Z9dudCBcQ84jmcsBs15RwWQj7ZzrUAXYhw");
                id = 1;
                name = "Minion";
            } else {
                // all plots
                if (boosterPubkey == "5tUuKze2RpKmmttEYqqSVE9weBAiEDqd8pEC767LasUH") {
                    id = 2;
                    name = "Plot x2";
                    ashIfBurn = 20;
                    creator = new web3.PublicKey("AdjEKpWD99Qgi7QnqTrWshAuzjwxcCioPSG2gjFZxHUK");
                } else if (boosterPubkey == "2YdMgGQQyH6fMZTe2NaCaoN7cQqErCePR1rVdT7qN58j") {
                    id = 3;
                    name = "Plot x4";
                    ashIfBurn = 40;
                    creator = new web3.PublicKey("AdjEKpWD99Qgi7QnqTrWshAuzjwxcCioPSG2gjFZxHUK");
                }
            }

            checkSigned = false;
        } else {

            // Minion  : qN4uHs7smua2niyRimWfAp2yrsdjfZxNdgQWzjMPL2P
            // Plot  x2: 8UkeeqkHwUbW1sJ38dfH4mfXaX3hjB3uhXQ4DvdBMArS
            // Plot  x4: G7mqY8jdqz9VL32APRbCiGg8FMfGWuuA3KQxM5QBGaSX
            // Plot  x6: HebFB7g8QrJ36X5QvtSfJyiBJBDZWTpU3gDHiPQkC7M7
            // Plot  x8: 8MyMp6LKoaaTjAGamTagvdbBTjQzWsjVNBDpLswcdiSC
            // Plot x10: 39ivN6RYqJ5eFw719bNPbfGyFRFuYssKvHkDKyLjhqr9

            // mainnet
            if (boosterPubkey == "qN4uHs7smua2niyRimWfAp2yrsdjfZxNdgQWzjMPL2P") {
                // minion
                creator = new web3.PublicKey("51iJycnBCAVqmrssYVXq2LrZTcEnEBkYaGHNpyG4hkJK");
                id = 1;
                name = "Minion";
                ashIfBurn = 100;
            } else {
                // all plots
                creator = new web3.PublicKey("J4KqpehX1BB9SG3vC5BvGCZQ5zKszuSR5FLubqiJ4nct");

                if (boosterPubkey == "8UkeeqkHwUbW1sJ38dfH4mfXaX3hjB3uhXQ4DvdBMArS") {
                    // x2
                    id = 2;
                    name = "Plot x2";
                    ashIfBurn = 100;
                } else if (boosterPubkey == "G7mqY8jdqz9VL32APRbCiGg8FMfGWuuA3KQxM5QBGaSX") {
                    // x4
                    id = 3;
                    name = "Plot x4";
                    ashIfBurn = 200;
                } else if (boosterPubkey == "HebFB7g8QrJ36X5QvtSfJyiBJBDZWTpU3gDHiPQkC7M7") {
                    // x4
                    id = 4;
                    name = "Plot x6";
                    ashIfBurn = 500;
                } else if (boosterPubkey == "8MyMp6LKoaaTjAGamTagvdbBTjQzWsjVNBDpLswcdiSC") {
                    // x4
                    id = 5;
                    name = "Plot x8";
                    ashIfBurn = 1000;
                } else if (boosterPubkey == "39ivN6RYqJ5eFw719bNPbfGyFRFuYssKvHkDKyLjhqr9") {
                    // x10
                    id = 6;
                    name = "Plot x10";
                    ashIfBurn = 5000;
                }
            }
            booster = new web3.PublicKey(boosterPubkey);
        }

        if (!id) throw new Error("No id");
        if (!name) throw new Error("No name");
        if (!creator) throw new Error("No creator");

        //     "name": "id",
        //     "name": "creator",
        //     "name": "name",
        //     "name": "ashMultiplicator",
        //     "name": "ashByBurn",
        //     "name": "ashIfBurn",
        //     "name": "checkSigned",

        // Update the booster to have data
        await program.rpc.updateBooster(
            id, creator, name, ashMultiplicator, ashByBurn, ashIfBurn, checkSigned,
            {
                accounts: {
                    booster: booster,
                    initializer: admin.publicKey,
                },
                signers: [admin],
            }
        );
    }

    // await program.rpc.updateBooster(
    //     id, null, null, null, ashByBurn, null, null,
    //     {
    //         accounts: {
    //             booster: booster,
    //             initializer: admin.publicKey,
    //         },
    //         signers: [admin],
    //     }
    // );
    // console.log("booster updated: " + booster);

    let b = await program.account.boosterAccount.fetch(booster) as any;
    console.log("data: " + JSON.stringify(b));
    console.log("address: " + booster.toBase58());
    console.log("creator: " + (b.creator ? b.creator.toString() : null));
    console.log("name: " + b.name ? String.fromCharCode(...b.name) : "");
    console.log("ashByBurn: " + b.ashByBurn);
    console.log("ashIfBurn: " + b.ashIfBurn);
    console.log("checkSigned: " + b.checkSigned);
}
