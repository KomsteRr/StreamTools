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

    const userId = session
      ? getSafeUserId(session)
      : overlayAuth.userId ?? null;
    const config = await getTwitchConfig(userId);

    // Overlay tokens are read-only capabilities and must never reveal credentials.
    if (!session) {
      const {
        botPassword: _botPassword,
        twitchClientId: _clientId,
        twitchAccessToken: _accessToken,
        ...overlayConfig
      } = config;
      return NextResponse.json(overlayConfig);
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Twitch Config Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await saveTwitchConfig(body, getSafeUserId(session));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Twitch Config Save Error:", error);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 },
    );
  }
}
