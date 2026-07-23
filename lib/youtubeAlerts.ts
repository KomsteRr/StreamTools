/**
 * YouTube Live Chat polling singleton.
 * Polls the YouTube Data API v3 for new chat messages,
 * and fires alerts for superchats and new memberships.
 */

import { publishAlert } from "./alertEmitter";
import { prisma } from "./prisma";

declare global {
  var _youtubePollingActiveMap: Map<string, boolean>;
  var _youtubePollingIntervalMap: Map<string, ReturnType<typeof setInterval>>;
  var _youtubeNextPageTokenMap: Map<string, string | null>;
  var _youtubeLiveChatIdMap: Map<string, string | null>;
}

if (!global._youtubePollingActiveMap) global._youtubePollingActiveMap = new Map();
if (!global._youtubePollingIntervalMap) global._youtubePollingIntervalMap = new Map();
if (!global._youtubeNextPageTokenMap) global._youtubeNextPageTokenMap = new Map();
if (!global._youtubeLiveChatIdMap) global._youtubeLiveChatIdMap = new Map();

const YT_API = "https://www.googleapis.com/youtube/v3";

export function isYouTubeConnected(userId: string | null) {
  const key = userId || "global";
  return global._youtubePollingActiveMap.get(key) || false;
}

export function disconnectYouTube(userId: string | null) {
  const key = userId || "global";
  const interval = global._youtubePollingIntervalMap.get(key);
  if (interval) {
    clearInterval(interval);
    global._youtubePollingIntervalMap.delete(key);
  }
  global._youtubePollingActiveMap.set(key, false);
  global._youtubeLiveChatIdMap.set(key, null);
  global._youtubeNextPageTokenMap.set(key, null);
}

async function getActiveLiveChatId(
  apiKey: string,
  channelId: string,
): Promise<string | null> {
  const res = await fetch(
    `${YT_API}/liveBroadcasts?part=snippet&broadcastStatus=active&broadcastType=all&key=${apiKey}&mine=false`,
    {
      headers: { "Accept": "application/json" },
    },
  );
  if (!res.ok) {
    // Try by channel ID via search
    const searchRes = await fetch(
      `${YT_API}/search?part=id&channelId=${channelId}&type=video&eventType=live&key=${apiKey}`,
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const videoId = searchData.items?.[0]?.id?.videoId;
    if (!videoId) return null;

    const videoRes = await fetch(
      `${YT_API}/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`,
    );
    if (!videoRes.ok) return null;
    const videoData = await videoRes.json();
    return videoData.items?.[0]?.liveStreamingDetails?.activeLiveChatId ?? null;
  }
  const data = await res.json();
  return data.items?.[0]?.snippet?.liveChatId ?? null;
}

async function pollMessages(userId: string | null, apiKey: string) {
  const key = userId || "global";
  const liveChatId = global._youtubeLiveChatIdMap.get(key);
  if (!liveChatId) return;

  const params = new URLSearchParams({
    part: "snippet,authorDetails",
    liveChatId,
    key: apiKey,
    maxResults: "50",
  });
  
  const pageToken = global._youtubeNextPageTokenMap.get(key);
  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const res = await fetch(`${YT_API}/liveChat/messages?${params}`);
  if (!res.ok) return;
  const data = await res.json();

  global._youtubeNextPageTokenMap.set(key, data.nextPageToken ?? null);

  const items: unknown[] = data.items ?? [];
  for (const item of items) {
    const msg = item as Record<string, unknown>;
    const snippet = msg.snippet as Record<string, unknown>;
    const author = (msg.authorDetails as Record<string, unknown>)
      ?.displayName as string;
    const msgType = snippet?.type as string;

    let alertType: string | null = null;
    let amount = 0;

    if (msgType === "superChatEvent") {
      alertType = "bits";
      const details = snippet?.superChatDetails as Record<string, unknown>;
      amount = Number(details?.amountMicros ?? 0) / 1_000_000;
    } else if (msgType === "membershipGiftingEvent") {
      alertType = "gift_sub";
      const details = snippet?.membershipGiftingDetails as Record<string, unknown>;
      amount = Number(details?.giftMembershipsCount ?? 1);
    } else if (msgType === "newSponsorEvent") {
      alertType = "sub";
      amount = 1;
    }

    if (!alertType) continue;

    const config = await prisma.alertConfig.findFirst({
      where: { type: alertType, platform: "youtube", userId },
    });
    if (!config || !config.enabled) continue;

    const text = config.text
      .replace(/\{user\}/g, author ?? "Unknown")
      .replace(/\{amount\}/g, String(amount));

    publishAlert(userId, {
      id: crypto.randomUUID(),
      type: alertType,
      platform: "youtube",
      text,
      soundUrl: config.soundUrl,
      imageUrl: config.imageUrl,
      bgMediaUrl: config.bgMediaUrl,
      bgMediaType: config.bgMediaType,
      duration: config.duration,
      volume: config.volume,
      bgColor: config.bgColor,
      textColor: config.textColor,
      fontSize: config.fontSize,
      animation: config.animation,
      exitAnimation: config.exitAnimation,
      position: config.position,
      glowColor: config.glowColor,
      glowSize: config.glowSize,
      borderColor: config.borderColor,
      borderWidth: config.borderWidth,
      bgOverlayOpacity: config.bgOverlayOpacity,
    });
  }
}

export async function connectYouTube(userId: string | null): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (isYouTubeConnected(userId)) return { ok: true };

  const key = userId || "global";

  const rows = await prisma.platformConfig.findMany({
    where: { platform: "youtube", userId },
  });
  const cfg: Record<string, string> = {};
  rows.forEach((r) => (cfg[r.key] = r.value));

  const { apiKey, channelId } = cfg;
  if (!apiKey || !channelId) {
    return {
      ok: false,
      error: "API Key et Channel ID YouTube requis dans les paramètres.",
    };
  }

  const chatId = await getActiveLiveChatId(apiKey, channelId);
  if (!chatId) {
    return {
      ok: false,
      error:
        "Aucun live YouTube actif trouvé. Lancez votre stream puis reconnectez.",
    };
  }

  global._youtubeLiveChatIdMap.set(key, chatId);
  global._youtubePollingActiveMap.set(key, true);
  console.log(`[YouTubeAlerts] Polling live chat for user ${key}:`, chatId);

  // Initial poll to set page token (skip existing messages)
  await pollMessages(userId, apiKey);

  const intervalId = setInterval(() => {
    pollMessages(userId, apiKey).catch(console.error);
  }, 8000); // poll every 8 seconds (YouTube rate limits to ~1 req/sec for free tier)
  
  global._youtubePollingIntervalMap.set(key, intervalId);

  return { ok: true };
}
