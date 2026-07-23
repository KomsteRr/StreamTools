import { NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/spotify-config";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getConfig(session.userId);
  const { clientSecret: _clientSecret, ...safeConfig } = config;
  void _clientSecret;

  return NextResponse.json({
    ...safeConfig,
    redirectURI: process.env.SPOTIFY_REDIRECT_URI,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await saveConfig(body, session.userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 },
    );
  }
}
