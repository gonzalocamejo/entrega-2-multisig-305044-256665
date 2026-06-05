import type { Abi, Address } from "viem";
import multisigAbi from "../abi/Multisig.json";

const direccionEnv = (import.meta.env.VITE_MULTISIG_ADDRESS ?? "").trim();

function esDireccionValida(valor: string): valor is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(valor);
}

export const DIRECCION_MULTISIG: Address | null = esDireccionValida(direccionEnv)
  ? (direccionEnv as Address)
  : null;

export const MULTISIG_ABI = multisigAbi as Abi;
