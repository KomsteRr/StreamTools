import { NextResponse } from "next/server";
import { getTokens } from "@/lib/spotify-tokens";

export async function GET() {
  const tokens = await getTokens();
  return NextResponse.json({ connected: !!tokens });
}

export const dynamic = "force-dynamic";
