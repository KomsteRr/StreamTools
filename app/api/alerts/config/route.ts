import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getSafeUserId } from "@/lib/session";

const ALERT_CONFIG_FIELDS = [
  "enabled", "soundUrl", "imageUrl", "bgMediaUrl", "bgMediaType",
  "text", "textColor", "fontSize", "glowColor", "glowSize",
  "borderColor", "borderWidth", "duration", "volume", "bgColor",
  "bgOverlayOpacity", "position", "animation", "exitAnimation",
  "containerImageUrl", "containerWidth", "containerHeight",
  "containerLayout", "textAlign", "imageSize", "fontFamily",
] as const;

function pickAlertConfigFields(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) =>
      (ALERT_CONFIG_FIELDS as readonly string[]).includes(key),
    ),
  ) as Record<string, unknown>;
}

const ALERT_DEFAULTS: Record<string, { text: string; bgColor: string }> = {
  follow: { text: "{user} vient de follow ! 🎉", bgColor: "#6441a5" },
  sub: { text: "{user} vient de s'abonner ! 🎊", bgColor: "#1a7f37" },
  bits: { text: "{user} a donné {amount} bits ! 💜", bgColor: "#f59e0b" },
  raid: { text: "{user} raid avec {amount} viewers ! ⚔️", bgColor: "#ef4444" },
  cheer: { text: "{user} a cheer {amount} bits ! 🎉", bgColor: "#8b5cf6" },
  gift_sub: { text: "{user} offre {amount} abos ! 🎁", bgColor: "#06b6d4" },
};

async function seedDefaults(platform: string, userId: string | null) {
  for (const [type, defaults] of Object.entries(ALERT_DEFAULTS)) {
    const existing = await prisma.alertConfig.findFirst({
      where: { type, platform, userId },
    });
    if (!existing) {
      await prisma.alertConfig.create({
        data: { type, platform, ...defaults, userId },
      });
    }
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const userId = getSafeUserId(session);
    const platform = new URL(req.url).searchParams.get("platform") ?? "twitch";

    await seedDefaults(platform, userId);
    const configs = await prisma.alertConfig.findMany({
      where: { platform, userId },
      orderBy: { type: "asc" },
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error("GET /api/alerts/config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    const userId = getSafeUserId(session);
    const body = await req.json();
    const { type, platform = "twitch" } = body;
    if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });

    const data = pickAlertConfigFields(body);
    const existing = await prisma.alertConfig.findFirst({
      where: { type, platform, userId },
    });
    const config = existing
      ? await prisma.alertConfig.update({ where: { id: existing.id }, data })
      : await prisma.alertConfig.create({ data: { type, platform, ...data, userId } });

    return NextResponse.json(config);
  } catch (error) {
    console.error("PUT /api/alerts/config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
