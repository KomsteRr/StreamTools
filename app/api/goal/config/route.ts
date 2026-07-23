import { NextResponse } from "next/server";
import { getGoalConfig, saveGoalConfig } from "@/lib/goal-config";
import { getSession, getSafeUserId } from "@/lib/session";
import { isOverlayAuthorized } from "@/lib/overlay-token";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const isAuth = await isOverlayAuthorized(request);
    const userId = getSafeUserId(session) ?? isAuth.userId ?? null;
    const config = await getGoalConfig(userId);
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed to load goal config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const userId = getSafeUserId(session);
    const body = await request.json();
    await saveGoalConfig(body, userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save goal config" }, { status: 500 });
  }
}
