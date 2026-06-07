# Entrega 2 — Multisig (Solidity + React)

## Instrucciones para compilar, testear y desplegar el contrato

Desde la raíz del proyecto:

```bash
# 1)
npm install

# 2)
npm run compile

# 3)
npm test
```

Para desplegar a Sepolia:

```bash
# 4) Copiar .env.example a .env y completarlo:
#    - SEPOLIA_RPC_URL  (Alchemy/Infura o RPC público)
#    - PRIVATE_KEY      (clave privada del deployer, con 0x adelante)
#    - SIGNERS          (direcciones autorizadas, separadas por coma)
#    - THRESHOLD        (cantidad mínima de aprobaciones, >0 y <= signers)

# 5)
npm run deploy:sepolia
```

## Instrucciones para ejecutar el frontend localmente

```bash
cd frontend

# 1)
npm install

# 2) Copiar .env.example a .env y completar:
#    VITE_MULTISIG_ADDRESS="0x..."
#    VITE_SEPOLIA_RPC_URL=""
#    VITE_WALLETCONNECT_PROJECT_ID=""

# 3)
npm run dev
```

## La dirección del contrato desplegado en Sepolia, y las wallets con las cuáles interactuar

- **Dirección del contrato:** `0x0F63Ea8AF5f636f427A07EDBCef15ee03D5215DF`
- **Etherscan:** https://sepolia.etherscan.io/address/0x0F63Ea8AF5f636f427A07EDBCef15ee03D5215DF
- **Threshold:** `1 / 1`
- **Wallets con las que se puede interactuar:**
  1. `0x8De85cAeC741B188808Eb0af1eB829029413325a`
