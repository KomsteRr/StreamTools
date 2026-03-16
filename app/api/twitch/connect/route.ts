import { NextResponse } from "next/server";
import { connectTwitch, disconnectTwitch, isTwitchConnected } from "@/lib/twitchEventSub";
import { getSession, getSafeUserId } from "@/lib/session";

// GET /api/twitch/connect — check connection status
export async function GET() {
  const session = await getSession();
  const userId = getSafeUserId(session);
  return NextResponse.json({ connected: isTwitchConnected(userId) });
}

// POST /api/twitch/connect — connect
export async function POST() {
  const session = await getSession();
  const userId = getSafeUserId(session);
  const result = await connectTwitch(userId);
  if (!result.ok) {
    console.error(`[POST /api/twitch/connect] Failed for expected user:`, result.error);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ connected: true });
}

// DELETE /api/twitch/connect — disconnect
export async function DELETE() {
  const session = await getSession();
  const userId = getSafeUserId(session);
  disconnectTwitch(userId);
  return NextResponse.json({ connected: false });
}
