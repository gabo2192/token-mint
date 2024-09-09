"use client";

import { TOKEN_VESTING_PROGRAM_ID, unlock } from "@/lib/actions";
import { findAssociatedTokenAddress } from "@/lib/solana-utils";
import { ContractInfo } from "@/lib/state";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useEffect, useState } from "react";

interface Props {
  params: {
    slug: string;
  };
}

export default function Page({ params: { slug } }: Props) {
  console.log(slug);
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [info, setInfo] = useState<ContractInfo | null>(null);
  const [balance, setBalance] = useState(0);
  useEffect(() => {
    const fetchAccount = async () => {
      if (!publicKey) return;
      let seedWord = publicKey.toBuffer();
      seedWord = seedWord.subarray(0, 31);

      const [vestingAccountKey, bump] = PublicKey.findProgramAddressSync(
        [seedWord],
        TOKEN_VESTING_PROGRAM_ID
      );
      const vestingTokenAccountKey = await findAssociatedTokenAddress(
        vestingAccountKey,
        new PublicKey(slug)
      );

      const vestingInfo = await connection.getAccountInfo(
        vestingAccountKey,
        "single"
      );
      if (!vestingInfo) {
        console.log("No vesting account found");
        return;
      }
      const info = ContractInfo.fromBuffer(vestingInfo.data);
      if (!info) {
        console.log("No contract info found");
        return;
      }
      setInfo(info);
      const tokenBalance = await connection.getTokenAccountBalance(
        vestingTokenAccountKey
      );
      if (tokenBalance && tokenBalance.value.uiAmount) {
        setBalance(tokenBalance.value.uiAmount);
      }
    };
    fetchAccount();
  }, [publicKey]);

  const handleClaim = async () => {
    console.log("claim");
    if (!publicKey || !signTransaction) return;
    const ix = await unlock(
      connection,
      TOKEN_VESTING_PROGRAM_ID,
      publicKey.toBuffer(),
      new PublicKey(slug)
    );
    const tx = new Transaction().add(...ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = publicKey;
    try {
      const signedTx = await signTransaction(tx);
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      );
      console.log("Signature", signature);
    } catch (e: any) {
      if (
        e.message.includes("Vesting contract has not yet reached release time")
      ) {
        alert("Vesting contract has not yet reached release time");
      }
    }
  };

  if (!publicKey) {
    return <>Loading...</>;
  }

  return (
    <main className="max-w-lg mx-auto px-3 space-y-2">
      <h1>Vesting contract</h1>
      <p>Contract Balance: {balance}</p>
      <button onClick={handleClaim}>Claim Tokens</button>
      <h3>Schedule:</h3>
      {info?.schedules.map((schedule, i) => (
        <div key={i} className="flex gap-4 items-start">
          <span>
            Release Time:{" "}
            {new Date(schedule.releaseTime.toNumber() * 1000).toLocaleString()}
          </span>
          <span>{schedule.amount.toNumber() / 10 ** 9} Tokens</span>
        </div>
      ))}
    </main>
  );
}
