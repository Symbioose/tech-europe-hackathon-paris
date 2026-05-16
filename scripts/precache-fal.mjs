#!/usr/bin/env node
// Pre-cache FAL Flux Schnell images for the Oura demo fallback path.
// 7 tribe creatives + 2 round-2 regen variants = 9 images, ~$0.03 total.
// Idempotent: skips files that already exist.
// Video is NOT pre-cached (per cost decision — generated live at finale).

import fs from "node:fs";
import path from "node:path";

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error("FAL_KEY env var is required");
  process.exit(1);
}

const PROMPTS = {
  "creative-1.png":
    "Marketing ad creative for Oura Ring. Audience: biohackers obsessed with HRV and recovery scores. Hook concept: 'Your sleep score has a reason.' Style: social ad, vibrant cyan and graphite tones, premium product hero shot, no text overlay.",
  "creative-2.png":
    "Marketing ad creative for Oura Ring. Audience: sleep-anxious knowledge workers in their 30s. Hook concept: 'Your worst night had a reason. Look it up tomorrow.' Style: social ad, soft midnight blue and warm bedside lamp tones, intimate, no text overlay.",
  "creative-3.png":
    "Marketing ad creative for Oura Ring. Audience: endurance athletes (runners and cyclists). Hook concept: 'Train when your body is ready, not when your calendar is.' Style: social ad, kinetic outdoor at dawn, dewy grass, no text overlay.",
  "creative-4.png":
    "Marketing ad creative for Oura Ring. Audience: cycle-aware women who want privacy. Hook concept: 'Cycle insights, without sharing them.' Style: social ad, warm peach and ivory, soft natural light, no text overlay.",
  "creative-5.png":
    "Marketing ad creative for Oura Ring. Audience: burned-out tech executives. Hook concept: 'Recovery for people who don't pause.' Style: social ad, dark suit on a marble counter, espresso cup, no text overlay.",
  "creative-6.png":
    "Marketing ad creative for Oura Ring. Audience: strength athletes who under-recover. Hook concept: 'Your body says rest. Listen.' Style: social ad, chalk dust on hands, dim gym, no text overlay.",
  "creative-7.png":
    "Marketing ad creative for Oura Ring. Audience: wellness beginners. Hook concept: 'Healthy without becoming weird about it.' Style: social ad, friendly kitchen morning light, fresh fruit, no text overlay.",
  "creative-r2-1.png":
    "Marketing ad creative for Oura Ring. Audience: biohackers (rewritten round-2 hook). Hook concept: 'The metric they argue about? HRV. We chart it daily.' Style: social ad, geek-friendly dashboard glow, terminal green accents on premium black, no text overlay.",
  "creative-r2-2.png":
    "Marketing ad creative for Oura Ring. Audience: wellness beginners (rewritten round-2 hook). Hook concept: 'One ring. Three habits that actually stick.' Style: social ad, candlelit, soft pastel, simple composition, no text overlay.",
};

const DIR = path.resolve("public/demo");
fs.mkdirSync(DIR, { recursive: true });

let ok = 0;
let fail = 0;
let skip = 0;

for (const [filename, prompt] of Object.entries(PROMPTS)) {
  const dest = path.join(DIR, filename);
  if (fs.existsSync(dest)) {
    console.log(`SKIP ${filename}`);
    skip++;
    continue;
  }

  process.stdout.write(`GEN  ${filename}… `);
  try {
    const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${FAL_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      }),
    });
    if (!res.ok) {
      console.log(`FAIL HTTP ${res.status}`);
      fail++;
      continue;
    }
    const data = await res.json();
    const imgUrl = data?.images?.[0]?.url;
    if (!imgUrl) {
      console.log("FAIL no image url");
      fail++;
      continue;
    }
    const img = await fetch(imgUrl);
    if (!img.ok) {
      console.log(`FAIL download HTTP ${img.status}`);
      fail++;
      continue;
    }
    const buf = Buffer.from(await img.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`OK (${(buf.length / 1024).toFixed(0)} KB)`);
    ok++;
  } catch (err) {
    console.log(`FAIL ${err?.message ?? err}`);
    fail++;
  }
}

console.log(`\nSummary: ${ok} ok, ${skip} skipped, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
