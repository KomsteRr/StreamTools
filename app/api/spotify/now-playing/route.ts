import { NextResponse } from "next/server";
import { getTokens, saveTokens } from "@/lib/spotify-tokens";
import { getConfig } from "@/lib/spotify-config";
import { isOverlayAuthorized } from "@/lib/overlay-token";
import { getSession, getSafeUserId } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  const overlayAuth = await isOverlayAuthorized(request);

  if (!session && !overlayAuth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine which user's data to fetch
  const userId = getSafeUserId(session) ?? overlayAuth.userId ?? null;

  let tokens = await getTokens(userId);

  if (!tokens) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const config = await getConfig(userId);
  const client_id = config.clientId || process.env.SPOTIFY_CLIENT_ID;
  const client_secret = config.clientSecret || process.env.SPOTIFY_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  // Check if token is expired (or close to expiring, e.g. within 60s)
  if (Date.now() > tokens.expires_at - 60000) {
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
          grant_type: "refresh_token",
          refresh_token: tokens.refresh_token,
        }),
      });

      const data = await response.json();

      if (data.error) {
        return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
      }

      tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || tokens.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };

      await saveTokens(tokens, userId);
    } catch (e) {
      return NextResponse.json({ error: "Token refresh error" }, { status: 500 });
    }
  }

  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: "Bearer " + tokens.access_token,
        },
      }
    );

    if (response.status === 204 || response.status > 400) {
      return NextResponse.json({ is_playing: false });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ is_playing: false, error: "Fetch error" });
  }
}

export const dynamic = "force-dynamic";
