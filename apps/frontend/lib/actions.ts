import { TOKEN_VESTING_PROGRAM_ID as TOKEN_VESTING_PROGRAM_ID_STR } from "@/config";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  createCreateInstruction,
  createInitInstruction,
  createUnlockInstruction,
} from "./instructions";
import {
  createAssociatedTokenAccount,
  findAssociatedTokenAddress,
} from "./solana-utils";
import { ContractInfo, Schedule } from "./state";

export const TOKEN_VESTING_PROGRAM_ID = new PublicKey(
  TOKEN_VESTING_PROGRAM_ID_STR
);

export async function create(
  connection: Connection,
  programId: PublicKey,
  seedWord: Buffer | Uint8Array,
  payer: PublicKey,
  sourceTokenOwner: PublicKey,
  possibleSourceTokenPubkey: PublicKey | null,
  destinationTokenPubkey: PublicKey,
  mintAddress: PublicKey,
  schedules: Array<Schedule>
): Promise<Array<TransactionInstruction>> {
  // If no source token account was given, use the associated source account
  if (possibleSourceTokenPubkey == null) {
    possibleSourceTokenPubkey = await findAssociatedTokenAddress(
      sourceTokenOwner,
      mintAddress
    );
  }
  console.log({ seedWord });

  // Find the non reversible public key for the vesting contract via the seed
  seedWord = seedWord.subarray(0, 31);
  console.log({ seedWord });

  const [vestingAccountKey, bump] = PublicKey.findProgramAddressSync(
    [seedWord],
    programId
  );
  console.log({ vestingAccountKey, bump });
  const vestingTokenAccountKey = await findAssociatedTokenAddress(
    vestingAccountKey,
    mintAddress
  );

  seedWord = Buffer.concat([seedWord, Buffer.from([bump])]);
  console.log({ seedWord });
  console.log(
    "Vesting contract account pubkey: ",
    vestingAccountKey.toBase58()
  );

  console.log("contract ID: ", bs58.encode(seedWord));

  const check_existing = await connection.getAccountInfo(vestingAccountKey);
  if (check_existing) {
    throw "Contract already exists.";
  }

  let instruction = [
    createInitInstruction(
      SystemProgram.programId,
      programId,
      payer,
      vestingAccountKey,
      [seedWord],
      schedules.length
    ),
    await createAssociatedTokenAccount(
      SystemProgram.programId,
      SYSVAR_CLOCK_PUBKEY,
      payer,
      vestingAccountKey,
      mintAddress
    ),
    createCreateInstruction(
      programId,
      TOKEN_PROGRAM_ID,
      vestingAccountKey,
      vestingTokenAccountKey,
      sourceTokenOwner,
      possibleSourceTokenPubkey,
      destinationTokenPubkey,
      mintAddress,
      schedules,
      [seedWord]
    ),
  ];
  return instruction;
}

export async function unlock(
  connection: Connection,
  programId: PublicKey,
  seedWord: Buffer | Uint8Array,
  mintAddress: PublicKey
): Promise<Array<TransactionInstruction>> {
  seedWord = seedWord.slice(0, 31);
  const [vestingAccountKey, bump] = await PublicKey.findProgramAddress(
    [seedWord],
    programId
  );
  seedWord = Buffer.from(seedWord.toString("hex") + bump.toString(16), "hex");

  const vestingTokenAccountKey = await findAssociatedTokenAddress(
    vestingAccountKey,
    mintAddress
  );

  const vestingInfo = await getContractInfo(connection, vestingAccountKey);

  let instruction = [
    createUnlockInstruction(
      programId,
      TOKEN_PROGRAM_ID,
      SYSVAR_CLOCK_PUBKEY,
      vestingAccountKey,
      vestingTokenAccountKey,
      vestingInfo.destinationAddress,
      [seedWord]
    ),
  ];

  return instruction;
}

export async function getContractInfo(
  connection: Connection,
  vestingAccountKey: PublicKey
): Promise<ContractInfo> {
  console.log("Fetching contract ", vestingAccountKey.toBase58());
  const vestingInfo = await connection.getAccountInfo(
    vestingAccountKey,
    "single"
  );
  if (!vestingInfo) {
    throw "Vesting contract account is unavailable";
  }
  const info = ContractInfo.fromBuffer(vestingInfo.data);
  if (!info) {
    throw "Vesting contract account is not initialized";
  }
  return info;
}
