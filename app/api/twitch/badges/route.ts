import { NextResponse } from "next/server";
import { getTwitchConfig } from "@/lib/twitch-config";

export const dynamic = "force-dynamic";

let cachedBadges: { map: Record<string, string>; fetchedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

/** Rewrite external image URLs to go through the local proxy (avoids OBS/CSP issues). */
function proxyUrl(url: string): string {
  return `/api/proxy/image?url=${encodeURIComponent(url)}`;
}

interface BadgeVersionObj {
  id?: string;
  image_url_1x?: string;
  image_url_2x?: string;
  image_url_4x?: string;
}

interface HelixBadgeItem {
  set_id?: string;
  versions?: BadgeVersionObj[];
}

function parseBadgeSets(badgeSets: Record<string, { versions?: Record<string, BadgeVersionObj> }> | null | undefined, map: Record<string, string>) {
  if (!badgeSets) return;
  for (const [setId, setObj] of Object.entries(badgeSets)) {
    if (setObj && setObj.versions) {
      for (const [versionId, versionObj] of Object.entries(setObj.versions)) {
        const rawUrl = versionObj.image_url_2x || versionObj.image_url_1x || versionObj.image_url_4x;
        if (rawUrl) {
          const url = proxyUrl(rawUrl);
          map[`${setId.toLowerCase()}/${versionId}`] = url;
          if (!map[setId.toLowerCase()]) {
            map[setId.toLowerCase()] = url;
          }
        }
      }
    }
  }
}

function parseHelixBadges(data: HelixBadgeItem[] | undefined, map: Record<string, string>) {
  if (!Array.isArray(data)) return;
  for (const setItem of data) {
    const setId = setItem.set_id?.toLowerCase();
    if (!setId) continue;
    if (Array.isArray(setItem.versions)) {
      for (const ver of setItem.versions) {
        const versionId = ver.id;
        const rawUrl = ver.image_url_2x || ver.image_url_1x || ver.image_url_4x;
        if (rawUrl) {
          const url = proxyUrl(rawUrl);
          map[`${setId}/${versionId}`] = url;
          if (!map[setId]) {
            map[setId] = url;
          }
        }
      }
    }
  }
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedBadges && now - cachedBadges.fetchedAt < CACHE_TTL) {
      return NextResponse.json(cachedBadges.map);
    }

    const badgesMap: Record<string, string> = {};

    // 1. Fetch Global Badges from badges.twitch.tv public endpoint
    try {
      const globalRes = await fetch("https://badges.twitch.tv/v1/badges/global/display", {
        headers: { "Client-ID": "kimne78kx3ncx6br8ac4bb50c8b543" },
      });
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        parseBadgeSets(globalData.badge_sets, badgesMap);
      }
    } catch {}

    // 2. Fetch Helix Badges if API credentials exist
    try {
      const config = await getTwitchConfig();
      const clientId = config.twitchClientId;
      const accessToken = config.twitchAccessToken;

      if (clientId && accessToken) {
        const helixGlobalRes = await fetch("https://api.twitch.tv/helix/chat/badges/global", {
          headers: {
            "Client-ID": clientId,
            "Authorization": `Bearer ${accessToken}`,
          },
        });
        if (helixGlobalRes.ok) {
          const helixData = await helixGlobalRes.json();
          parseHelixBadges(helixData.data, badgesMap);
        }

        if (config.channelName) {
          const cleanChannel = config.channelName.toLowerCase().replace(/^#/, "").trim();
          const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${cleanChannel}`, {
            headers: {
              "Client-ID": clientId,
              "Authorization": `Bearer ${accessToken}`,
            },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.data && userData.data[0]?.id) {
              const broadcasterId = userData.data[0].id;
              const channelRes = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${broadcasterId}`, {
                headers: {
                  "Client-ID": clientId,
                  "Authorization": `Bearer ${accessToken}`,
                },
              });
              if (channelRes.ok) {
                const channelData = await channelRes.json();
                parseHelixBadges(channelData.data, badgesMap);
              }
            }
          }
        }
      }
    } catch {}

    cachedBadges = { map: badgesMap, fetchedAt: now };
    return NextResponse.json(badgesMap);
  } catch (error) {
    console.error("Error fetching Twitch badges:", error);
    return NextResponse.json({});
  }
}
