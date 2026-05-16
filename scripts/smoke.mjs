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

  console.log("→ load");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForLoadState("domcontentloaded");
  await wait(500);
  await page.screenshot({ path: "/tmp/smk-1-idle.png" });

  console.log("→ click Run Crucible");
  await page.getByRole("button", { name: /Run Crucible/i }).click();
  // Wait for tribes to appear (start() takes ~2.25s).
  await page.waitForSelector("text=Quantified-Self Biohackers", { timeout: 15000 });
  await wait(800);
  await page.screenshot({ path: "/tmp/smk-2-tribes.png" });

  console.log("→ click Run Round 1");
  await page.getByRole("button", { name: /Run Round 1/i }).click();
  await wait(2000);
  await page.screenshot({ path: "/tmp/smk-3-r1.png" });

  console.log("→ click Run Round 2");
  await page.getByRole("button", { name: /Run Round 2/i }).click();
  await wait(2000);
  await page.screenshot({ path: "/tmp/smk-4-r2.png" });

  console.log("→ click Run Round 3");
  await page.getByRole("button", { name: /Run Round 3/i }).click();
  await wait(3000);
  await page.screenshot({ path: "/tmp/smk-5-r3.png" });

  console.log("→ expand activity feed");
  await page.locator("button:has-text('Buyer reactions')").first().click();
  await wait(500);
  await page.screenshot({ path: "/tmp/smk-6-feed.png" });

  console.log("→ click Claire's praise message");
  // Click the feed item with Claire's name (opens BuyerDrawer via agent_id link).
  await page.locator("text=Claire Bertrand").first().click();
  await wait(700);
  await page.screenshot({ path: "/tmp/smk-7-drawer.png" });

  console.log("→ ask question");
  await page.fill('input[placeholder*="Why did you click"]', "Why did you click?");
  await page.getByRole("button", { name: /^Ask$/i }).click();
  await wait(1500);
  await page.screenshot({ path: "/tmp/smk-8-answer.png" });

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
