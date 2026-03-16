import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishAlert } from "@/lib/alertEmitter";
import { getSession, getSafeUserId } from "@/lib/session";

const FAKE_DATA: Record<string, { user: string; amount?: string }> = {
  follow: { user: "SuperFan42" },
  sub: { user: "TwitchPro99", amount: "1" },
  bits: { user: "BitsKing", amount: "500" },
  raid: { user: "RaiderXL", amount: "250" },
  cheer: { user: "CheerMaster", amount: "100" },
  gift_sub: { user: "GenerousGiver", amount: "5" },
};

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const userId = getSafeUserId(session);
    const { type, platform = "twitch" } = await req.json();
    if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });

    const config = await prisma.alertConfig.findFirst({
      where: { type, platform, userId },
    });
    if (!config) return NextResponse.json({ error: "Alert type not found" }, { status: 404 });

    const fake = FAKE_DATA[type] ?? { user: "TestUser", amount: "1" };
    const text = config.text
      .replace(/\{user\}/g, fake.user)
      .replace(/\{amount\}/g, fake.amount ?? "");

    publishAlert(userId, {
      id: `${Date.now()}-${Math.random()}`,
      type,
      platform,
      text,
      soundUrl: config.soundUrl,
      imageUrl: config.imageUrl,
      bgMediaUrl: config.bgMediaUrl,
      bgMediaType: config.bgMediaType,
      duration: config.duration,
      volume: config.volume,
      bgColor: config.bgColor,
      bgOverlayOpacity: config.bgOverlayOpacity,
      textColor: config.textColor,
      fontSize: config.fontSize,
      animation: config.animation,
      exitAnimation: config.exitAnimation,
      position: config.position,
      glowColor: config.glowColor,
      glowSize: config.glowSize,
      borderColor: config.borderColor,
      borderWidth: config.borderWidth,
      containerImageUrl: config.containerImageUrl,
      containerWidth: config.containerWidth,
      containerHeight: config.containerHeight,
      containerLayout: config.containerLayout,
      textAlign: config.textAlign,
      imageSize: config.imageSize,
      fontFamily: config.fontFamily,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/alerts/test error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
