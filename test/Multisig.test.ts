import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Multisig } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Multisig", () => {
  const desplegar = async () => {
    const cuentas: HardhatEthersSigner[] = await ethers.getSigners();
    const [signer1, signer2, signer3, externo, destinatario] = cuentas;

    const Factory = await ethers.getContractFactory("Multisig");
    const threshold = 2n;
    const multisig = (await Factory.deploy(
      [signer1.address, signer2.address, signer3.address],
      threshold,
    )) as unknown as Multisig;

    return { multisig, signer1, signer2, signer3, externo, destinatario, threshold };
  };

  describe("Despliegue", () => {
    it("guarda signers y threshold", async () => {
      const { multisig, signer1, signer2, signer3, threshold } = await loadFixture(desplegar);

      expect(await multisig.getThreshold()).to.equal(threshold);
      const signers = await multisig.getSigners();
      expect(signers).to.deep.equal([signer1.address, signer2.address, signer3.address]);
      expect(await multisig.esSigner(signer1.address)).to.equal(true);
    });

    it("revierte si la lista de signers está vacía", async () => {
      const Factory = await ethers.getContractFactory("Multisig");
      await expect(Factory.deploy([], 1)).to.be.revertedWithCustomError(
        Factory,
        "ListaDeSignersInvalida",
      );
    });

    it("revierte si el threshold es 0 o mayor que la cantidad de signers", async () => {
      const [a, b] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("Multisig");
      await expect(Factory.deploy([a.address, b.address], 0)).to.be.revertedWithCustomError(
        Factory,
        "ThresholdInvalido",
      );
      await expect(Factory.deploy([a.address, b.address], 3)).to.be.revertedWithCustomError(
        Factory,
        "ThresholdInvalido",
      );
    });

    it("revierte si hay signers duplicados", async () => {
      const [a] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("Multisig");
      await expect(Factory.deploy([a.address, a.address], 1)).to.be.revertedWithCustomError(
        Factory,
        "SignerDuplicado",
      );
    });
  });

  describe("Propuesta", () => {
    it("un signer puede proponer y emite PropuestaCreada", async () => {
      const { multisig, signer1, destinatario } = await loadFixture(desplegar);
      const valor = ethers.parseEther("1");
      const data = "0x";

      await expect(multisig.connect(signer1).Propuesta(destinatario.address, data, { value: valor }))
        .to.emit(multisig, "PropuestaCreada")
        .withArgs(0n, signer1.address, destinatario.address, valor, data);

      expect(await multisig.getTransaccionesCount()).to.equal(1n);
      const tx = await multisig.getTransaccion(0);
      expect(tx.owner).to.equal(signer1.address);
      expect(tx.destino).to.equal(destinatario.address);
      expect(tx.valor).to.equal(valor);
    });

    it("rechaza que un no-signer proponga", async () => {
      const { multisig, externo, destinatario } = await loadFixture(desplegar);
      await expect(
        multisig.connect(externo).Propuesta(destinatario.address, "0x", { value: 0n }),
      ).to.be.revertedWithCustomError(multisig, "SignerNoAprobado");
    });
  });

  describe("Aprobación", () => {
    it("un signer válido aprueba y emite el evento", async () => {
      const { multisig, signer1, signer2, destinatario } = await loadFixture(desplegar);
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: 0n });

      await expect(multisig.connect(signer2).Aprobacion(0))
        .to.emit(multisig, "PropuestaAprobada")
        .withArgs(0n, signer2.address, 1n);

      expect(await multisig.yaFirmo(0, signer2.address)).to.equal(true);
    });

    it("rechaza que un signer apruebe la misma propuesta dos veces", async () => {
      const { multisig, signer1, signer2, destinatario } = await loadFixture(desplegar);
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: 0n });

      await multisig.connect(signer2).Aprobacion(0);
      await expect(multisig.connect(signer2).Aprobacion(0)).to.be.revertedWithCustomError(
        multisig,
        "YaSeFirmo",
      );
    });

    it("rechaza que un no-signer apruebe", async () => {
      const { multisig, signer1, externo, destinatario } = await loadFixture(desplegar);
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: 0n });

      await expect(multisig.connect(externo).Aprobacion(0)).to.be.revertedWithCustomError(
        multisig,
        "SignerNoAprobado",
      );
    });

    it("rechaza aprobar una propuesta inexistente", async () => {
      const { multisig, signer1 } = await loadFixture(desplegar);
      await expect(multisig.connect(signer1).Aprobacion(0)).to.be.revertedWithCustomError(
        multisig,
        "IndiceFueraDeRango",
      );
    });
  });

  describe("Ejecución", () => {
    it("ejecuta cuando se alcanza el threshold y transfiere el valor", async () => {
      const { multisig, signer1, signer2, destinatario } = await loadFixture(desplegar);
      const valor = ethers.parseEther("1");
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: valor });
      await multisig.connect(signer1).Aprobacion(0);
      await multisig.connect(signer2).Aprobacion(0);

      await expect(() => multisig.connect(signer1).Ejecucion(0)).to.changeEtherBalances(
        [multisig, destinatario],
        [-valor, valor],
      );

      const tx = await multisig.getTransaccion(0);
      expect(tx.ejecutada).to.equal(true);
    });

    it("emite PropuestaEjecutada al ejecutar", async () => {
      const { multisig, signer1, signer2, destinatario } = await loadFixture(desplegar);
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: 0n });
      await multisig.connect(signer1).Aprobacion(0);
      await multisig.connect(signer2).Aprobacion(0);

      await expect(multisig.connect(signer2).Ejecucion(0))
        .to.emit(multisig, "PropuestaEjecutada")
        .withArgs(0n, signer2.address);
    });

    it("rechaza ejecutar si no se alcanzó el threshold", async () => {
      const { multisig, signer1, destinatario } = await loadFixture(desplegar);
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: 0n });
      await multisig.connect(signer1).Aprobacion(0);

      await expect(multisig.connect(signer1).Ejecucion(0)).to.be.revertedWithCustomError(
        multisig,
        "FirmasInsuficientes",
      );
    });

    it("rechaza que un no-signer ejecute", async () => {
      const { multisig, signer1, signer2, externo, destinatario } = await loadFixture(desplegar);
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: 0n });
      await multisig.connect(signer1).Aprobacion(0);
      await multisig.connect(signer2).Aprobacion(0);

      await expect(multisig.connect(externo).Ejecucion(0)).to.be.revertedWithCustomError(
        multisig,
        "SignerNoAprobado",
      );
    });

    it("rechaza re-ejecutar una propuesta ya ejecutada", async () => {
      const { multisig, signer1, signer2, destinatario } = await loadFixture(desplegar);
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: 0n });
      await multisig.connect(signer1).Aprobacion(0);
      await multisig.connect(signer2).Aprobacion(0);
      await multisig.connect(signer1).Ejecucion(0);

      await expect(multisig.connect(signer2).Ejecucion(0)).to.be.revertedWithCustomError(
        multisig,
        "PropuestaNoActiva",
      );
    });
  });

  describe("Cancelación", () => {
    it("el proponente puede cancelar y se le reembolsa el valor", async () => {
      const { multisig, signer1, destinatario } = await loadFixture(desplegar);
      const valor = ethers.parseEther("2");
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: valor });

      await expect(() => multisig.connect(signer1).Cancelacion(0)).to.changeEtherBalances(
        [multisig, signer1],
        [-valor, valor],
      );

      const tx = await multisig.getTransaccion(0);
      expect(tx.eliminada).to.equal(true);
    });

    it("emite PropuestaCancelada", async () => {
      const { multisig, signer1, destinatario } = await loadFixture(desplegar);
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: 0n });

      await expect(multisig.connect(signer1).Cancelacion(0))
        .to.emit(multisig, "PropuestaCancelada")
        .withArgs(0n, signer1.address);
    });

    it("rechaza la cancelación por parte de otro signer que no es el proponente", async () => {
      const { multisig, signer1, signer2, destinatario } = await loadFixture(desplegar);
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: 0n });

      await expect(multisig.connect(signer2).Cancelacion(0)).to.be.revertedWithCustomError(
        multisig,
        "NoSosElOwner",
      );
    });

    it("rechaza cancelar una propuesta ya ejecutada", async () => {
      const { multisig, signer1, signer2, destinatario } = await loadFixture(desplegar);
      await multisig.connect(signer1).Propuesta(destinatario.address, "0x", { value: 0n });
      await multisig.connect(signer1).Aprobacion(0);
      await multisig.connect(signer2).Aprobacion(0);
      await multisig.connect(signer1).Ejecucion(0);

      await expect(multisig.connect(signer1).Cancelacion(0)).to.be.revertedWithCustomError(
        multisig,
        "PropuestaNoActiva",
      );
    });
  });
});
