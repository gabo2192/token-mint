"use client";
import { NETWORK_CONNECTION_ENDPOINT } from "@/config";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrezorWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useMemo } from "react";

interface Props {
  children: React.ReactNode;
}

const WalletConnectionProvider = ({ children }: Props) => {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
      new TrezorWalletAdapter(),
      //   // new TorusWalletAdapter(),
      //   new LedgerWalletAdapter(),
      //   // new Coin98WalletAdapter(),
      //   new SalmonWalletAdapter(),
      //   // new SentreWalletAdapter({ appId: 'hedge' }),
    ],
    []
  );
  return (
    <ConnectionProvider endpoint={NETWORK_CONNECTION_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnectionProvider;
