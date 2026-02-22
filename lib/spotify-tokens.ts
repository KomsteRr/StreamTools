import { prisma } from "@/lib/prisma";

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export async function getTokens(): Promise<SpotifyTokens | null> {
  try {
    const token = await prisma.spotifyToken.findFirst();
    if (!token) return null;

    return {
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expires_at: token.expiresAt.getTime(),
    };
  } catch (e) {
    console.error("Error reading token from DB", e);
    return null;
  }
}

export async function saveTokens(tokens: SpotifyTokens) {
  try {
    const existing = await prisma.spotifyToken.findFirst();

    if (existing) {
      await prisma.spotifyToken.update({
        where: { id: existing.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expires_at),
        },
      });
    } else {
      await prisma.spotifyToken.create({
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expires_at),
        },
      });
    }
  } catch (e) {
    console.error("Error saving token to DB", e);
  }
}
