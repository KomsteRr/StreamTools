import { NextResponse } from "next/server";
import { getTwitchConfig } from "@/lib/twitch-config";

export const dynamic = "force-dynamic";

interface SevenTvEmote {
  id: string;
  name: string;
  data?: {
    host?: {
      url?: string;
    };
  };
}

let cachedEmotes: { map: Record<string, string>; channel: string; fetchedAt: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelParam = searchParams.get("channel");

    let channelName = channelParam || "";
    if (!channelName) {
      const twitchConfig = await getTwitchConfig();
      channelName = twitchConfig.channelName || "";
    }

    const cleanChannel = channelName.toLowerCase().replace(/^#/, "").trim();
    const now = Date.now();

    if (cachedEmotes && cachedEmotes.channel === cleanChannel && now - cachedEmotes.fetchedAt < CACHE_TTL) {
      return NextResponse.json(cachedEmotes.map);
    }

    const emoteMap: Record<string, string> = {};

    // 1. Fetch 7TV Global Emotes
    try {
      const globalRes = await fetch("https://7tv.io/v3/emote-sets/global", {
        headers: { "User-Agent": "StreamAllInTools/1.0" },
        next: { revalidate: 900 },
      });
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        const emotes: SevenTvEmote[] = globalData.emotes || [];
        for (const emote of emotes) {
          if (emote.name && emote.id) {
            emoteMap[emote.name] = `https://cdn.7tv.app/emote/${emote.id}/2x.webp`;
          }
        }
      }
    } catch (e) {
      console.error("[7TV API] Failed to fetch global emotes:", e);
    }

    // 2. Fetch 7TV Channel Emotes
    if (cleanChannel) {
      try {
        const channelRes = await fetch(`https://7tv.io/v3/users/twitch/${cleanChannel}`, {
          headers: { "User-Agent": "StreamAllInTools/1.0" },
          next: { revalidate: 900 },
        });
        if (channelRes.ok) {
          const channelData = await channelRes.json();
          const emotes: SevenTvEmote[] = channelData.emote_set?.emotes || channelData.emotes || [];
          for (const emote of emotes) {
            if (emote.name && emote.id) {
              emoteMap[emote.name] = `https://cdn.7tv.app/emote/${emote.id}/2x.webp`;
            }
          }
        }
      } catch (e) {
        console.error(`[7TV API] Failed to fetch channel emotes for ${cleanChannel}:`, e);
      }
    }

    cachedEmotes = { map: emoteMap, channel: cleanChannel, fetchedAt: now };
    return NextResponse.json(emoteMap);
  } catch (error) {
    console.error("[7TV API] Error:", error);
    return NextResponse.json({});
  }
}
