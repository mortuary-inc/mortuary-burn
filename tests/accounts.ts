import { web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export const user1 = web3.Keypair.fromSecretKey(
    Uint8Array.from([49, 11, 246, 59, 46, 84, 125, 62, 13, 11, 130, 173, 218, 112, 28, 55, 177, 66, 170, 123, 171, 59, 161, 136, 127, 234, 132, 17, 181, 129, 38, 121, 7, 36, 48, 121, 211, 149, 118, 43, 174, 82, 41, 103, 62, 247, 73, 190, 78, 237, 161, 148, 229, 170, 88, 220, 8, 229, 58, 107, 197, 240, 24, 218])
);
export const creator1 = web3.Keypair.fromSecretKey(
    Uint8Array.from([67, 165, 216, 10, 38, 101, 113, 198, 47, 17, 222, 72, 146, 177, 194, 148, 207, 16, 47, 253, 5, 139, 82, 189, 106, 111, 153, 255, 116, 163, 119, 183, 169, 192, 130, 204, 10, 254, 141, 143, 200, 48, 8, 208, 52, 232, 24, 60, 189, 76, 24, 2, 243, 39, 178, 91, 199, 197, 167, 97, 37, 141, 128, 224])
);
export const creator2 = web3.Keypair.fromSecretKey(
    Uint8Array.from([16, 186, 243, 146, 136, 96, 122, 254, 69, 1, 47, 198, 113, 134, 40, 55, 42, 23, 193, 188, 243, 187, 121, 91, 244, 113, 217, 100, 251, 143, 114, 200, 176, 12, 229, 28, 50, 38, 241, 184, 215, 57, 112, 2, 223, 255, 7, 203, 53, 201, 203, 140, 228, 224, 68, 84, 13, 124, 73, 176, 115, 253, 180, 58])
);
export const admin = web3.Keypair.fromSecretKey(
    Uint8Array.from([70, 239, 229, 31, 251, 149, 126, 61, 114, 77, 207, 197, 169, 82, 213, 141, 240, 18, 190, 152, 246, 212, 70, 209, 136, 166, 41, 221, 9, 222, 118, 95, 242, 217, 228, 167, 49, 186, 149, 9, 3, 21, 99, 207, 37, 100, 128, 223, 18, 54, 67, 112, 221, 163, 127, 24, 190, 64, 38, 130, 19, 113, 23, 147])
);

export const leaked_key = web3.Keypair.fromSecretKey(
    Uint8Array.from([49, 11, 246, 59, 46, 84, 125, 62, 13, 11, 130, 173, 218, 112, 28, 55, 177, 66, 170, 123, 171, 59, 161, 136, 127, 234, 132, 17, 181, 129, 38, 121, 7, 36, 48, 121, 211, 149, 118, 43, 174, 82, 41, 103, 62, 247, 73, 190, 78, 237, 161, 148, 229, 170, 88, 220, 8, 229, 58, 107, 197, 240, 24, 218])
);

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const MORTUARY_PROGRAM_ID = new PublicKey(
    "minc9MLymfBSEs9ho1pUaXbQQPdfnTnxUvJa8TWx85E"
);

export async function getMetadataAddress(mint: web3.PublicKey): Promise<web3.PublicKey> {
    const adr = await web3.PublicKey.findProgramAddress([Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(),], TOKEN_METADATA_PROGRAM_ID)
    return adr[0];
};

export async function getMasterEditionAddress(mint: web3.PublicKey): Promise<web3.PublicKey> {
    const adr = await web3.PublicKey.findProgramAddress([Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition"),], TOKEN_METADATA_PROGRAM_ID)
    return adr[0];
};

export async function getVoxelBurnAddress(mint: web3.PublicKey) {
    const adr = await web3.PublicKey.findProgramAddress([MORTUARY_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("voxelburn"),], MORTUARY_PROGRAM_ID)
    return adr;
};