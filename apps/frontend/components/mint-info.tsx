"use client";
import { useMintContext } from "@/hooks/use-mint-context";
import {
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui/button";

interface Props {
  mintKey: string;
}

export default function MintInfo({ mintKey }: Props) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [amount, setAmount] = useState(0);
  const { account, mint, balance } = useMintContext();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("mint tokens");

    if (!publicKey || !account || !signTransaction || amount === 0 || !mint) {
      return;
    }
    try {
      const transaction = new Transaction();

      const ix = createAssociatedTokenAccountInstruction(
        publicKey,
        account,
        publicKey,
        new PublicKey(mintKey)
      );

      const mintIx = createMintToInstruction(
        new PublicKey(mintKey),
        account,
        publicKey,
        amount * 10 ** mint.decimals
      );

      const { blockhash } = await connection.getLatestBlockhash();
      const accountInfo = await connection.getAccountInfo(account);
      if (!accountInfo) {
        transaction.add(ix);
      }
      transaction.add(mintIx);
      transaction.feePayer = publicKey;
      transaction.recentBlockhash = blockhash;
      const signedTx = await signTransaction(transaction);
      const tx = await connection.sendRawTransaction(signedTx.serialize());
      console.log(tx);
    } catch (e) {
      console.log(e);
    }
  };
  if (!publicKey || !mint) {
    return <>Loading...</>;
  }

  return (
    <div className="mt-10 grid place-items-center gap-4">
      <h2 className="text-xl font-medium">Mint Tokens</h2>
      <p>Current Balance: {balance.toLocaleString()}</p>

      {mint && mint.mintAuthority?.equals(publicKey) && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label>Add the amount here:</label>
            <input
              type="number"
              placeholder="10000"
              className="border px-4 py-2 rounded"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <Button disabled={amount === 0} type="submit">
            Mint
          </Button>
        </form>
      )}
      <Button asChild variant={"secondary"}>
        <Link href={"/mint/" + mintKey + "/vesting"}>Distribute Tokens</Link>
      </Button>
    </div>
  );
}
