import { NextResponse } from "next/server";
import { recommendation as fallback } from "@/lib/demo-data";
import { pioneerRank } from "@/lib/integrations/pioneer";
import { falWinningCreative } from "@/lib/integrations/fal";
import type { RoundResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { rounds?: RoundResult[] };
  const rounds = body.rounds ?? [];

  let rec = fallback;
  try {
    const ranked = await pioneerRank(rounds);
    if (ranked) {
      rec = { ...ranked, ranker: "pioneer" };
    }
  } catch {
    // ignore
  }

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
