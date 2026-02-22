import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/alerts/config/[type]?platform=twitch
export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const url = new URL(req.url);
  const platform = url.searchParams.get("platform") ?? "twitch";

  try {
    const config = await prisma.alertConfig.findFirst({
      where: { type, platform },
    });
    if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/alerts/config/[type] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/alerts/config/[type]?platform=twitch
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const url = new URL(req.url);
  const platform = url.searchParams.get("platform") ?? "twitch";

  try {
    const data = await req.json();
    // Remove type/platform from data payload to avoid conflicts
    const { type: _t, platform: _p, id: _id, ...fields } = data;
    void _t; void _p; void _id;

    const existing = await prisma.alertConfig.findFirst({ where: { type, platform } });

    let config;
    if (existing) {
      config = await prisma.alertConfig.update({
        where: { id: existing.id },
        data: fields,
      });
    } else {
      config = await prisma.alertConfig.create({
        data: { type, platform, ...fields },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("PUT /api/alerts/config/[type] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
