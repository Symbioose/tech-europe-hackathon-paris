import { chromium } from "playwright";

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1480, height: 920 } });

const url = process.argv[2] ?? "http://localhost:3030/?stage=r3";
const out = process.argv[3] ?? "/tmp/3d-expanded.png";

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// Click the feed toggle to expand.
const btn = page.locator("button:has-text('Buyer reactions')").first();
await btn.click();
await page.waitForTimeout(500);

await page.screenshot({ path: out });
console.log("written:", out);
await browser.close();
