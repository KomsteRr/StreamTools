import { NextResponse } from "next/server";
import {
  connectYouTube,
  disconnectYouTube,
  isYouTubeConnected,
} from "@/lib/youtubeAlerts";
import { getSession, getSafeUserId } from "@/lib/session";

// GET /api/youtube/connect — check connection status
export async function GET() {
  const session = await getSession();
  const userId = getSafeUserId(session);
  return NextResponse.json({ connected: isYouTubeConnected(userId) });
}

// POST /api/youtube/connect — connect and start polling
export async function POST() {
  const session = await getSession();
  const userId = getSafeUserId(session);
  const result = await connectYouTube(userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ connected: true });
}

// DELETE /api/youtube/connect — stop polling
export async function DELETE() {
  const session = await getSession();
  const userId = getSafeUserId(session);
  disconnectYouTube(userId);
  return NextResponse.json({ connected: false });
}
