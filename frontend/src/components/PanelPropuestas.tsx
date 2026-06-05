import { useMemo, useState } from "react";
import {
  Card,
  Center,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
} from "@mantine/core";
import {
  estadoDePropuesta,
  useCuentaActual,
  useThreshold,
  useTransacciones,
} from "../hooks/useMultisig";
import { TarjetaPropuesta } from "./TarjetaPropuesta";

type Filtro = "todas" | "pendientes" | "ejecutadas" | "canceladas";

export function PanelPropuestas() {
  const { propuestas, isLoading } = useTransacciones();
  const { data: thresholdRaw } = useThreshold();
  const threshold = (thresholdRaw as bigint | undefined) ?? 0n;
  const { direccion } = useCuentaActual();
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const propuestasFiltradas = useMemo(() => {
    const entradas = propuestas.map((p, i) => ({ id: i, propuesta: p }));
    if (filtro === "todas") return entradas;
    const map: Record<Exclude<Filtro, "todas">, ReturnType<typeof estadoDePropuesta>> = {
      pendientes: "Pendiente",
      ejecutadas: "Ejecutada",
      canceladas: "Cancelada",
    };
    const objetivo = map[filtro];
    return entradas.filter((e) => estadoDePropuesta(e.propuesta) === objetivo);
  }, [propuestas, filtro]);

  if (isLoading) {
    return (
      <Center mih={120}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={600} size="lg">
          Propuestas ({propuestas.length})
        </Text>
        <SegmentedControl
          value={filtro}
          onChange={(v) => setFiltro(v as Filtro)}
          data={[
            { label: "Todas", value: "todas" },
            { label: "Pendientes", value: "pendientes" },
            { label: "Ejecutadas", value: "ejecutadas" },
            { label: "Canceladas", value: "canceladas" },
          ]}
        />
      </Group>

      {propuestasFiltradas.length === 0 ? (
        <Card withBorder radius="md" padding="lg">
          <Center mih={80}>
            <Text c="dimmed" size="sm">
              No hay propuestas {filtro === "todas" ? "todavía" : `en estado ${filtro}`}.
            </Text>
          </Center>
        </Card>
      ) : (
        <Stack gap="md">
          {propuestasFiltradas.map(({ id, propuesta }) => (
            <TarjetaPropuesta
              key={id}
              id={id}
              propuesta={propuesta}
              threshold={threshold}
              cuentaActual={direccion}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
