"use client";
import {
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMint,
  Mint,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Props {
  mintKey: string;
}

export default function MintInfo({ mintKey }: Props) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [mint, setMint] = useState<Mint | null>(null);
  const [account, setAccount] = useState<PublicKey | null>(null);
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!mintKey || !publicKey) {
      return;
    }
    (async () => {
      try {
        const mint = await getMint(connection, new PublicKey(mintKey));
        setMint(mint);
        const account = await getAssociatedTokenAddress(
          new PublicKey(mintKey),
          publicKey
        );
        setAccount(account);
        const balance = await connection.getTokenAccountBalance(account);
        if (balance) {
          setBalance(balance.value.uiAmount!);
        }
      } catch (e) {
        console.log(e);
      }
    })();
  }, [mintKey, publicKey]);

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
          <button disabled={amount === 0} type="submit">
            Mint
          </button>
        </form>
      )}
      <Link href={"/mint/" + mintKey + "/vesting"}>Distribute Tokens</Link>
    </div>
  );
}
