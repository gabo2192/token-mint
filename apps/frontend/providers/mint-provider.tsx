"use client";
import { getAssociatedTokenAddress, getMint, Mint } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useParams } from "next/navigation";
import { createContext, useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

interface ContextProps {
  mint: Mint | null;
  account: PublicKey | null;
  balance: number;
}

export const MintContext = createContext<ContextProps>({
  mint: null,
  account: null,
  balance: 0,
});

export const MintProvider = ({ children }: Props) => {
  const [mint, setMint] = useState<Mint | null>(null);
  const [account, setAccount] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState(0);
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const params = useParams();
  const mintKey = params.slug;

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
  return (
    <MintContext.Provider value={{ mint, account, balance }}>
      {children}
    </MintContext.Provider>
  );
};
