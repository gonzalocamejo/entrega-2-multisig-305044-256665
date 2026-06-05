import { Alert, Center, Group, Stack, Text } from "@mantine/core";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { IconAlertTriangle, IconShieldLock } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useCuentaActual, useDireccionMultisig } from "../hooks/useMultisig";

type Props = {
  children: ReactNode;
};

export function PuertaConexion({ children }: Props) {
  const direccion = useDireccionMultisig();
  const { conectado, esSigner, redCorrecta } = useCuentaActual();

  if (!direccion) {
    return (
      <Center mih="60vh">
        <Alert
          icon={<IconAlertTriangle size={20} />}
          color="red"
          variant="light"
          title="Dirección del contrato no configurada"
          maw={520}
        >
          <Text size="sm">
            Definí <code>VITE_MULTISIG_ADDRESS</code> en <code>frontend/.env</code> con la
            dirección del contrato desplegado en Sepolia y reiniciá <code>npm run dev</code>.
          </Text>
        </Alert>
      </Center>
    );
  }

  if (!conectado) {
    return (
      <Center mih="60vh">
        <Stack align="center" gap="md" maw={420}>
          <IconShieldLock size={56} stroke={1.2} />
          <Text fw={600} size="lg">
            Conectá tu wallet
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Para operar el multisig necesitás conectar una wallet que sea uno de los signers
            autorizados del contrato.
          </Text>
          <ConnectButton />
        </Stack>
      </Center>
    );
  }

  if (!redCorrecta) {
    return (
      <Center mih="60vh">
        <Stack align="center" gap="md" maw={420}>
          <Alert
            icon={<IconAlertTriangle size={20} />}
            color="yellow"
            variant="light"
            title="Red equivocada"
          >
            Cambiá tu wallet a la red <strong>Sepolia</strong> para continuar.
          </Alert>
          <ConnectButton />
        </Stack>
      </Center>
    );
  }

  if (!esSigner) {
    return (
      <Center mih="60vh">
        <Stack align="center" gap="md" maw={520}>
          <Alert
            icon={<IconAlertTriangle size={20} />}
            color="orange"
            variant="light"
            title="Tu wallet no es uno de los signers"
          >
            Estás conectado a Sepolia, pero la cuenta actual no figura como signer del
            multisig. Cambiá a una de las cuentas autorizadas para poder proponer, aprobar o
            ejecutar transacciones.
          </Alert>
          <Group>
            <ConnectButton />
          </Group>
        </Stack>
      </Center>
    );
  }

  return <>{children}</>;
}
