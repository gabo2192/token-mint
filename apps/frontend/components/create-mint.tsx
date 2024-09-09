"use client";
import {
  createInitializeMintInstruction,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export default function CreateMint() {
  const { connection } = useConnection();
  const { publicKey, wallet, signTransaction } = useWallet();
  const router = useRouter();
  const handleMint = async () => {
    console.log("Initialize");
    if (!publicKey || !wallet || !signTransaction) {
      return;
    }
    try {
      const transaction = new Transaction();
      const mintKeypair = Keypair.generate();
      const lamports = await connection.getMinimumBalanceForRentExemption(
        MINT_SIZE
      );

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        })
      );
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          9, // 9 decimals
          publicKey,
          publicKey,
          TOKEN_PROGRAM_ID
        )
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      transaction.partialSign(mintKeypair);
      const tx = await signTransaction(transaction);
      const txID = await connection.sendRawTransaction(tx.serialize());
      console.log(txID);
      console.log(mintKeypair.publicKey.toBase58());
      router.push(`/mint/${mintKeypair.publicKey.toBase58()}`);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <div className="mt-10">
        <Button onClick={handleMint}>Create Mint</Button>
      </div>
    </>
  );
}
