import { NextResponse } from "next/server";
import { getTwitchConfig, saveTwitchConfig } from "@/lib/twitch-config";
import { isOverlayAuthorized } from "@/lib/overlay-token";
import { getSession, getSafeUserId } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const overlayAuth = await isOverlayAuthorized(request);

    const userId = session ? getSafeUserId(session) : (overlayAuth.userId ?? null);
    let config = await getTwitchConfig(userId);

    // Fallback if empty channel name for target userId
    if (!config.channelName) {
      const globalConfig = await getTwitchConfig(null);
      if (globalConfig.channelName) {
        config.channelName = globalConfig.channelName;
      }
    }

    // Never leak botPassword when accessed via overlay token
    if (!session) {
      config.botPassword = "";
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Twitch Config Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const userId = getSafeUserId(session);
    const body = await request.json();
    await saveTwitchConfig(body, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Twitch Config Save Error:", error);
    return NextResponse.json(
      { error: "Failed to save config", details: String(error) },
      { status: 500 }
    );
  }
}
