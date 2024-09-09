import { MintProvider } from "@/providers/mint-provider";

interface Props {
  children: React.ReactNode;
}
export default function Layout({ children }: Props) {
  return <MintProvider>{children}</MintProvider>;
}
