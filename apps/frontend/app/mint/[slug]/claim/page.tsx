"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMintContext } from "@/hooks/use-mint-context";
import { TOKEN_VESTING_PROGRAM_ID, unlock } from "@/lib/actions";
import { findAssociatedTokenAddress } from "@/lib/solana-utils";
import { ContractInfo } from "@/lib/state";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { format } from "date-fns";
import { isBefore } from "date-fns/isBefore";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
  const { mint } = useMintContext();

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
      router.refresh();
    } catch (e: any) {
      console.log(e);
      if (
        e.message.includes("Vesting contract has not yet reached release time")
      ) {
        alert("Vesting contract has not yet reached release time");
      }
      if (
        e.message.includes(
          "Attempt to debit an account but found no record of a prior credit"
        )
      ) {
        alert("You need SOL to claim tokens");
      }
    }
  };

  if (!publicKey) {
    return <>Loading...</>;
  }

  return (
    <main className="max-w-lg mx-auto px-3 space-y-2 prose mt-10">
      <h1>Vesting contract</h1>
      <div className="flex flex-row justify-between items-center">
        <h4>Contract Balance: {balance}</h4>
        <Button onClick={handleClaim}>Claim Tokens</Button>
      </div>
      <h3>Schedule:</h3>
      <Table>
        <TableCaption>A list of your schedule.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Release Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {info?.schedules.map((schedule, i) => {
            let status =
              schedule.amount.toNumber() === 0 ? "Claimed" : "Pending";
            const releaseDate = format(
              schedule.releaseTime.toNumber() * 1000,
              "yyyy-MM-dd"
            );
            if (status === "Pending" && isBefore(releaseDate, new Date())) {
              status = "Available";
            }
            return (
              <TableRow>
                <TableCell className="font-medium">{releaseDate}</TableCell>
                <TableCell>{status}</TableCell>
                <TableCell className="text-right">
                  {schedule.amount.toNumber() / 10 ** (mint?.decimals || 9)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </main>
  );
}
