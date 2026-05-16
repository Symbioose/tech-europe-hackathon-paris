import { NextResponse } from "next/server";
import { submitVideo } from "@/lib/integrations/fal";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    productName?: string;
    winningHook?: string;
    winningTribeName?: string;
    winningTribePain?: string;
    winningTribeTrigger?: string;
    objectionAvoided?: string;
    whyItWon?: string;
    keyPromise?: string;
  };

  const prompt = [
    `Vertical 9:16 5-second cinematic ad for ${body.productName ?? "a product launch"}.`,
    `Hook spoken or visually implied: "${body.winningHook ?? "Try it"}".`,
    `Target buyer: ${body.winningTribeName ?? "early adopter"} who feels: ${body.winningTribePain ?? "uncertain"} and acts when: ${body.winningTribeTrigger ?? "a clear trigger hits"}.`,
    `Tone: ${body.whyItWon ? `lean into "${body.whyItWon}"` : "premium, confident, intimate"}.`,
    `Avoid: anything that triggers "${body.objectionAvoided ?? "generic objections"}".`,
    body.keyPromise ? `Product's core promise: ${body.keyPromise}.` : "",
    `Style: cinematic, vivid, premium product showcase, soft lighting, single focal subject, no on-screen text.`,
  ]
    .filter(Boolean)
    .join(" ");

  // 15s cap on the SUBMIT call itself (queue endpoint is usually fast — this is just the queue accept)
  const requestId = await Promise.race([
    submitVideo(prompt),
    new Promise<null>((r) => setTimeout(() => r(null), 15000)),
  ]);

  return NextResponse.json({ requestId: requestId ?? null, prompt });
}
