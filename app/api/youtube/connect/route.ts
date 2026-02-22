import { NextResponse } from "next/server";
import {
  connectYouTube,
  disconnectYouTube,
  isYouTubeConnected,
} from "@/lib/youtubeAlerts";

// GET /api/youtube/connect — check connection status
export async function GET() {
  return NextResponse.json({ connected: isYouTubeConnected() });
}

// POST /api/youtube/connect — connect and start polling
export async function POST() {
  const result = await connectYouTube();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ connected: true });
}

// DELETE /api/youtube/connect — stop polling
export async function DELETE() {
  disconnectYouTube();
  return NextResponse.json({ connected: false });
}
