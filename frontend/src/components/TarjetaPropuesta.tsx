import { useEffect } from "react";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconPlayerPlay,
  IconThumbUp,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { formatEther } from "viem";
import type { Address } from "viem";
import {
  estadoDePropuesta,
  useAccionMultisig,
  type Transaccion,
} from "../hooks/useMultisig";

type Props = {
  id: number;
  propuesta: Transaccion;
  threshold: bigint;
  cuentaActual: Address | undefined;
};

const URL_EXPLORER = "https://sepolia.etherscan.io/address";

function corta(a: Address): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function colorEstado(estado: ReturnType<typeof estadoDePropuesta>): string {
  switch (estado) {
    case "Ejecutada":
      return "teal";
    case "Cancelada":
      return "gray";
    case "Pendiente":
    default:
      return "blue";
  }
}

export function TarjetaPropuesta({ id, propuesta, threshold, cuentaActual }: Props) {
  const { ejecutar, isPending, isConfirming, isSuccess, error, reset } =
    useAccionMultisig();

  useEffect(() => {
    if (isSuccess) {
      notifications.show({
        color: "green",
        title: "Acción confirmada",
        message: `La operación sobre la propuesta #${id} se confirmó on-chain.`,
        icon: <IconCheck size={18} />,
      });
      reset();
    }
  }, [isSuccess, id, reset]);

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

  const estado = estadoDePropuesta(propuesta);
  const aprobaciones = propuesta.firmasRecibidas.length;
  const necesarias = Number(threshold);
  const cuentaLower = cuentaActual?.toLowerCase();
  const yaFirmo = !!cuentaLower &&
    propuesta.firmasRecibidas.some((s) => s.toLowerCase() === cuentaLower);
  const esOwner = !!cuentaLower && propuesta.owner.toLowerCase() === cuentaLower;
  const alcanzaThreshold = BigInt(aprobaciones) >= threshold;
  const activa = estado === "Pendiente";

  const enviando = isPending || isConfirming;

  const puedeAprobar = activa && !yaFirmo && !enviando;
  const puedeEjecutar = activa && alcanzaThreshold && !enviando;
  const puedeCancelar = activa && esOwner && !enviando;

  const progreso = necesarias > 0 ? Math.min(100, (aprobaciones * 100) / necesarias) : 0;

  return (
    <Card withBorder radius="md" padding="lg">
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Badge variant="filled" color="dark" size="lg">
              #{id}
            </Badge>
            <Badge color={colorEstado(estado)} variant="light" size="lg">
              {estado}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Propuesta por{" "}
            <Tooltip label={propuesta.owner} withArrow>
              <Anchor
                href={`${URL_EXPLORER}/${propuesta.owner}`}
                target="_blank"
                rel="noreferrer"
                ff="monospace"
              >
                {corta(propuesta.owner)}
              </Anchor>
            </Tooltip>
          </Text>
        </Group>

        <Stack gap={4}>
          <Group gap="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} w={70}>
              Destino
            </Text>
            <Anchor
              href={`${URL_EXPLORER}/${propuesta.destino}`}
              target="_blank"
              rel="noreferrer"
              ff="monospace"
              size="sm"
            >
              {propuesta.destino}
            </Anchor>
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} w={70}>
              Valor
            </Text>
            <Text ff="monospace" size="sm">
              {formatEther(propuesta.valor)} ETH
            </Text>
          </Group>
          {propuesta.callData && propuesta.callData !== "0x" && (
            <Group gap="xs" align="flex-start">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} w={70}>
                Calldata
              </Text>
              <Text
                ff="monospace"
                size="xs"
                style={{ wordBreak: "break-all", flex: 1 }}
              >
                {propuesta.callData}
              </Text>
            </Group>
          )}
        </Stack>

        <Stack gap={4}>
          <Group justify="space-between">
            <Text size="sm">
              Aprobaciones: <strong>{aprobaciones}</strong> / {necesarias}
            </Text>
            {yaFirmo && (
              <Badge size="sm" color="teal" variant="light">
                Ya firmaste
              </Badge>
            )}
          </Group>
          <Progress value={progreso} color={alcanzaThreshold ? "teal" : "blue"} />
          {propuesta.firmasRecibidas.length > 0 && (
            <Group gap={4} mt={4}>
              {propuesta.firmasRecibidas.map((s) => (
                <Tooltip key={s} label={s} withArrow>
                  <Badge size="sm" variant="outline" ff="monospace">
                    {corta(s)}
                  </Badge>
                </Tooltip>
              ))}
            </Group>
          )}
        </Stack>

        <Group justify="flex-end" gap="xs">
          <Button
            size="sm"
            variant="default"
            color="red"
            leftSection={<IconTrash size={14} />}
            disabled={!puedeCancelar}
            onClick={() => ejecutar("Cancelacion", [BigInt(id)])}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="light"
            leftSection={<IconThumbUp size={14} />}
            disabled={!puedeAprobar}
            onClick={() => ejecutar("Aprobacion", [BigInt(id)])}
          >
            Aprobar
          </Button>
          <Button
            size="sm"
            leftSection={<IconPlayerPlay size={14} />}
            disabled={!puedeEjecutar}
            onClick={() => ejecutar("Ejecucion", [BigInt(id)])}
          >
            Ejecutar
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
