import { NextResponse } from "next/server";
import { getWheelConfig, wheelEmitter } from "@/lib/wheel-config";
import { getSession, getSafeUserId } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = getSafeUserId(session);
    const config = await getWheelConfig(userId);
    if (!config.segments || config.segments.length < 2) {
      return NextResponse.json({ error: "At least 2 segments are required" }, { status: 400 });
    }

    const winnerIndex = Math.floor(Math.random() * config.segments.length);
    wheelEmitter.spin(userId, winnerIndex);
    return NextResponse.json({ winnerIndex, segment: config.segments[winnerIndex] });
  } catch {
    return NextResponse.json({ error: "Failed to spin the wheel" }, { status: 500 });
  }
}
