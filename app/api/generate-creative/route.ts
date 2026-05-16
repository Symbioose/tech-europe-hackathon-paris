import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/integrations/fal";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function buildPrompt(
  productName: string,
  tribeName: string,
  hook: string,
  assetMode: string,
): string {
  const hint = hook
    ? `The campaign idea: "${hook}". Convey the emotion of that moment, not the words themselves.`
    : "";
  const subject = `A single person from the world of ${tribeName} — caught in a candid, true-to-life moment that ${productName} is built for.`;

  let style: string;
  if (assetMode === "image") {
    style =
      "Editorial print campaign · single hero subject · premium studio lighting · shallow depth of field · rich filmic color · negative space for a tagline · centered composition.";
  } else if (assetMode === "video") {
    style =
      "Cinematic storyboard frame · anamorphic feel · soft natural light spilling through a window · subtle motion blur cue · aspirational lifestyle mood · 35mm grain.";
  } else {
    style =
      "Modern social ad photography · candid lifestyle moment · clean uncluttered background · vibrant but mature palette · 35mm look, shallow depth of field · light from a single warm source.";
  }

  const guardrails =
    "Absolutely no text overlay, no captions, no watermarks, no logos, no UI mockups, no on-screen interface. Photorealistic. Award-winning advertising photography.";

  return `${subject} ${hint} ${style} ${guardrails}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    productName = "Product",
    tribeName = "Audience",
    tribeIndex = 0,
    hook = "",
    assetMode = "generate",
  } = body as {
    productName?: string;
    tribeName?: string;
    tribeIndex?: number;
    hook?: string;
    assetMode?: string;
  };

  const prompt = buildPrompt(productName, tribeName, hook, assetMode);

  const falPromise = generateImage({ prompt, imageSize: "landscape_16_9" });
  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 6000),
  );

  const imageUrl = await Promise.race([falPromise, timeoutPromise]);

  if (imageUrl) {
    return NextResponse.json({ imageUrl, source: "fal" });
  }

  const fallbackUrl = `/demo/creative-${tribeIndex + 1}.png`;
  return NextResponse.json({ imageUrl: fallbackUrl, source: "fallback" });
}
