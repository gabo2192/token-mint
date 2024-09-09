import { MintContext } from "@/providers/mint-provider";
import { useContext } from "react";

export function useMintContext() {
  return useContext(MintContext);
}
