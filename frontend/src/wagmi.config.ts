import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "viem";

const rpcSepolia = import.meta.env.VITE_SEPOLIA_RPC_URL?.trim();
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim() ||
  "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: "Multisig — Entrega 2",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: rpcSepolia && rpcSepolia.length > 0 ? http(rpcSepolia) : http(),
  },
  ssr: false,
});
