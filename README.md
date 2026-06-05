# Entrega 2 — Multisig (Solidity + React)

Contrato Multisig programable en Solidity (desplegable en Sepolia) más un frontend en React + TypeScript para operarlo (proponer, aprobar, ejecutar y cancelar transacciones).

## Decisiones de diseño

- **Conjunto de signers fijo en el despliegue.** El contrato no permite agregar ni remover signers después del deploy. El conjunto y el threshold se definen una sola vez en el constructor, lo que simplifica la auditoría y elimina vectores de gobernanza extra (cualquier cambio de signers requiere desplegar un nuevo multisig). El threshold debe ser `>0` y `<=` cantidad de signers, y no se permiten direcciones repetidas ni la `0x0`.
- **El proponente fondea la propuesta al crearla.** Cuando un signer llama a `Propuesta`, el `msg.value` queda custodiado por el contrato. Al ejecutar, ese ETH se envía al destino junto con el calldata. Al cancelar, se reembolsa al proponente. Esta convención evita tener que mantener un balance separado para cada propuesta y deja el contrato sin ETH inactivo entre operaciones.
- **Custom errors en lugar de strings.** El contrato usa `revert SignerNoAprobado()`, etc., para reducir gas y exponer errores tipados al frontend.
- **Eventos para todo cambio de estado relevante.** `PropuestaCreada`, `PropuestaAprobada`, `PropuestaEjecutada`, `PropuestaCancelada` — el frontend los escucha (`useWatchContractEvent`) y refresca las lecturas en vivo.

### Correcciones aplicadas al contrato base

| Problema original                                          | Corrección                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Cualquiera podía llamar a `Propuesta`                      | Se agregó el modifier `isApprovedSigner` a `Propuesta`                                                |
| `callData: msg.data` guardaba la llamada a `Propuesta`     | La firma cambió a `Propuesta(address destino, bytes calldata data)` y se guarda `data`                |
| Typos: `getTreshold`, `sucess`, `SignerNoAprovado`         | Renombrado a `getThreshold`, `success`, `SignerNoAprobado` (se mantiene alias `getTreshold` por compat) |
| Sin eventos                                                | Se agregaron los cuatro eventos pedidos en la consigna                                                |
| Funciones públicas sin necesidad                           | Se marcaron como `external` donde corresponde                                                         |
| Sin validación de constructor (threshold, duplicados, 0x0) | Se validan en el `constructor` con custom errors específicos                                          |
| `require(..., CustomError())` (sintaxis 0.8.26+)           | Reemplazado por `if (...) revert CustomError();` (compatible con 0.8.24)                              |

## Stack

- **Contrato:** Solidity `^0.8.24`, Hardhat (TypeScript), Chai + Mocha, ethers v6, hardhat-verify.
- **Frontend:** Vite + React 18 + TypeScript (strict, sin `any`), wagmi v2, viem v2, RainbowKit v2, Mantine v7, TanStack Query v5.

## Estructura

```
.
├── contracts/Multisig.sol
├── scripts/
│   ├── desplegar.ts         # Despliega y copia el ABI al frontend
│   └── copiarAbi.cjs        # Copia el ABI manualmente si se modifica el contrato
├── test/Multisig.test.ts    # 19 tests cubriendo despliegue, propuesta, aprobación, ejecución y cancelación
├── deployments/             # Se genera al desplegar; guarda dirección por red
├── hardhat.config.ts
├── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── wagmi.config.ts
│   │   ├── abi/Multisig.json
│   │   ├── config/contrato.ts
│   │   ├── hooks/useMultisig.ts
│   │   └── components/
│   │       ├── PuertaConexion.tsx
│   │       ├── PanelInfoContrato.tsx
│   │       ├── FormularioNuevaPropuesta.tsx
│   │       ├── PanelPropuestas.tsx
│   │       └── TarjetaPropuesta.tsx
│   └── .env.example
└── README.md
```

## Comandos — contrato

Desde la raíz del proyecto:

```bash
# Instalar dependencias (una sola vez)
npm install

# Compilar el contrato
npm run compile

# Correr la suite de tests (debe pasar 19/19 sin warnings)
npm test

# Copiar el ABI al frontend (lo hace también el deploy script)
npm run copy-abi
```

## Despliegue a Sepolia

1. Copiá `.env.example` a `.env` y completalo:

   ```env
   SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/TU_API_KEY"
   PRIVATE_KEY="0xLA_PRIVATE_KEY_DEL_DEPLOYER"
   ETHERSCAN_API_KEY=""                              # opcional, para verificar

   SIGNERS="0xSIGNER_1,0xSIGNER_2,0xSIGNER_3"        # direcciones autorizadas
   THRESHOLD="2"                                     # aprobaciones mínimas
   ```

2. Asegurate de tener ETH de Sepolia en la wallet del deployer (faucet: <https://sepoliafaucet.com> o <https://www.alchemy.com/faucets/ethereum-sepolia>).

3. Desplegar:

   ```bash
   npm run deploy:sepolia
   ```

   El script:
   - Imprime los signers y el threshold a usar.
   - Despliega `Multisig`.
   - Imprime la dirección del contrato y la guarda en `deployments/sepolia.json`.
   - Copia el ABI a `frontend/src/abi/Multisig.json`.
   - Si hay `ETHERSCAN_API_KEY`, intenta verificarlo en Etherscan tras 30 s.

4. (Opcional) Verificación manual si la automática falla:

   ```bash
   npx hardhat verify --network sepolia <DIRECCION_CONTRATO> '["0xSIGNER_1","0xSIGNER_2","0xSIGNER_3"]' 2
   ```

## Frontend

```bash
cd frontend
cp .env.example .env       # editá .env y pegá la dirección del contrato desplegado
npm install                # ya está hecho si seguiste el flujo de arriba
npm run dev                # abre http://localhost:5173

# Verificaciones
npm run typecheck          # tsc --noEmit (debe pasar limpio, sin any)
npm run build              # build de producción
```

`frontend/.env` necesita al menos:

```env
VITE_MULTISIG_ADDRESS="0xDIRECCION_DEL_CONTRATO"
# opcionales:
VITE_SEPOLIA_RPC_URL=""                  # tu RPC propio (Alchemy/Infura)
VITE_WALLETCONNECT_PROJECT_ID=""         # https://cloud.walletconnect.com (gratis)
```

> Si no ponés `VITE_WALLETCONNECT_PROJECT_ID`, RainbowKit usa un ID placeholder y solo van a funcionar los conectores inyectados (MetaMask en el navegador). Para MetaMask alcanza.

### Qué hace la UI

- **Panel de Información del Contrato:** dirección del multisig (con link a Etherscan), lista completa de signers, y threshold configurado, todo leído on-chain.
- **Formulario de Nueva Propuesta:** destino (address), valor (ETH), calldata hex opcional (`0x` por defecto). El proponente firma una transacción al contrato con el ETH como `msg.value`.
- **Panel de Propuestas:** lista todas las propuestas con su ID, destino, valor, aprobaciones acumuladas vs threshold, estado (Pendiente / Ejecutada / Cancelada) y badges con quién ya firmó. Permite filtrar por estado.
- **Acciones por propuesta:**
  - _Aprobar_: habilitado solo si la propuesta está pendiente, sos signer y no firmaste todavía.
  - _Ejecutar_: habilitado solo si la propuesta está pendiente, sos signer y ya se alcanzó el threshold.
  - _Cancelar_: habilitado solo si la propuesta está pendiente y sos el proponente original.
- **Conexión y gating:** RainbowKit configurado únicamente con Sepolia. Si tu wallet está conectada pero no es signer, ves un mensaje claro y todas las acciones quedan deshabilitadas.
- **Estado en tiempo real:** se observan los eventos del contrato (`useWatchContractEvent`) y, como fallback, se invalida la caché en cada nuevo bloque (`useBlockNumber({ watch: true })`).

## Tests

```bash
npm test
```

Cubre (19 tests):

- **Despliegue:** guarda signers/threshold, revierte con lista vacía, con threshold inválido y con signers duplicados.
- **Propuesta:** emite `PropuestaCreada`; un no-signer no puede proponer.
- **Aprobación:** emite `PropuestaAprobada`; un signer no puede firmar dos veces; un no-signer no puede aprobar; revierte si la propuesta no existe.
- **Ejecución:** se ejecuta al alcanzar el threshold y transfiere el valor; emite `PropuestaEjecutada`; revierte si no se alcanzó el threshold; un no-signer no puede ejecutar; no se puede re-ejecutar.
- **Cancelación:** el proponente cancela y recibe el reembolso; emite `PropuestaCancelada`; otros signers no pueden cancelar; no se puede cancelar después de ejecutar.

## Resumen de comandos

| Acción                            | Comando                                                            |
| --------------------------------- | ------------------------------------------------------------------ |
| Instalar deps del contrato        | `npm install`                                                      |
| Compilar contrato                 | `npm run compile`                                                  |
| Correr tests                      | `npm test`                                                         |
| Desplegar a Sepolia               | `npm run deploy:sepolia`                                           |
| Verificar en Etherscan (manual)   | `npx hardhat verify --network sepolia <ADDR> '[...signers]' <thr>` |
| Copiar ABI al frontend            | `npm run copy-abi`                                                 |
| Instalar deps del frontend        | `cd frontend && npm install`                                       |
| Levantar frontend en desarrollo   | `cd frontend && npm run dev`                                       |
| Type-check del frontend           | `cd frontend && npm run typecheck`                                 |
| Build de producción del frontend  | `cd frontend && npm run build`                                     |

---

## Datos del despliegue (completar tras desplegar)

> Completá esta sección con los datos reales del contrato desplegado para que el corrector pueda interactuar.

- **Dirección del contrato (Sepolia):** `0x____________________________________________`
- **Etherscan:** `https://sepolia.etherscan.io/address/0x___________________________________`
- **Threshold:** `__ / __`
- **Signers / wallets con las que se puede interactuar:**
  1. `0x____________________________________________`
  2. `0x____________________________________________`
  3. `0x____________________________________________`

> El archivo `deployments/sepolia.json` se genera automáticamente al desplegar con los mismos datos.
