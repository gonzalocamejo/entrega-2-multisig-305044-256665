import {
  Anchor,
  Badge,
  Card,
  CopyButton,
  Group,
  Loader,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy, IconExternalLink } from "@tabler/icons-react";
import type { Address } from "viem";
import {
  useDireccionMultisig,
  useSigners,
  useThreshold,
} from "../hooks/useMultisig";

const URL_EXPLORER = "https://sepolia.etherscan.io/address";

function direccionCorta(d: Address): string {
  return `${d.slice(0, 6)}…${d.slice(-4)}`;
}

export function PanelInfoContrato() {
  const direccion = useDireccionMultisig();
  const signersQuery = useSigners();
  const thresholdQuery = useThreshold();

  const signers = (signersQuery.data ?? []) as readonly Address[];
  const threshold = thresholdQuery.data as bigint | undefined;
  const cargando = signersQuery.isLoading || thresholdQuery.isLoading;

  return (
    <Card withBorder radius="md" padding="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Contrato Multisig
            </Text>
            <Group gap="xs">
              <Text ff="monospace" fw={500}>
                {direccion ? direccion : "No configurado"}
              </Text>
              {direccion && (
                <>
                  <CopyButton value={direccion} timeout={1500}>
                    {({ copied, copy }) => (
                      <Tooltip
                        label={copied ? "Copiado" : "Copiar dirección"}
                        withArrow
                        position="right"
                      >
                        <Anchor component="button" onClick={copy} c="dimmed">
                          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </Anchor>
                      </Tooltip>
                    )}
                  </CopyButton>
                  <Anchor
                    href={`${URL_EXPLORER}/${direccion}`}
                    target="_blank"
                    rel="noreferrer"
                    c="dimmed"
                  >
                    <IconExternalLink size={16} />
                  </Anchor>
                </>
              )}
            </Group>
          </Stack>
          <Badge color="grape" variant="light">
            Sepolia
          </Badge>
        </Group>

        <Group gap="xl" wrap="wrap">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Threshold
            </Text>
            {cargando || threshold === undefined ? (
              <Loader size="xs" />
            ) : (
              <Text fw={700} size="lg">
                {threshold.toString()} / {signers.length}
              </Text>
            )}
          </Stack>

          <Stack gap={2} style={{ flex: 1, minWidth: 240 }}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Signers ({signers.length})
            </Text>
            {cargando ? (
              <Loader size="xs" />
            ) : (
              <Stack gap={4}>
                {signers.map((s) => (
                  <Group key={s} gap="xs" justify="space-between">
                    <Text ff="monospace" size="sm">
                      <Tooltip label={s} withArrow position="top-start">
                        <span>{direccionCorta(s)}</span>
                      </Tooltip>
                    </Text>
                    <Group gap={4}>
                      <CopyButton value={s} timeout={1500}>
                        {({ copied, copy }) => (
                          <Anchor component="button" onClick={copy} c="dimmed">
                            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                          </Anchor>
                        )}
                      </CopyButton>
                      <Anchor
                        href={`${URL_EXPLORER}/${s}`}
                        target="_blank"
                        rel="noreferrer"
                        c="dimmed"
                      >
                        <IconExternalLink size={14} />
                      </Anchor>
                    </Group>
                  </Group>
                ))}
              </Stack>
            )}
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
}
