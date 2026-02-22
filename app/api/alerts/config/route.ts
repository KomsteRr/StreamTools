import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALERT_DEFAULTS: Record<string, { text: string; bgColor: string }> = {
  follow: { text: "{user} vient de follow ! 🎉", bgColor: "#6441a5" },
  sub: { text: "{user} vient de s'abonner ! 🎊", bgColor: "#1a7f37" },
  bits: { text: "{user} a donné {amount} bits ! 💜", bgColor: "#f59e0b" },
  raid: { text: "{user} raid avec {amount} viewers ! ⚔️", bgColor: "#ef4444" },
  cheer: { text: "{user} a cheer {amount} bits ! 🎉", bgColor: "#8b5cf6" },
  gift_sub: { text: "{user} offre {amount} abos ! 🎁", bgColor: "#06b6d4" },
};

async function seedDefaults(platform: string) {
  for (const [type, defaults] of Object.entries(ALERT_DEFAULTS)) {
    const existing = await prisma.alertConfig.findFirst({ where: { type, platform } });
    if (!existing) {
      await prisma.alertConfig.create({ data: { type, platform, ...defaults } });
    }
  }
}

// GET /api/alerts/config?platform=twitch
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const platform = url.searchParams.get("platform") ?? "twitch";

    await seedDefaults(platform);

    const configs = await prisma.alertConfig.findMany({
      where: { platform },
      orderBy: { type: "asc" },
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error("GET /api/alerts/config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/alerts/config — upsert a config (body must include type + platform)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { type, platform = "twitch", id: _id, ...data } = body;
    void _id;
    if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });

    const existing = await prisma.alertConfig.findFirst({ where: { type, platform } });
    let config;
    if (existing) {
      config = await prisma.alertConfig.update({ where: { id: existing.id }, data });
    } else {
      config = await prisma.alertConfig.create({ data: { type, platform, ...data } });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error("PUT /api/alerts/config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
