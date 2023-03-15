import { Creator, keypairIdentity, Metaplex, Option, toOptionBigNumber } from "@metaplex-foundation/js";
import { Collection } from '@metaplex-foundation/mpl-token-metadata';
import { web3 } from "@project-serum/anchor";

export async function createMetaplexNft(connection: web3.Connection, wallet: web3.Keypair, index = 0, name = "solchicks", symbol = "SOLCHICKS") {
    let r = await createMetaplexNftFull(connection, wallet, [wallet.publicKey], index, name, symbol);
    return r;
}

export async function createMetaplexNftFull(connection: web3.Connection, wallet: web3.Keypair, creatorsPubkey: web3.PublicKey[],
    index = 0,
    name = "solchicks",
    symbol = "SOLCHICKS",
    extraArg = {
        maxSupply: 0,
        collectionKey: undefined,
    }) {

    const creators: Creator[] = [];
    let sum = 100;
    creatorsPubkey.forEach((k, idx) => {
        if (idx == (creatorsPubkey.length - 1)) {
            creators.push({
                address: k,
                verified: (k.toString() === wallet.publicKey.toString()),
                share: sum,
            });
        } else {
            creators.push({
                address: k,
                verified: (k.toString() === wallet.publicKey.toString()),
                share: 10,
            });
            sum -= 10;
        }
    });

    let collection: Option<Collection> = null;
    if (extraArg.collectionKey) {
        collection = extraArg.collectionKey;
    }

    const metaplex = new Metaplex(connection);
    metaplex.use(keypairIdentity(wallet));

    const uri = "https://arweave.net/LsQIqVGW3yFp3YSf5X1hxCMi11yBO2USveIl5UajjFE";
    const promise = metaplex
        .nfts()
        .create({
            uri,
            name: name + " #" + index,
            symbol: symbol,
            sellerFeeBasisPoints: 800,
            payer: wallet,
            updateAuthority: wallet,
            mintAuthority: wallet,
            creators: creators,
            maxSupply: toOptionBigNumber(extraArg.maxSupply),
            collection,
        })
        .run().then((v) => {

            let data = {
                txId: v.response.signature,
                mint: v.nft.mint.address,
                metadata: v.metadataAddress,
                edition: v.masterEditionAddress,
            };

            if (collection) {
                // verify the collection
                return metaplex
                    .nfts()
                    .verifyCollection(v.nft, {
                        collectionAuthority: wallet,
                    })
                    .run().then(() => {
                        return data;
                    })
            } else {
                return data;
            }

        });
    return promise;

}
