"use client";
import { create, TOKEN_VESTING_PROGRAM_ID } from "@/lib/actions";
import { Numberu64 } from "@/lib/solana-utils";
import { Schedule } from "@/lib/state";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getMint,
  Mint,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useEffect, useState } from "react";

interface Props {
  mintKey: string;
}

export default function VestingForm({ mintKey }: Props) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [mint, setMint] = useState<Mint | null>(null);
  const [account, setAccount] = useState<PublicKey | null>(null);
  const [amount, setAmount] = useState(0);
  const [destinationPubkey, setDestinationPubkey] = useState("");
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

    if (
      !publicKey ||
      !account ||
      !signTransaction ||
      amount === 0 ||
      !mint ||
      !destinationPubkey
    ) {
      return;
    }
    try {
      const destinationAta = await getAssociatedTokenAddress(
        new PublicKey(mintKey),
        new PublicKey(destinationPubkey)
      );
      console.log(destinationAta.toBase58());
      const destinationAccount = await connection.getAccountInfo(
        destinationAta
      );

      const transaction = new Transaction();

      if (!destinationAccount) {
        const ix = createAssociatedTokenAccountInstruction(
          publicKey,
          destinationAta,
          new PublicKey(destinationPubkey),
          new PublicKey(mintKey)
        );
        transaction.add(ix);
      }
      const DATES = [
        new Date(2024, 9, 8),
        new Date(2024, 9, 9),
        new Date(2024, 9, 10),
        new Date(2024, 9, 11),
        new Date(2024, 9, 12),
        new Date(2024, 9, 13),
        new Date(2024, 9, 14),
        new Date(2024, 9, 15),
        new Date(2024, 9, 16),
        new Date(2024, 9, 17),
        new Date(2024, 9, 18),
        new Date(2024, 9, 19),
        new Date(2024, 9, 20),
        new Date(2024, 9, 21),
        new Date(2024, 9, 22),
        new Date(2024, 9, 23),
        new Date(2024, 9, 24),
        new Date(2024, 9, 25),
        new Date(2024, 9, 26),
        new Date(2024, 9, 27),
        new Date(2024, 9, 28),
        new Date(2024, 9, 29),
        new Date(2024, 9, 30),
        new Date(2024, 10, 1),
      ];

      const schedules: Schedule[] = [];

      for (let date of DATES) {
        schedules.push(
          new Schedule(
            new Numberu64(date.getTime() / 1_000),
            new Numberu64(amount * Math.pow(10, mint.decimals))
          )
        );
      }
      const buffer = Buffer.from("seed");
      const result = new Uint8Array(32);
      result.set(buffer.subarray(0, 32));

      const ix = await create(
        connection,
        TOKEN_VESTING_PROGRAM_ID,
        result,
        publicKey,
        publicKey,
        account,
        destinationAta,
        mint.address,
        schedules
      );

      transaction.add(...ix);

      const { blockhash } = await connection.getLatestBlockhash();

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
      <h2 className="text-xl font-medium">Token Vesting</h2>
      <p>Current Balance: {balance.toLocaleString()}</p>

      {mint && mint.mintAuthority?.equals(publicKey) && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="amount">Add the amount here:</label>
            <input
              name="amount"
              id="amount"
              type="number"
              placeholder="10000"
              className="border px-4 py-2 rounded"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="destination">Destination Pubkey</label>
            <input
              type="text"
              name="destination"
              id="destination"
              placeholder="Pubkey1111111"
              className="border px-4 py-2 rounded"
              value={destinationPubkey}
              onChange={(e) => setDestinationPubkey(e.target.value)}
            />
          </div>
          <button disabled={amount === 0} type="submit">
            Vest Tokens
          </button>
        </form>
      )}
    </div>
  );
}
