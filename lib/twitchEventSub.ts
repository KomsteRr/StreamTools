/**
 * Twitch EventSub WebSocket singleton.
 * Persists across Next.js HMR via globalThis.
 * Subscribes to follow, sub, bits, raid, cheer, gift_sub events.
 */

import { publishAlert } from "./alertEmitter";
import { prisma } from "./prisma";

interface TwitchCredentials {
  channelName: string;
  broadcasterId: string;
  clientId: string;
  accessToken: string;
}

declare global {
  // eslint-disable-next-line no-var
  var _twitchEventSubWs: WebSocket | null;
  // eslint-disable-next-line no-var
  var _twitchEventSubActive: boolean;
}

if (!global._twitchEventSubWs) global._twitchEventSubWs = null;
if (!global._twitchEventSubActive) global._twitchEventSubActive = false;

export function isTwitchConnected() {
  return (
    global._twitchEventSubActive &&
    global._twitchEventSubWs !== null &&
    global._twitchEventSubWs.readyState === 1 // OPEN
  );
}

export function disconnectTwitch() {
  if (global._twitchEventSubWs) {
    try {
      global._twitchEventSubWs.close();
    } catch {}
    global._twitchEventSubWs = null;
  }
  global._twitchEventSubActive = false;
}

async function subscribeToEvent(
  sessionId: string,
  credentials: TwitchCredentials,
  type: string,
  version: string,
  condition: Record<string, string>,
) {
  const res = await fetch(
    "https://api.twitch.tv/helix/eventsub/subscriptions",
    {
      method: "POST",
      headers: {
        "Client-Id": credentials.clientId,
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        version,
        condition,
        transport: { method: "websocket", session_id: sessionId },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    console.error(`[TwitchEventSub] Failed to subscribe to ${type}:`, err);
  }
}

function mapEventToAlert(type: string, event: Record<string, unknown>) {
  const username =
    (event.user_name as string) ||
    (event.from_broadcaster_user_name as string) ||
    "Unknown";
  const amount =
    (event.bits as number) ||
    (event.cumulative_total as number) ||
    (event.viewers as number) ||
    (event.total as number) ||
    1;

  return {
    type,
    platform: "twitch",
    username,
    amount,
  };
}

export async function connectTwitch(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (isTwitchConnected()) return { ok: true };

  // Load credentials from PlatformConfig
  const rows = await prisma.platformConfig.findMany({
    where: { platform: "twitch" },
  });
  const cfg: Record<string, string> = {};
  rows.forEach((r) => (cfg[r.key] = r.value));

  const { channelName, broadcasterId, clientId, accessToken } = cfg;
  if (!channelName || !broadcasterId || !clientId || !accessToken) {
    return {
      ok: false,
      error: "Credentials manquants dans les paramètres Twitch.",
    };
  }

  const credentials: TwitchCredentials = {
    channelName,
    broadcasterId,
    clientId,
    accessToken,
  };

  return new Promise((resolve) => {
    let resolved = false;
    const done = (result: { ok: boolean; error?: string }) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      resolve(result);
    };

    const ws = new WebSocket("wss://eventsub.wss.twitch.tv/ws");
    global._twitchEventSubWs = ws as unknown as WebSocket;

    const timeout = setTimeout(() => {
      ws.close();
      done({ ok: false, error: "Timeout de connexion Twitch (10s)." });
    }, 10000);

    ws.onopen = () => {
      console.log("[TwitchEventSub] WebSocket connected");
    };

    ws.onmessage = async (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      const metadata = msg.metadata as Record<string, unknown>;
      const payload = msg.payload as Record<string, unknown>;
      const msgType = metadata?.message_type as string;

      if (msgType === "session_welcome") {
        clearTimeout(timeout);
        const session = payload?.session as Record<string, unknown>;
        const sessionId = session?.id as string;
        global._twitchEventSubActive = true;

        // Subscribe to all events
        await subscribeToEvent(sessionId, credentials, "channel.follow", "2", {
          broadcaster_user_id: broadcasterId,
          moderator_user_id: broadcasterId,
        });
        await subscribeToEvent(
          sessionId,
          credentials,
          "channel.subscribe",
          "1",
          { broadcaster_user_id: broadcasterId },
        );
        await subscribeToEvent(
          sessionId,
          credentials,
          "channel.subscription.gift",
          "1",
          { broadcaster_user_id: broadcasterId },
        );
        await subscribeToEvent(
          sessionId,
          credentials,
          "channel.cheer",
          "1",
          { broadcaster_user_id: broadcasterId },
        );
        await subscribeToEvent(
          sessionId,
          credentials,
          "channel.raid",
          "1",
          { to_broadcaster_user_id: broadcasterId },
        );
        await subscribeToEvent(
          sessionId,
          credentials,
          "channel.subscription.message",
          "1",
          { broadcaster_user_id: broadcasterId },
        );

        console.log("[TwitchEventSub] Subscribed to all events");
        done({ ok: true });
      }

      if (msgType === "notification") {
        const sub = payload?.subscription as Record<string, unknown>;
        const subType = sub?.type as string;
        const eventData = payload?.event as Record<string, unknown>;

        const typeMap: Record<string, string> = {
          "channel.follow": "follow",
          "channel.subscribe": "sub",
          "channel.subscription.message": "sub",
          "channel.subscription.gift": "gift_sub",
          "channel.cheer": "bits",
          "channel.raid": "raid",
        };

        const alertType = typeMap[subType];
        if (!alertType) return;

        const info = mapEventToAlert(alertType, eventData);

        // Fetch the alert config
        const config = await prisma.alertConfig.findFirst({
          where: { type: alertType, platform: "twitch" },
        });
        if (!config || !config.enabled) return;

        const text = config.text
          .replace(/\{user\}/g, info.username)
          .replace(/\{amount\}/g, String(info.amount));

        publishAlert({
          id: crypto.randomUUID(),
          type: alertType,
          platform: "twitch",
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

      if (msgType === "session_keepalive") {
        // Heartbeat — do nothing
      }

      if (msgType === "reconnect") {
        const reqPayload = payload?.session as Record<string, unknown>;
        const newUrl = reqPayload?.reconnect_url as string;
        console.log("[TwitchEventSub] Reconnect requested:", newUrl);
        ws.close();
        // Could reconnect automatically here
      }
    };

    ws.onerror = (err) => {
      console.error("[TwitchEventSub] WebSocket error", err);
      global._twitchEventSubActive = false;
      global._twitchEventSubWs = null;
      done({ ok: false, error: "Erreur WebSocket Twitch. Vérifiez vos credentials et votre connexion." });
    };

    ws.onclose = (event) => {
      console.log("[TwitchEventSub] WebSocket closed, code:", event.code);
      global._twitchEventSubActive = false;
      global._twitchEventSubWs = null;
      done({ ok: false, error: `Connexion fermée (code ${event.code}). Vérifiez vos credentials Twitch.` });
    };
  });
}
