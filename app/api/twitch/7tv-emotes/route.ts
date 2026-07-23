import { NextResponse } from "next/server";
import { getTwitchConfig } from "@/lib/twitch-config";

export const dynamic = "force-dynamic";

/** Rewrite external CDN URLs to go through the local proxy (avoids OBS/CSP issues). */
function proxyUrl(url: string): string {
  return `/api/proxy/image?url=${encodeURIComponent(url)}`;
}

// ── 7TV types ────────────────────────────────────────────────────────────────
interface SevenTvEmote {
  id: string;
  name: string;
  data?: { host?: { url?: string } };
}

// ── BTTV types ───────────────────────────────────────────────────────────────
interface BttvEmote {
  id: string;
  code: string;
}
interface BttvChannelResponse {
  channelEmotes?: BttvEmote[];
  sharedEmotes?: BttvEmote[];
}

// ── FFZ types ────────────────────────────────────────────────────────────────
interface FfzEmote {
  id: number;
  name: string;
  urls?: Record<string, string>;
}
interface FfzSet {
  emoticons?: FfzEmote[];
}

// ── In-memory cache ───────────────────────────────────────────────────────────
let cachedEmotes: { map: Record<string, string>; channel: string; fetchedAt: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// ── Helpers ───────────────────────────────────────────────────────────────────

function add7tvEmotes(emotes: any[], map: Record<string, string>) {
  if (!Array.isArray(emotes)) return;
  for (const emote of emotes) {
    const name = emote.name || emote.data?.name;
    const id = emote.id || emote.data?.id;
    if (!name || !id) continue;
    const rawHost = emote.data?.host?.url || emote.host?.url || `//cdn.7tv.app/emote/${id}`;
    let fullUrl = rawHost.startsWith("//") ? `https:${rawHost}` : rawHost.startsWith("http") ? rawHost : `https://${rawHost}`;
    if (!fullUrl.endsWith(".webp") && !fullUrl.endsWith(".gif") && !fullUrl.endsWith(".png")) {
      fullUrl = `${fullUrl}/2x.webp`;
    }
    map[name] = proxyUrl(fullUrl);
  }
}

function addBttvEmotes(emotes: BttvEmote[], map: Record<string, string>) {
  for (const emote of emotes) {
    if (!emote.code || !emote.id) continue;
    map[emote.code] = proxyUrl(`https://cdn.betterttv.net/emote/${emote.id}/2x`);
  }
}

function addFfzEmotes(emoticons: FfzEmote[], map: Record<string, string>) {
  for (const emote of emoticons) {
    if (!emote.name || !emote.id) continue;
    const url = emote.urls?.["2"] || emote.urls?.["1"] || `https://cdn.frankerfacez.com/emote/${emote.id}/2`;
    map[emote.name] = proxyUrl(url.startsWith("//") ? `https:${url}` : url);
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelParam = searchParams.get("channel");

    const twitchConfig = await getTwitchConfig();
    const channelName = channelParam || twitchConfig.channelName || "";
    const cleanChannel = channelName.toLowerCase().replace(/^#/, "").trim();
    const now = Date.now();

    if (cachedEmotes && cachedEmotes.channel === cleanChannel && now - cachedEmotes.fetchedAt < CACHE_TTL) {
      return NextResponse.json(cachedEmotes.map);
    }

    const emoteMap: Record<string, string> = {};

    // ── Resolve broadcaster Twitch numeric ID (needed for 7TV + BTTV channel emotes) ──
    let broadcasterId: string | null = null;
    if (cleanChannel && twitchConfig.twitchClientId && twitchConfig.twitchAccessToken) {
      try {
        const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${cleanChannel}`, {
          headers: {
            "Client-ID": twitchConfig.twitchClientId,
            "Authorization": `Bearer ${twitchConfig.twitchAccessToken}`,
          },
          cache: "no-store",
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          broadcasterId = userData.data?.[0]?.id ?? null;
          console.log(`[Emotes] Resolved broadcaster ID via Helix for #${cleanChannel}: ${broadcasterId}`);
        }
      } catch (e) {
        console.warn("[Emotes] Could not resolve broadcaster ID via Helix:", e);
      }
    }

    if (!broadcasterId && cleanChannel) {
      try {
        const ivrRes = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${cleanChannel}`, {
          headers: { "User-Agent": "StreamAllInTools/1.0" },
          cache: "no-store",
        });
        if (ivrRes.ok) {
          const ivrData = await ivrRes.json();
          broadcasterId = ivrData[0]?.id ?? null;
          console.log(`[Emotes] Resolved broadcaster ID via IVR for #${cleanChannel}: ${broadcasterId}`);
        }
      } catch (e) {
        console.warn("[Emotes] Could not resolve broadcaster ID via IVR:", e);
      }
    }

    // Run all fetches in parallel
    await Promise.allSettled([

      // ── 1. 7TV Global ─────────────────────────────────────────────────────
      fetch("https://7tv.io/v3/emote-sets/global", {
        headers: { "User-Agent": "StreamAllInTools/1.0" },
        cache: "no-store",
      }).then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const emotes: SevenTvEmote[] = data.emotes || [];
        add7tvEmotes(emotes, emoteMap);
        console.log(`[Emotes] 7TV global: ${emotes.length} emotes`);
      }).catch((e) => console.error("[Emotes] 7TV global failed:", e)),

      // ── 2. 7TV Channel — using numeric Twitch ID, then fetch emote set ────
      (broadcasterId ? (async () => {
        try {
          const seventvUserRes = await fetch(`https://7tv.io/v3/users/twitch/${broadcasterId}`, {
            headers: { "User-Agent": "StreamAllInTools/1.0" },
            cache: "no-store",
          });
          if (!seventvUserRes.ok) {
            console.warn(`[Emotes] 7TV user lookup failed (${seventvUserRes.status}) for broadcaster ${broadcasterId}`);
            return;
          }
          const seventvUser = await seventvUserRes.json();

          const emoteSetId: string | undefined =
            seventvUser.emote_set_id ??
            seventvUser.emote_set?.id ??
            seventvUser.user?.emote_set_id ??
            seventvUser.user?.connections?.find((c: any) => c.emote_set_id || c.emote_set)?.emote_set_id ??
            seventvUser.user?.connections?.find((c: any) => c.emote_set_id || c.emote_set)?.emote_set?.id;

          let emotes: any[] = seventvUser.emote_set?.emotes || seventvUser.user?.emote_set?.emotes || [];
          if (emoteSetId && emotes.length === 0) {
            const setRes = await fetch(`https://7tv.io/v3/emote-sets/${emoteSetId}`, {
              headers: { "User-Agent": "StreamAllInTools/1.0" },
              cache: "no-store",
            });
            if (setRes.ok) {
              const setData = await setRes.json();
              emotes = setData.emotes || [];
            }
          }
          if (emotes.length > 0) {
            add7tvEmotes(emotes, emoteMap);
            console.log(`[Emotes] 7TV channel: ${emotes.length} emotes loaded`);
          }
        } catch (e) {
          console.error("[Emotes] 7TV channel failed:", e);
        }
      })() : Promise.resolve()),

      // ── 3. BTTV Global ───────────────────────────────────────────────────
      fetch("https://api.betterttv.net/3/cached/emotes/global", {
        cache: "no-store",
      }).then(async (res) => {
        if (!res.ok) return;
        const data: BttvEmote[] = await res.json();
        addBttvEmotes(data, emoteMap);
        console.log(`[Emotes] BTTV global: ${data.length} emotes`);
      }).catch((e) => console.error("[Emotes] BTTV global failed:", e)),

      // ── 4. BTTV Channel (uses numeric Twitch ID) ─────────────────────────
      (broadcasterId ? fetch(`https://api.betterttv.net/3/cached/users/twitch/${broadcasterId}`, {
        cache: "no-store",
      }).then(async (res) => {
        if (!res.ok) return;
        const data: BttvChannelResponse = await res.json();
        const all = [...(data.channelEmotes ?? []), ...(data.sharedEmotes ?? [])];
        addBttvEmotes(all, emoteMap);
        console.log(`[Emotes] BTTV channel: ${all.length} emotes`);
      }).catch((e) => console.error("[Emotes] BTTV channel failed:", e)) : Promise.resolve()),

      // ── 5. FFZ Global ────────────────────────────────────────────────────
      fetch("https://api.frankerfacez.com/v1/set/global", {
        cache: "no-store",
      }).then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const sets: Record<string, FfzSet> = data.sets || {};
        let count = 0;
        for (const set of Object.values(sets)) {
          addFfzEmotes(set.emoticons || [], emoteMap);
          count += set.emoticons?.length ?? 0;
        }
        console.log(`[Emotes] FFZ global: ${count} emotes`);
      }).catch((e) => console.error("[Emotes] FFZ global failed:", e)),

      // ── 6. FFZ Channel ───────────────────────────────────────────────────
      (cleanChannel ? fetch(`https://api.frankerfacez.com/v1/room/${cleanChannel}`, {
        cache: "no-store",
      }).then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const sets: Record<string, FfzSet> = data.sets || {};
        let count = 0;
        for (const set of Object.values(sets)) {
          addFfzEmotes(set.emoticons || [], emoteMap);
          count += set.emoticons?.length ?? 0;
        }
        console.log(`[Emotes] FFZ channel: ${count} emotes`);
      }).catch((e) => console.error("[Emotes] FFZ channel failed:", e)) : Promise.resolve()),

    ]);

    const total = Object.keys(emoteMap).length;
    console.log(`[Emotes] ✅ Total: ${total} emotes for #${cleanChannel} (7TV + BTTV + FFZ)`);
    cachedEmotes = { map: emoteMap, channel: cleanChannel, fetchedAt: now };
    return NextResponse.json(emoteMap);

  } catch (error) {
    console.error("[Emotes] Fatal error:", error);
    return NextResponse.json({});
  }
}
