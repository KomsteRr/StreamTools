import { NextResponse } from "next/server";
import { isYouTubeConnected } from "@/lib/youtubeAlerts";

export const dynamic = "force-dynamic";

export async function GET() {
  const connected = isYouTubeConnected();
  return NextResponse.json({ connected });
}
