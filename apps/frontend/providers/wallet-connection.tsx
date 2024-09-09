"use client";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useMemo } from "react";

interface Props {
  children: React.ReactNode;
}

const WalletConnectionProvider = ({ children }: Props) => {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      //   new SolflareWalletAdapter(),
      //   // new TorusWalletAdapter(),
      //   new LedgerWalletAdapter(),
      //   // new Coin98WalletAdapter(),
      //   new SalmonWalletAdapter(),
      //   // new SentreWalletAdapter({ appId: 'hedge' }),
    ],
    []
  );
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com ">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnectionProvider;
