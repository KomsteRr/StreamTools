import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SENSITIVE_KEYS = [
  "clientId",
  "clientSecret",
  "accessToken",
  "botPassword",
  "overlayToken",
  "refreshToken",
];

// GET /api/settings/public — returns all non-sensitive PlatformConfig entries grouped by platform
export async function GET() {
  try {
    const rows = await prisma.platformConfig.findMany();
    const grouped: Record<string, Record<string, string>> = {};

    for (const r of rows) {
      if (SENSITIVE_KEYS.includes(r.key)) continue;
      if (!grouped[r.platform]) grouped[r.platform] = {};
      grouped[r.platform][r.key] = r.value;
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
