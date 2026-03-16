import { NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/spotify-config";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  const config = await getConfig(session?.userId);
  return NextResponse.json({
    ...config,
    redirectURI: process.env.SPOTIFY_REDIRECT_URI,
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    await saveConfig(body, session?.userId);
    return NextResponse.json({ success: true, config: body });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}
