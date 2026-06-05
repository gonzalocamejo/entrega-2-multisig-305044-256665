import { AppShell, Container, Group, Stack, Text, Title } from "@mantine/core";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PuertaConexion } from "./components/PuertaConexion";
import { PanelInfoContrato } from "./components/PanelInfoContrato";
import { FormularioNuevaPropuesta } from "./components/FormularioNuevaPropuesta";
import { PanelPropuestas } from "./components/PanelPropuestas";
import { useRefrescoEnVivo } from "./hooks/useMultisig";

export default function App() {
  useRefrescoEnVivo();

  return (
    <AppShell header={{ height: 64 }} padding="lg">
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group justify="space-between" align="center" h="100%">
            <Stack gap={0}>
              <Title order={4}>Multisig — Entrega 2</Title>
              <Text size="xs" c="dimmed">
                Solidity + React · Sepolia
              </Text>
            </Stack>
            <ConnectButton chainStatus="icon" showBalance={false} />
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">
          <PuertaConexion>
            <Stack gap="lg">
              <PanelInfoContrato />
              <FormularioNuevaPropuesta />
              <PanelPropuestas />
            </Stack>
          </PuertaConexion>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
