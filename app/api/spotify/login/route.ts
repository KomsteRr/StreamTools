import { NextResponse } from "next/server";
import { getConfig } from "@/lib/spotify-config";
import { getSession, getSafeUserId } from "@/lib/session";
import { getRequestOrigin } from "@/lib/origin";

export async function GET(request: Request) {
  const session = await getSession();
  const userId = getSafeUserId(session);
  const config = await getConfig(userId);
  const client_id = config.clientId || process.env.SPOTIFY_CLIENT_ID;
  const redirect_uri =
    process.env.SPOTIFY_REDIRECT_URI ||
    config.redirect_uri ||
    `${getRequestOrigin(request)}/api/spotify/callback`;
  const state = Math.random().toString(36).substring(7); // Simple state
  const scope = "user-read-currently-playing user-read-playback-state";

  if (!client_id) {
    return NextResponse.json(
      { error: "Missing Spotify Client ID. Configure it in Settings." },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id,
    scope,
    redirect_uri,
    state,
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}
