import { NextResponse } from "next/server";
import { getTokens } from "@/lib/spotify-tokens";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  const tokens = await getTokens(session?.userId);
  return NextResponse.json({ connected: !!tokens });
}

export const dynamic = "force-dynamic";
