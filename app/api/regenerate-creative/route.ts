import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/integrations/fal";
import { rewriteHook } from "@/lib/integrations/openai";
import type { Tribe } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    productName = "Product",
    tribe,
    tribeIndex = 0,
    previousHook = "",
    failureReason = "Buyers did not react clearly.",
    assetMode = "generate",
  } = body as {
    productName?: string;
    tribe?: Tribe;
    tribeIndex?: number;
    previousHook?: string;
    failureReason?: string;
    assetMode?: string;
  };

  const tribeId = tribe?.id ?? `tribe_${tribeIndex + 1}`;
  const tribeName = tribe?.name ?? "Audience";

  // Step 1: Rewrite the hook (8s timeout)
  let newHook: string;
  if (tribe) {
    const hookPromise = rewriteHook({ productName, tribe, previousHook, failureReason });
    const hookTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
    const hookResult = await Promise.race([hookPromise, hookTimeout]);
    newHook = hookResult ?? `${tribe.buyingTrigger} — without the guesswork`;
  } else {
    newHook = previousHook || "The moment it finally clicks — without the guesswork";
  }

  // Step 2: Build FAL prompt incorporating the new hook
  const prompt = `${productName} advertisement for ${tribeName}. Hook: "${newHook}". Social ad, vibrant, high quality, no text overlay. Photorealistic, professional advertising quality.`;

  // Step 3: Generate image (6s timeout)
  const falPromise = generateImage({ prompt, imageSize: "landscape_16_9" });
  const imageTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
  const imageUrl = await Promise.race([falPromise, imageTimeout]);

  const newImageUrl = imageUrl ?? `/demo/creative-r2-${(tribeIndex % 2) + 1}.png`;

  return NextResponse.json({
    tribeId,
    oldHook: previousHook,
    newHook,
    newImageUrl,
  });
}
