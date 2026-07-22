import { NextResponse } from "next/server";
import { getTwitchConfig, saveTwitchConfig } from "@/lib/twitch-config";
import { isOverlayAuthorized } from "@/lib/overlay-token";
import { getSession, getSafeUserId } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const overlayAuth = await isOverlayAuthorized(request);

    if (!session && !overlayAuth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Overlay tokens for admin will already resolve to `null`, but session needs getSafeUserId
    const userId = session ? getSafeUserId(session) : (overlayAuth.userId ?? null);
    const config = await getTwitchConfig(userId);

    // If accessed via overlay token (no session), never leak the bot password
    if (!session && overlayAuth.authorized) {
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
