import { NextResponse } from "next/server";
import { pollVideo } from "@/lib/integrations/fal";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("id");
  if (!requestId) {
    return NextResponse.json(
      { status: "error", message: "missing id" },
      { status: 400 },
    );
  }
  const videoUrl = await pollVideo(requestId);
  if (videoUrl) {
    return NextResponse.json({ status: "completed", videoUrl });
  }
  return NextResponse.json({ status: "pending" });
}
