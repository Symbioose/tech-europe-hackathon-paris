import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3030";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({ viewport: { width: 1480, height: 920 } });

  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });

  // 1. Wizard renders on first load (idle, not launched)
  console.log("→ load wizard");
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await wait(500);
  await page.screenshot({ path: "/tmp/smk-1-wizard.png" });

  // 2. Skip wizard to tribes via URL shortcut — exercises the demo path
  console.log("→ jump to tribes via ?stage=tribes");
  await page.goto(`${BASE}/?stage=tribes`, { waitUntil: "domcontentloaded" });
  await wait(1500);
  await page.screenshot({ path: "/tmp/smk-2-tribes.png" });

  // 3. Recommendation card with 4 blocks + confidence badge
  console.log("→ jump to winner state via ?stage=winner");
  await page.goto(`${BASE}/?stage=winner`, { waitUntil: "domcontentloaded" });
  await wait(1500);
  await page.waitForSelector("text=/Synthetic confidence/i", { timeout: 5000 });
  await page.waitForSelector("text=/Who to target/i", { timeout: 3000 });
  await page.waitForSelector("text=/What to say/i", { timeout: 3000 });
  await page.waitForSelector("text=/Where to send them/i", { timeout: 3000 });
  await page.waitForSelector("text=/What objection to avoid/i", { timeout: 3000 });
  await page.screenshot({ path: "/tmp/smk-3-winner.png" });
  console.log("  ✓ 4 blocks + confidence badge present");

  // 4. Buyer drawer opens with mic button (or text-input fallback)
  console.log("→ open hero buyer drawer");
  await page.goto(`${BASE}/?stage=winner&select=tribe_2_a1`, { waitUntil: "domcontentloaded" });
  await wait(1200);
  // Either mic button OR text input must be present
  const micButton = await page.locator("button:has-text(/Hold to ask|🎙/i)").count();
  const textInput = await page.locator('input[placeholder*="Why"]').count();
  if (micButton === 0 && textInput === 0) {
    throw new Error("Neither mic button nor text input found in BuyerDrawer");
  }
  await page.screenshot({ path: "/tmp/smk-4-drawer.png" });
  console.log(`  ✓ drawer renders (mic=${micButton}, textInput=${textInput})`);

  if (errors.length) {
    console.error("ERRORS:", errors);
    process.exit(1);
  }

  console.log("OK");
  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
