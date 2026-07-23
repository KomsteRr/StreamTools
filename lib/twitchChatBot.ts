import WebSocket from "ws";
import { chatEmitter } from "./chatEmitter";
import { prisma } from "./prisma";

interface TwitchChatInstance {
  ws: WebSocket;
  channel: string;
}

declare global {
  var _twitchChatBotMap: Map<string, TwitchChatInstance> | undefined;
}

if (!globalThis._twitchChatBotMap) {
  globalThis._twitchChatBotMap = new Map();
}

export async function initTwitchChatBot(userId?: string | null) {
  const safeUserId = userId ?? null;
  const key = safeUserId || "global";

  // Check if already connected
  const existing = globalThis._twitchChatBotMap!.get(key);

  // Get config from DB
  const items = await prisma.platformConfig.findMany({
    where: {
      platform: "twitch",
      OR: [{ userId: safeUserId }, { userId: null }],
    },
  });

  let channelName = "";
  const userSetting = items.find((i) => i.userId === safeUserId && i.key === "channelName");
  const globalSetting = items.find((i) => i.userId === null && i.key === "channelName");
  channelName = userSetting?.value || globalSetting?.value || "";

  const cleanChannel = channelName.toLowerCase().replace(/^#/, "").trim();
  if (!cleanChannel) return;

  if (existing && existing.channel !== cleanChannel) {
    try { existing.ws.close(); } catch {}
  } else if (existing && existing.ws.readyState === WebSocket.OPEN) {
    return; // Already running
  }

  try {
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    ws.on("open", () => {
      console.log(`[Twitch IRC Server] Connecting to #${cleanChannel}...`);
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send(`NICK justinfan${Math.floor(10000 + Math.random() * 90000)}`);
      ws.send(`JOIN #${cleanChannel}`);
    });

    ws.on("message", (data: WebSocket.Data) => {
      const messageStr = data.toString();

      // Answer PING to keep connection alive
      if (messageStr.startsWith("PING")) {
        ws.send("PONG :tmi.twitch.tv");
        return;
      }

      // Parse PRIVMSG
      if (messageStr.toLowerCase().includes("privmsg")) {
        const lines = messageStr.split("\r\n");
        lines.forEach((line) => {
          if (!line || !line.toLowerCase().includes("privmsg")) return;

          const match = line.match(/^(?:@([^ ]+) )?:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.*)$/);
          if (!match) return;

          const tagsStr = match[1] || "";
          const usernameFromPrefix = match[2];
          const text = match[3];
          if (!text) return;

          const tags: Record<string, string> = {};
          tagsStr.split(";").forEach((pair) => {
            const eqIdx = pair.indexOf("=");
            if (eqIdx !== -1) {
              tags[pair.substring(0, eqIdx)] = pair.substring(eqIdx + 1);
            }
          });

          const badgeList: string[] = [];
          if (tags.badges) {
            tags.badges.split(",").forEach((b) => {
              const trimmed = b.toLowerCase().trim();
              if (trimmed) badgeList.push(trimmed);
            });
          }

          // Parse Twitch native emotes from IRC tags
          // Format: emotes=emoteId:start-end,start-end/emoteId2:start-end
          const emotesByWord: Record<string, string> = {};
          if (tags.emotes) {
            const groups = tags.emotes.split("/");
            for (const group of groups) {
              const colonIdx = group.indexOf(":");
              if (colonIdx < 0) continue;
              const emoteId = group.substring(0, colonIdx);
              const positions = group.substring(colonIdx + 1);
              const firstPos = positions.split(",")[0];
              if (!firstPos) continue;
              const dashIdx = firstPos.indexOf("-");
              if (dashIdx < 0) continue;
              const start = parseInt(firstPos.substring(0, dashIdx), 10);
              const end = parseInt(firstPos.substring(dashIdx + 1), 10);
              if (isNaN(start) || isNaN(end) || start < 0 || end >= text.length) continue;
              const emoteName = text.substring(start, end + 1);
              if (emoteName) {
                emotesByWord[emoteName] = `/api/proxy/image?url=${encodeURIComponent(
                  `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/2.0`
                )}`;
              }
            }
          }

          const displayName = tags["display-name"] || usernameFromPrefix || "Anonymous";
          const color = tags.color || "#9146FF";

          chatEmitter.addMessage(safeUserId, {
            platform: "twitch",
            user: displayName,
            message: text,
            color,
            badges: badgeList,
            emotes: Object.keys(emotesByWord).length > 0 ? emotesByWord : undefined,
          });
        });
      }
    });

    ws.on("error", (err) => {
      console.error("[Twitch IRC Server Error]:", err);
    });

    ws.on("close", () => {
      console.log(`[Twitch IRC Server] Disconnected from #${cleanChannel}`);
      globalThis._twitchChatBotMap!.delete(key);
    });

    globalThis._twitchChatBotMap!.set(key, { ws, channel: cleanChannel });
  } catch (err) {
    console.error("[Twitch IRC Server Exception]:", err);
  }
}
