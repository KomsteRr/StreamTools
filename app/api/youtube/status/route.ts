import { NextResponse } from "next/server";
import { isYouTubeConnected } from "@/lib/youtubeAlerts";
import { getSession, getSafeUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const userId = getSafeUserId(session);
  const connected = isYouTubeConnected(userId);
  return NextResponse.json({ connected });
}
