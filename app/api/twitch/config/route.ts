import { NextResponse } from "next/server";
import { getTwitchConfig, saveTwitchConfig } from "@/lib/twitch-config";
import { cookies } from "next/headers";
import { isOverlayAuthorized } from "@/lib/overlay-token";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");
    const isOverlayAuth = await isOverlayAuthorized(request);

    if (!session && !isOverlayAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await getTwitchConfig();

    // If accessed via overlay token (no session), never leak the bot password or tokens
    if (!session && isOverlayAuth) {
      config.botPassword = ""; // Keep access token if overlay needs it (for badges), but drop bot password
    }

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await saveTwitchConfig(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Twitch Config Save Error:", error);
    return NextResponse.json(
      { error: "Failed to save config", details: String(error) },
      { status: 500 }
    );
  }
}
