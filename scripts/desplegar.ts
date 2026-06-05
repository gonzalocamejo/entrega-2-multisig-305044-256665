import { ethers, network, run } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log(`Desplegando con la cuenta: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance del deployer: ${ethers.formatEther(balance)} ETH`);

  const signersFromEnv = (process.env.SIGNERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const signers =
    signersFromEnv.length > 0 ? signersFromEnv : [deployer.address];

  for (const s of signers) {
    if (!ethers.isAddress(s)) {
      throw new Error(`Dirección de signer inválida: ${s}`);
    }
  }

  const threshold = BigInt(process.env.THRESHOLD ?? "1");
  if (threshold === 0n || threshold > BigInt(signers.length)) {
    throw new Error(
      `THRESHOLD inválido: ${threshold}. Debe ser >0 y <= cantidad de signers (${signers.length}).`,
    );
  }

  console.log(`Red: ${network.name}`);
  console.log(`Signers (${signers.length}):`);
  signers.forEach((s, i) => console.log(`  [${i}] ${s}`));
  console.log(`Threshold: ${threshold}`);

  const Factory = await ethers.getContractFactory("Multisig");
  const multisig = await Factory.deploy(signers, threshold);
  await multisig.waitForDeployment();

  const direccion = await multisig.getAddress();
  console.log(`\nMultisig desplegado en: ${direccion}`);

  // Guardar la dirección
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir))
    fs.mkdirSync(deploymentsDir, { recursive: true });
  const deploymentPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(
      {
        red: network.name,
        chainId: Number(network.config.chainId ?? 0),
        contrato: "Multisig",
        direccion,
        signers,
        threshold: threshold.toString(),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log(`Datos de despliegue guardados en ${deploymentPath}`);

  // Copiar ABI al frontend
  try {
    const artifactPath = path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "Multisig.sol",
      "Multisig.json",
    );
    const abiDestDir = path.join(__dirname, "..", "frontend", "src", "abi");
    if (
      fs.existsSync(artifactPath) &&
      fs.existsSync(path.dirname(abiDestDir))
    ) {
      if (!fs.existsSync(abiDestDir))
        fs.mkdirSync(abiDestDir, { recursive: true });
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8")) as {
        abi: unknown;
      };
      fs.writeFileSync(
        path.join(abiDestDir, "Multisig.json"),
        JSON.stringify(artifact.abi, null, 2),
      );
      console.log("ABI copiado a frontend/src/abi/Multisig.json");
    }
  } catch (err) {
    console.warn("No se pudo copiar el ABI al frontend:", err);
  }

  // Verificación en Etherscan
  if (
    network.name === "sepolia" &&
    process.env.ETHERSCAN_API_KEY &&
    process.env.ETHERSCAN_API_KEY.length > 0
  ) {
    console.log("\nEsperando a que Etherscan indexe el contrato (30s)...");
    await new Promise((r) => setTimeout(r, 30_000));

    try {
      await run("verify:verify", {
        address: direccion,
        constructorArguments: [signers, threshold],
      });
      console.log("Contrato verificado en Etherscan.");
    } catch (err) {
      console.warn("Verificación en Etherscan falló:", err);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
