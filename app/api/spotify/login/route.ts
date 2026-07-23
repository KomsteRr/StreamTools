import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getConfig } from "@/lib/spotify-config";
import { getSession, getSafeUserId } from "@/lib/session";
import { resolveSpotifyRedirectUri } from "@/lib/origin";

const STATE_COOKIE = "spotify_oauth_state";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = getSafeUserId(session);
  const config = await getConfig(userId);
  const client_id = config.clientId || process.env.SPOTIFY_CLIENT_ID;
  const redirect_uri = resolveSpotifyRedirectUri(
    request,
    config.redirect_uri,
    process.env.SPOTIFY_REDIRECT_URI,
  );
  const state = randomBytes(32).toString("base64url");
  const scope = "user-read-currently-playing user-read-playback-state";

  if (!client_id) {
    return NextResponse.json(
      { error: "Missing Spotify Client ID. Configure it in Settings." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id,
    scope,
    redirect_uri,
    state,
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`,
  );
}
