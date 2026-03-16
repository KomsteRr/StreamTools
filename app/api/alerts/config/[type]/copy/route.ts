import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getSafeUserId } from "@/lib/session";

// POST /api/alerts/config/[type]/copy
// Body: { fromPlatform: "twitch", toPlatform: "youtube" }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const session = await getSession();
  const userId = getSafeUserId(session);

  try {
    const { fromPlatform, toPlatform } = await req.json();
    if (!fromPlatform || !toPlatform) {
      return NextResponse.json(
        { error: "fromPlatform and toPlatform required" },
        { status: 400 },
      );
    }

    const source = await prisma.alertConfig.findFirst({
      where: { type, platform: fromPlatform, userId },
    });
    if (!source) {
      return NextResponse.json(
        { error: `No config found for ${type}/${fromPlatform}` },
        { status: 404 },
      );
    }

    // Strip primary key + identity fields
    const { id: _id, platform: _p, type: _t, userId: _uid, ...copyData } = source;
    void _id; void _p; void _t; void _uid;

    // Check if target already exists
    const existing = await prisma.alertConfig.findFirst({
      where: { type, platform: toPlatform, userId },
    });

    let result;
    if (existing) {
      result = await prisma.alertConfig.update({
        where: { id: existing.id },
        data: copyData,
      });
    } else {
      result = await prisma.alertConfig.create({
        data: { 
          type, 
          platform: toPlatform, 
          ...copyData, 
          userId: userId 
        } as any, // Type assertion since Prisma type inference struggles with the spread here
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/alerts/config/[type]/copy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
