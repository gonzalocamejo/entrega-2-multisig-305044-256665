import { useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useReadContract,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useBlockNumber,
  useWatchContractEvent,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import type { Address, Hex } from "viem";
import { DIRECCION_MULTISIG, MULTISIG_ABI } from "../config/contrato";

export type Transaccion = {
  owner: Address;
  destino: Address;
  valor: bigint;
  callData: Hex;
  firmasRecibidas: readonly Address[];
  ejecutada: boolean;
  eliminada: boolean;
};

export type EstadoPropuesta = "Pendiente" | "Ejecutada" | "Cancelada";

export function estadoDePropuesta(tx: Transaccion): EstadoPropuesta {
  if (tx.ejecutada) return "Ejecutada";
  if (tx.eliminada) return "Cancelada";
  return "Pendiente";
}

const DIRECCION_PLACEHOLDER: Address = "0x0000000000000000000000000000000000000000";
const direccionParaWagmi = DIRECCION_MULTISIG ?? DIRECCION_PLACEHOLDER;
const habilitado = DIRECCION_MULTISIG !== null;

export function useDireccionMultisig(): Address | null {
  return DIRECCION_MULTISIG;
}

export function useEsRedCorrecta(): boolean {
  const chainId = useChainId();
  return chainId === sepolia.id;
}

export function useSigners() {
  return useReadContract({
    address: direccionParaWagmi,
    abi: MULTISIG_ABI,
    functionName: "getSigners",
    query: { enabled: habilitado },
  });
}

export function useThreshold() {
  return useReadContract({
    address: direccionParaWagmi,
    abi: MULTISIG_ABI,
    functionName: "getThreshold",
    query: { enabled: habilitado },
  });
}

export function useTransacciones() {
  const query = useReadContract({
    address: direccionParaWagmi,
    abi: MULTISIG_ABI,
    functionName: "getTransacciones",
    query: { enabled: habilitado },
  });

  const propuestas = useMemo<readonly Transaccion[]>(() => {
    if (!query.data) return [];
    return query.data as readonly Transaccion[];
  }, [query.data]);

  return { ...query, propuestas };
}

export function useEsSigner(direccion: Address | undefined): boolean {
  const { data: signers } = useSigners();
  if (!direccion || !signers) return false;
  const lista = signers as readonly Address[];
  return lista.some((s) => s.toLowerCase() === direccion.toLowerCase());
}

export function useCuentaActual(): {
  direccion: Address | undefined;
  conectado: boolean;
  esSigner: boolean;
  redCorrecta: boolean;
} {
  const { address, isConnected } = useAccount();
  const esSigner = useEsSigner(address);
  const redCorrecta = useEsRedCorrecta();
  return {
    direccion: address,
    conectado: isConnected,
    esSigner,
    redCorrecta,
  };
}

/**
 * Hook para escribir al contrato, con espera del recibo y refresco automático
 * de las queries de lectura tras la confirmación.
 */
export function useAccionMultisig() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const recibo = useWaitForTransactionReceipt({ hash });

  const isConfirming = recibo.isLoading;
  const isSuccess = recibo.isSuccess;

  useEffect(() => {
    if (isSuccess) {
      void queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [isSuccess, queryClient]);

  const ejecutar = useCallback(
    (
      functionName: "Propuesta" | "Aprobacion" | "Ejecucion" | "Cancelacion",
      args: readonly unknown[],
      valorEnWei?: bigint,
    ) => {
      if (!DIRECCION_MULTISIG) return;
      writeContract({
        address: DIRECCION_MULTISIG,
        abi: MULTISIG_ABI,
        functionName,
        args: args as readonly never[],
        value: valorEnWei,
      });
    },
    [writeContract],
  );

  return {
    ejecutar,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Observa nuevos bloques y eventos del contrato para mantener las lecturas frescas.
 */
export function useRefrescoEnVivo(): void {
  const queryClient = useQueryClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  useEffect(() => {
    if (blockNumber !== undefined) {
      void queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [blockNumber, queryClient]);

  const onLogs = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["readContract"] });
  }, [queryClient]);

  useWatchContractEvent({
    address: direccionParaWagmi,
    abi: MULTISIG_ABI,
    eventName: "PropuestaCreada",
    enabled: habilitado,
    onLogs,
  });
  useWatchContractEvent({
    address: direccionParaWagmi,
    abi: MULTISIG_ABI,
    eventName: "PropuestaAprobada",
    enabled: habilitado,
    onLogs,
  });
  useWatchContractEvent({
    address: direccionParaWagmi,
    abi: MULTISIG_ABI,
    eventName: "PropuestaEjecutada",
    enabled: habilitado,
    onLogs,
  });
  useWatchContractEvent({
    address: direccionParaWagmi,
    abi: MULTISIG_ABI,
    eventName: "PropuestaCancelada",
    enabled: habilitado,
    onLogs,
  });
}
