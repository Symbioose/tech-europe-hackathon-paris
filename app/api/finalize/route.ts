import { NextResponse } from "next/server";
import { recommendation as fallback } from "@/lib/demo-data";
import { falWinningCreative } from "@/lib/integrations/fal";
import type { RoundResult } from "@/lib/types";

export const dynamic = "force-dynamic";

// Deterministic ranking. A small fine-tuned reaction classifier (intent +
// objection + confidence) is the natural next step but is out of scope for the
// hackathon demo — see lib/integrations/pioneer.ts for the placeholder wrapper.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { rounds?: RoundResult[] };
  const _rounds = body.rounds ?? [];

  const rec = fallback;

  let videoUrl = rec.videoUrl ?? "/demo/winner-video.mp4";
  try {
    const live = await falWinningCreative(
      `Short-form vertical video. A 30s vignette: a person waking at 3:14 am, then in the morning checking their ring, readiness 47 — caption: 'It wasn't on you.' Cinematic, soft window light, calm.`,
    );
    if (live) videoUrl = live;
  } catch {
    // keep fallback
  }

  return NextResponse.json({
    recommendation: { ...rec, videoUrl },
    videoUrl,
  });
}
