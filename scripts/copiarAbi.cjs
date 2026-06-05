const fs = require("node:fs");
const path = require("node:path");

const artifactPath = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "Multisig.sol",
  "Multisig.json",
);
const destDir = path.join(__dirname, "..", "frontend", "src", "abi");

if (!fs.existsSync(artifactPath)) {
  console.error(`Artifact no encontrado: ${artifactPath}`);
  console.error("Ejecutá 'npx hardhat compile' primero.");
  process.exit(1);
}

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
fs.writeFileSync(
  path.join(destDir, "Multisig.json"),
  JSON.stringify(artifact.abi, null, 2),
);
console.log("ABI copiado a frontend/src/abi/Multisig.json");
