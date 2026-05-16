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
  const base = `${productName} product advertisement targeting ${tribeName}. The core message: "${hook}".`;
  let style: string;

  if (assetMode === "image") {
    style =
      "Static print ad. Clean, minimal layout, premium studio photography, bold typography frame. High contrast. No text overlay. No UI elements.";
  } else if (assetMode === "video") {
    style =
      "Video storyboard frame. Cinematic first frame with shallow depth of field, lifestyle photography, aspirational mood. No text overlay. No UI elements.";
  } else {
    // generate or copy — social ad
    style =
      "Social media ad creative. Vibrant, eye-catching lifestyle photography, clean composition, mobile-first framing. No text overlay. No UI elements.";
  }

  return `${base} ${style} Photorealistic. Professional advertising quality.`;
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
