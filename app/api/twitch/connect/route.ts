import { NextResponse } from "next/server";
import { connectTwitch, disconnectTwitch, isTwitchConnected } from "@/lib/twitchEventSub";

// GET /api/twitch/connect — check connection status
export async function GET() {
  return NextResponse.json({ connected: isTwitchConnected() });
}

// POST /api/twitch/connect — connect
export async function POST() {
  const result = await connectTwitch();
  if (!result.ok) {
    console.error("[POST /api/twitch/connect] Failed:", result.error);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ connected: true });
}

// DELETE /api/twitch/connect — disconnect
export async function DELETE() {
  disconnectTwitch();
  return NextResponse.json({ connected: false });
}
