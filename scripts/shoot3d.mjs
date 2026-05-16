import { chromium } from "playwright";

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1480, height: 920 } });

page.on("console", (m) => {
  if (m.type() === "error") console.log("[console.error]", m.text());
});
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

const url = process.argv[2] ?? "http://localhost:3030/?stage=r3";
const out = process.argv[3] ?? "/tmp/3d-out.png";

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const c = document.createElement("canvas");
  const gl = c.getContext("webgl2") || c.getContext("webgl");
  const canvases = document.querySelectorAll("canvas");
  const data = [];
  canvases.forEach((cv) => {
    const r = cv.getBoundingClientRect();
    const parent = cv.parentElement;
    const pr = parent?.getBoundingClientRect();
    data.push({
      w: cv.width,
      h: cv.height,
      vw: r.width,
      vh: r.height,
      parentH: pr?.height,
      parentW: pr?.width,
    });
  });
  const main = document.querySelector("main");
  const mainR = main?.getBoundingClientRect();
  // Inspect column ancestry.
  const cv = document.querySelector("canvas");
  const ancestry = [];
  let el = cv?.parentElement;
  for (let i = 0; i < 6 && el; i++) {
    const r = el.getBoundingClientRect();
    ancestry.push({
      tag: el.tagName,
      cls: el.className?.toString().slice(0, 80),
      w: r.width,
      h: r.height,
    });
    el = el.parentElement;
  }
  const html = document.documentElement.getBoundingClientRect();
  return {
    webgl: Boolean(gl),
    canvases: data,
    main: mainR ? { w: mainR.width, h: mainR.height } : null,
    page: { w: html.width, h: html.height },
    viewport: { w: window.innerWidth, h: window.innerHeight },
    ancestry,
  };
});
console.log("info:", JSON.stringify(info, null, 2));

await page.screenshot({ path: out });
console.log("written:", out);

await browser.close();
