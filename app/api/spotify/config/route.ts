import { NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/spotify-config";

export async function GET() {
  const config = await getConfig();
  return NextResponse.json({
    ...config,
    redirectURI: process.env.SPOTIFY_REDIRECT_URI,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await saveConfig(body);
    return NextResponse.json({ success: true, config: body });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}
