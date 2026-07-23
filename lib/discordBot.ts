import { Client, GatewayIntentBits, Partials } from "discord.js";
import { prisma } from "@/lib/prisma";
import { discordMediaEmitter } from "./discordMediaEmitter";
import { chatEmitter } from "./chatEmitter";

interface DiscordBotInstance {
  client: Client;
  channelId: string;
}

declare global {
  var _discordBotInstance: DiscordBotInstance | undefined;
}

export async function getDiscordConfig(userId?: string | null) {
  const safeUserId = userId ?? null;
  const items = await prisma.platformConfig.findMany({
    where: { platform: "discord", userId: safeUserId },
  });

  const config = {
    botToken: "",
    channelId: "",
  };

  items.forEach((item) => {
    if (item.key === "botToken") config.botToken = item.value;
    if (item.key === "channelId") config.channelId = item.value;
  });

  return config;
}

export async function saveDiscordConfig(
  newConfig: { botToken?: string; channelId?: string },
  userId?: string | null
) {
  const safeUserId = userId ?? null;
  for (const [key, value] of Object.entries(newConfig)) {
    const existing = await prisma.platformConfig.findFirst({
      where: { platform: "discord", key, userId: safeUserId },
    });
    if (existing) {
      await prisma.platformConfig.update({
        where: { id: existing.id },
        data: { value: String(value || "") },
      });
    } else {
      await prisma.platformConfig.create({
        data: { platform: "discord", key, value: String(value || ""), userId: safeUserId },
      });
    }
  }
}

export function isDiscordBotConnected(): boolean {
  return !!globalThis._discordBotInstance?.client?.user;
}

export async function connectDiscordBot(userId?: string | null): Promise<{ ok: boolean; error?: string }> {
  const config = await getDiscordConfig(userId);
  if (!config.botToken || !config.channelId) {
    return { ok: false, error: "Bot Token ou ID du canal Discord manquant." };
  }

  if (globalThis._discordBotInstance?.client) {
    try {
      globalThis._discordBotInstance.client.destroy();
    } catch {}
  }

  try {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Message, Partials.Channel],
    });

    client.on("ready", () => {
      console.log(`[Discord Bot] Connecté en tant que ${client.user?.tag}`);
    });

    client.on("messageCreate", (message) => {
      // Ignore bot messages or messages outside target channel
      if (message.author.bot) return;
      if (message.channelId !== config.channelId) return;

      const authorName = message.author.displayName || message.author.username;
      const authorAvatar = message.author.displayAvatarURL({ extension: "png" });
      const content = message.content;

      // 1. Emit for Combined Chat
      if (content.trim()) {
        chatEmitter.addMessage({
          platform: "discord",
          user: authorName,
          avatar: authorAvatar,
          message: content,
          color: "#5865F2",
        });
      }

      // 2. Extract media attachments & Tenor/Giphy embeds
      let mediaType: "image" | "gif" | "video" | "audio" | "text" = "text";
      let mediaUrl: string | undefined = undefined;

      if (message.attachments.size > 0) {
        const attachment = message.attachments.first();
        if (attachment) {
          const contentType = attachment.contentType || "";
          const url = attachment.url;

          if (contentType.startsWith("video/") || url.match(/\.(mp4|webm|mov)$/i)) {
            mediaType = "video";
            mediaUrl = url;
          } else if (contentType.startsWith("audio/") || url.match(/\.(mp3|wav|ogg)$/i)) {
            mediaType = "audio";
            mediaUrl = url;
          } else if (url.match(/\.gif$/i) || contentType.includes("gif")) {
            mediaType = "gif";
            mediaUrl = url;
          } else if (contentType.startsWith("image/") || url.match(/\.(jpg|jpeg|png|webp)$/i)) {
            mediaType = "image";
            mediaUrl = url;
          }
        }
      }

      // Check Tenor / Giphy / Image Embeds if no attachment
      if (!mediaUrl && message.embeds.length > 0) {
        const embed = message.embeds[0];
        if (embed.video?.url) {
          mediaType = "video";
          mediaUrl = embed.video.url;
        } else if (embed.image?.url) {
          mediaType = embed.image.url.includes(".gif") ? "gif" : "image";
          mediaUrl = embed.image.url;
        } else if (embed.thumbnail?.url) {
          mediaType = embed.thumbnail.url.includes(".gif") ? "gif" : "image";
          mediaUrl = embed.thumbnail.url;
        }
      }

      // Also check Giphy/Tenor direct links in content
      if (!mediaUrl && content) {
        const gifMatch = content.match(/https?:\/\/[^\s]+(tenor|giphy)[^\s]+/i);
        if (gifMatch) {
          mediaType = "gif";
          mediaUrl = gifMatch[0];
        }
      }

      // Emit media alert
      discordMediaEmitter.emitMediaAlert({
        authorName,
        authorAvatar,
        content,
        mediaType,
        mediaUrl,
      });
    });

    await client.login(config.botToken);
    globalThis._discordBotInstance = { client, channelId: config.channelId };
    return { ok: true };
  } catch (err: any) {
    console.error("[Discord Bot Login Error]:", err);
    return { ok: false, error: err.message || "Erreur de connexion au Bot Discord." };
  }
}

export function disconnectDiscordBot() {
  if (globalThis._discordBotInstance?.client) {
    try {
      globalThis._discordBotInstance.client.destroy();
    } catch {}
    globalThis._discordBotInstance = undefined;
  }
}

