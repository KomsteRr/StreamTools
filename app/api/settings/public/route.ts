import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getSafeUserId } from "@/lib/session";
import { isOverlayAuthorized } from "@/lib/overlay-token";

const SENSITIVE_KEYS = [
  "clientId",
  "clientSecret",
  "accessToken",
  "botPassword",
  "overlayToken",
  "refreshToken",
];

// GET /api/settings/public — returns all non-sensitive PlatformConfig entries for the authenticated user
export async function GET(req: Request) {
  try {
    const session = await getSession();
    const isOverlayAuth = await isOverlayAuthorized(req);

    if (!session && !isOverlayAuth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getSafeUserId(session) ?? isOverlayAuth.userId ?? null;

    const rows = await prisma.platformConfig.findMany({
      where: { userId },
    });
    const grouped: Record<string, Record<string, any>> = {};

    for (const r of rows) {
      if (SENSITIVE_KEYS.includes(r.key)) continue;
      
      let val: any = r.value;
      try {
        // Try parsing JSON values (for objects like youtube-chat settings)
        if (val.startsWith("{") || val.startsWith("[")) {
          val = JSON.parse(val);
        }
      } catch {}

      if (!grouped[r.platform]) grouped[r.platform] = {};
      grouped[r.platform][r.key] = val;
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("GET /api/settings/public error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
