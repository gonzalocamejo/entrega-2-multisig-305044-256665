// Toma capturas de la UI del multisig en distintos estados navegables sin wallet.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const url = process.argv[2] ?? "http://localhost:5173/";
const outDir = process.argv[3] ?? "./capturas";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

const errores = [];
page.on("pageerror", (e) => errores.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errores.push(`console.error: ${m.text()}`);
});

console.log(`Navegando a ${url} …`);
await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

// Espera a que la pantalla principal renderice algo del shell
await page.waitForSelector("text=Multisig — Entrega 2", { timeout: 15_000 });

const path1 = `${outDir}/01-pantalla-conectar.png`;
await page.screenshot({ path: path1, fullPage: true });
console.log(`→ ${path1}`);

// Abre el modal de Connect Wallet
const conectarBtn = page.locator("button:has-text('Connect Wallet')").first();
if (await conectarBtn.count()) {
  await conectarBtn.click();
  await page.waitForTimeout(800);
  const path2 = `${outDir}/02-modal-rainbowkit.png`;
  await page.screenshot({ path: path2, fullPage: true });
  console.log(`→ ${path2}`);
}

await browser.close();

writeFileSync(
  `${outDir}/errores.json`,
  JSON.stringify(errores, null, 2),
);
console.log(`Errores capturados: ${errores.length}`);
for (const e of errores) console.log("  -", e);
