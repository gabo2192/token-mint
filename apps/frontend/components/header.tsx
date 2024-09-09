"use client";
import dynamic from "next/dynamic";
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function Header() {
  return (
    <div className="flex justify-between items-center py-4 px-8 bg-gray-800 text-white">
      <div>
        <h1 className="text-2xl font-bold">Neptune Mint</h1>
      </div>
      <div>
        <WalletMultiButton />
      </div>
    </div>
  );
}
