import { NextResponse } from "next/server";
import { getDiscordConfig, saveDiscordConfig } from "@/lib/discordBot";
import { getSession, getSafeUserId } from "@/lib/session";
import { isOverlayAuthorized } from "@/lib/overlay-token";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const isAuth = await isOverlayAuthorized(request);
    const userId = getSafeUserId(session) ?? isAuth.userId ?? null;
    const config = await getDiscordConfig(userId);
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load Discord config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const userId = getSafeUserId(session);
    const body = await request.json();
    await saveDiscordConfig(body, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save Discord config" }, { status: 500 });
  }
}
