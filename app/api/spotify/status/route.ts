import { NextResponse } from "next/server";
import { getTokens, deleteTokens } from "@/lib/spotify-tokens";
import { getSession, getSafeUserId } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  const userId = getSafeUserId(session);
  const tokens = await getTokens(userId);
  return NextResponse.json({ connected: !!tokens });
}

export async function DELETE() {
  const session = await getSession();
  const userId = getSafeUserId(session);
  await deleteTokens(userId);
  return NextResponse.json({ connected: false });
}

export const dynamic = "force-dynamic";
