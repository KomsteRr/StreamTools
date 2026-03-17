import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOverlayToken } from "@/lib/overlay-token";
import { getSession, getSafeUserId } from "@/lib/session";

// GET /api/settings — returns all PlatformConfig entries grouped by platform
export async function GET() {
  try {
    const session = await getSession();
    const userId = getSafeUserId(session);

    // Ensure the system token is created if it doesn't exist
    await getOverlayToken(userId);
    
    const rows = await prisma.platformConfig.findMany({
      where: { userId },
    });
    const grouped: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      if (!grouped[r.platform]) grouped[r.platform] = {};
      grouped[r.platform][r.key] = r.value;
    }
    return NextResponse.json(grouped);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/settings — upsert a list of key/values for a platform
// Body: { platform: "twitch", settings: { channelName: "...", clientId: "...", ... } }
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    const userId = getSafeUserId(session);

    const body = await req.json();
    const { platform, settings } = body as {
      platform: string;
      settings: Record<string, string>;
    };
    if (!platform || !settings) {
      return NextResponse.json({ error: "Missing platform or settings" }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      await prisma.platformConfig.upsert({
        where: { platform_key_userId: { platform, key, userId } },
        update: { value },
        create: { platform, key, value, userId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
