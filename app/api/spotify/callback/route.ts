import { NextResponse } from "next/server";
import { saveTokens } from "@/lib/spotify-tokens";
import { getConfig } from "@/lib/spotify-config";
import { getSession, getSafeUserId } from "@/lib/session";
import { resolveSpotifyRedirectUri, getRequestOrigin } from "@/lib/origin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  // Get the current user from session (if logged in)
  const session = await getSession();
  const userId = getSafeUserId(session);

  const config = await getConfig(userId);
  const client_id = config.clientId || process.env.SPOTIFY_CLIENT_ID;
  const client_secret = config.clientSecret || process.env.SPOTIFY_CLIENT_SECRET;
  const redirect_uri = resolveSpotifyRedirectUri(
    request,
    config.redirect_uri,
    process.env.SPOTIFY_REDIRECT_URI
  );

  if (!client_id || !client_secret) {
    return NextResponse.json(
      { error: "Configuration Spotify incomplète (Client ID ou Client Secret manquant)." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      body: new URLSearchParams({
        code,
        redirect_uri,
        grant_type: "authorization_code",
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(data, { status: 400 });
    }

    // Save tokens for the current user
    await saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    }, userId);

    // Redirect back to settings page with success indicator using the real public origin
    const origin = getRequestOrigin(request);
    return NextResponse.redirect(`${origin}/settings?spotify=connected`);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
