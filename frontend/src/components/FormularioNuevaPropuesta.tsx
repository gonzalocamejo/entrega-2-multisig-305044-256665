import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconPlus, IconX } from "@tabler/icons-react";
import { isAddress, parseEther } from "viem";
import type { Address, Hex } from "viem";
import { useAccionMultisig } from "../hooks/useMultisig";

function esHexValido(valor: string): valor is Hex {
  return /^0x([0-9a-fA-F]{2})*$/.test(valor);
}

export function FormularioNuevaPropuesta() {
  const [destino, setDestino] = useState("");
  const [valorEth, setValorEth] = useState("0");
  const [calldata, setCalldata] = useState("0x");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const { ejecutar, isPending, isConfirming, isSuccess, error, reset } =
    useAccionMultisig();

  useEffect(() => {
    if (isSuccess) {
      notifications.show({
        color: "green",
        title: "Propuesta creada",
        message: "La nueva propuesta fue confirmada on-chain.",
        icon: <IconCheck size={18} />,
      });
      setDestino("");
      setValorEth("0");
      setCalldata("0x");
      reset();
    }
  }, [isSuccess, reset]);

  useEffect(() => {
    if (error) {
      notifications.show({
        color: "red",
        title: "Error al enviar",
        message: error.message,
        icon: <IconX size={18} />,
      });
    }
  }, [error]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorLocal(null);

    if (!isAddress(destino)) {
      setErrorLocal("La dirección de destino no es válida.");
      return;
    }

    let valorWei: bigint;
    try {
      valorWei = parseEther(valorEth || "0");
    } catch {
      setErrorLocal("El valor en ETH no es un número válido.");
      return;
    }
    if (valorWei < 0n) {
      setErrorLocal("El valor no puede ser negativo.");
      return;
    }

    const datos = calldata.trim() === "" ? "0x" : calldata.trim();
    if (!esHexValido(datos)) {
      setErrorLocal("Calldata debe ser hex (empezar con 0x y tener largo par).");
      return;
    }

    ejecutar("Propuesta", [destino as Address, datos as Hex], valorWei);
  }

  const enviando = isPending || isConfirming;

  return (
    <Card withBorder radius="md" padding="lg">
      <form onSubmit={onSubmit}>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600}>Nueva propuesta</Text>
          </Group>

          <TextInput
            label="Destino"
            description="Dirección que recibirá ETH y/o la llamada"
            placeholder="0x…"
            value={destino}
            onChange={(e) => setDestino(e.currentTarget.value)}
            required
          />

          <TextInput
            label="Valor (ETH)"
            description="ETH a transferir al destino cuando se ejecute (lo fondea el proponente)"
            placeholder="0"
            value={valorEth}
            onChange={(e) => setValorEth(e.currentTarget.value)}
            required
          />

          <Textarea
            label="Calldata (opcional)"
            description="Datos hex para llamar al destino. Usá 0x para una transferencia simple."
            placeholder="0x"
            value={calldata}
            onChange={(e) => setCalldata(e.currentTarget.value)}
            autosize
            minRows={2}
            maxRows={6}
          />

          {errorLocal && (
            <Alert color="red" variant="light">
              {errorLocal}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button
              type="submit"
              loading={enviando}
              leftSection={<IconPlus size={16} />}
            >
              {isPending
                ? "Esperando wallet…"
                : isConfirming
                  ? "Confirmando…"
                  : "Crear propuesta"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
