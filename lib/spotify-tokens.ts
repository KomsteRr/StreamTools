import { prisma } from "@/lib/prisma";

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export async function getTokens(userId?: string | null): Promise<SpotifyTokens | null> {
  try {
    const safeUserId = userId ?? null;
    const token = await prisma.spotifyToken.findFirst({
      where: { userId: safeUserId },
    });
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

export async function saveTokens(tokens: SpotifyTokens, userId?: string | null) {
  try {
    const safeUserId = userId ?? null;
    // Note: SpotifyToken doesn't have a compound unique constraint,
    // so we use findFirst + update/create instead of upsert.
    const existing = await prisma.spotifyToken.findFirst({
      where: { userId: safeUserId },
    });

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
          userId: safeUserId,
        },
      });
    }
  } catch (e) {
    console.error("Error saving token to DB", e);
  }
}
