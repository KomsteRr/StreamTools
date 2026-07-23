import { NextResponse } from "next/server";
import { connectDiscordBot, disconnectDiscordBot, isDiscordBotConnected } from "@/lib/discordBot";
import { getSession, getSafeUserId } from "@/lib/session";

export async function GET() {
  return NextResponse.json({ connected: isDiscordBotConnected() });
}

export async function POST() {
  try {
    const session = await getSession();
    const userId = getSafeUserId(session);
    const result = await connectDiscordBot(userId);
    if (result.ok) {
      return NextResponse.json({ connected: true });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Connection failed" }, { status: 500 });
  }
}

export async function DELETE() {
  disconnectDiscordBot();
  return NextResponse.json({ connected: false });
}
