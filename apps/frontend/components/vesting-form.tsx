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
import { format } from "date-fns/format";
import { useEffect, useState } from "react";

interface Props {
  mintKey: string;
}
interface LocalSchedule {
  releaseTime: number;
  amount: number;
}

export default function VestingForm({ mintKey }: Props) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [mint, setMint] = useState<Mint | null>(null);
  const [account, setAccount] = useState<PublicKey | null>(null);
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState<string>("");
  const [destinationPubkey, setDestinationPubkey] = useState("");
  const [balance, setBalance] = useState(0);
  const [schedules, setSchedules] = useState<LocalSchedule[]>([]);

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
      schedules.length === 0 ||
      !mint ||
      !destinationPubkey
    ) {
      return;
    }
    try {
      const destPubkey = new PublicKey(destinationPubkey);
      const destinationAta = await getAssociatedTokenAddress(
        new PublicKey(mintKey),
        destPubkey
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
          destPubkey,
          new PublicKey(mintKey)
        );
        transaction.add(ix);
      }

      const parsedSchedules: Schedule[] = [];

      for (let schedule of schedules) {
        parsedSchedules.push(
          new Schedule(
            new Numberu64(schedule.releaseTime / 1000),
            new Numberu64(schedule.amount * Math.pow(10, mint.decimals))
          )
        );
      }
      const buffer = destPubkey.toBuffer();

      const ix = await create(
        connection,
        TOKEN_VESTING_PROGRAM_ID,
        buffer,
        publicKey,
        publicKey,
        account,
        destinationAta,
        mint.address,
        parsedSchedules
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
  const handleSchedule = () => {
    const newSchedule: LocalSchedule = {
      releaseTime: new Date(date).getTime(),
      amount: amount,
    };
    setSchedules([...schedules, newSchedule]);
    setAmount(0);
    setDate("");
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
          {schedules.map((schedule, i) => (
            <div key={i} className="flex flex-row gap-2">
              <span>
                Release Time: {new Date(schedule.releaseTime).toLocaleString()}
              </span>
              <span>{schedule.amount.toLocaleString()} Tokens</span>
            </div>
          ))}
          <h4 className="font-medium">Add a new schedule:</h4>
          <div className="flex flex-row gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="date">Release Date:</label>
              <input
                className="border px-4 py-2 rounded"
                type="date"
                name="date"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  const formattedDate = format(date, "yyyy-MM-dd");
                  setDate(formattedDate);
                }}
                value={date}
                id="date"
              />
            </div>
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
          </div>
          <button type="button" onClick={handleSchedule}>
            Add Schedule
          </button>

          <button disabled={schedules.length === 0} type="submit">
            Vest Tokens
          </button>
        </form>
      )}
    </div>
  );
}
