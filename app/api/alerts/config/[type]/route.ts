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

function pickAlertConfigFields(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) =>
      (ALERT_CONFIG_FIELDS as readonly string[]).includes(key),
    ),
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const platform = new URL(req.url).searchParams.get("platform") ?? "twitch";
  const session = await getSession();
  const userId = getSafeUserId(session);

  try {
    const config = await prisma.alertConfig.findFirst({
      where: { type, platform, userId },
    });
    if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/alerts/config/[type] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const platform = new URL(req.url).searchParams.get("platform") ?? "twitch";
  const session = await getSession();
  const userId = getSafeUserId(session);

  try {
    const fields = pickAlertConfigFields(await req.json());
    const existing = await prisma.alertConfig.findFirst({
      where: { type, platform, userId },
    });

    const config = existing
      ? await prisma.alertConfig.update({ where: { id: existing.id }, data: fields })
      : await prisma.alertConfig.create({ data: { type, platform, ...fields, userId } });

    return NextResponse.json(config);
  } catch (error) {
    console.error("PUT /api/alerts/config/[type] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
