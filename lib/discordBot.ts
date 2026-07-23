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

    client.on("messageCreate", async (message) => {
      // Ignore bot messages or messages outside target channel
      if (message.author.bot) return;
      if (message.channelId !== config.channelId) return;

      const authorName = message.author.displayName || message.author.username;
      const authorAvatar = message.author.displayAvatarURL({ extension: "png" });
      const content = message.content;

      // Extract media attachments & embeds (Videos, YouTube, Twitter, GIFs, Images)
      let mediaType: "image" | "gif" | "video" | "audio" | "youtube" | "text" = "text";
      let mediaUrl: string | undefined = undefined;

      // A. Attachments
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

      // B. YouTube Video Link (Watch, Shorts, Youtu.be)
      if (!mediaUrl && content) {
        const ytMatch = content.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
        if (ytMatch) {
          mediaType = "youtube";
          mediaUrl = ytMatch[1];
        }
      }

      // C. Twitter / X Video or Media Link
      if (!mediaUrl && content) {
        const tweetMatch = content.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/i);
        if (tweetMatch) {
          const tweetId = tweetMatch[2];
          // Check Discord embeds first for video URL
          if (message.embeds.length > 0) {
            for (const embed of message.embeds) {
              if (embed.video?.url) {
                mediaType = "video";
                mediaUrl = embed.video.url;
                break;
              } else if (embed.image?.url) {
                mediaType = embed.image.url.includes(".gif") ? "gif" : "image";
                mediaUrl = embed.image.url;
                break;
              }
            }
          }

          // If no embed video found yet, query fxtwitter API for direct MP4
          if (!mediaUrl) {
            try {
              const fxRes = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
                headers: { "User-Agent": "StreamAllInTools/1.0" },
              });
              if (fxRes.ok) {
                const fxData = await fxRes.json();
                const tweet = fxData.tweet;
                if (tweet?.media?.videos?.length > 0) {
                  mediaType = "video";
                  mediaUrl = tweet.media.videos[0].url;
                } else if (tweet?.media?.photos?.length > 0) {
                  mediaType = "image";
                  mediaUrl = tweet.media.photos[0].url;
                }
              }
            } catch (e) {
              console.error("[Discord Bot] Error fetching fxtwitter media:", e);
            }
          }
        }
      }

      // D. TikTok Video Link
      if (!mediaUrl && content) {
        const tiktokMatch = content.match(/https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/(?:@[a-zA-Z0-9_.]+\/video\/|v\/|t\/)?([a-zA-Z0-9_-]+)/i);
        if (tiktokMatch) {
          const fullTiktokUrl = tiktokMatch[0];
          // Check Discord embeds first for video URL
          if (message.embeds.length > 0) {
            for (const embed of message.embeds) {
              if (embed.video?.url) {
                mediaType = "video";
                mediaUrl = embed.video.url;
                break;
              }
            }
          }

          if (!mediaUrl) {
            try {
              const tikwmRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(fullTiktokUrl)}`, {
                headers: { "User-Agent": "StreamAllInTools/1.0" },
              });
              if (tikwmRes.ok) {
                const tikwmData = await tikwmRes.json();
                if (tikwmData.code === 0 && tikwmData.data?.play) {
                  mediaType = "video";
                  mediaUrl = tikwmData.data.play;
                }
              }
            } catch (e) {
              console.error("[Discord Bot] Error fetching TikWM media:", e);
            }
          }
        }
      }

      // E. Instagram Reels / Video Link
      if (!mediaUrl && content) {
        const instaMatch = content.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/i);
        if (instaMatch) {
          const reelId = instaMatch[1];
          // Check Discord embeds first
          if (message.embeds.length > 0) {
            for (const embed of message.embeds) {
              if (embed.video?.url) {
                mediaType = "video";
                mediaUrl = embed.video.url;
                break;
              }
            }
          }

          if (!mediaUrl) {
            try {
              const ddRes = await fetch(`https://api.ddinstagram.com/reel/${reelId}`, {
                headers: { "User-Agent": "StreamAllInTools/1.0" },
              });
              if (ddRes.ok) {
                const ddData = await ddRes.json();
                if (ddData.video_url || ddData.url) {
                  mediaType = "video";
                  mediaUrl = ddData.video_url || ddData.url;
                }
              }
            } catch {
              // Fallback to direct ddinstagram video format
              mediaType = "video";
              mediaUrl = `https://ddinstagram.com/videos/${reelId}/1.mp4`;
            }
          }
        }
      }

      // F. Check Discord Embeds (Tenor / Giphy / video / image) if still no mediaUrl
      if (!mediaUrl && message.embeds.length > 0) {
        for (const embed of message.embeds) {
          const imgUrl = embed.image?.url || embed.thumbnail?.url;
          const videoUrl = embed.video?.url;

          if (videoUrl) {
            mediaType = videoUrl.match(/\.(mp4|webm|mov)$/i) ? "video" : "gif";
            mediaUrl = videoUrl;
            break;
          } else if (imgUrl) {
            mediaType = imgUrl.includes(".gif") || embed.provider?.name?.toLowerCase().includes("tenor") || embed.provider?.name?.toLowerCase().includes("giphy") ? "gif" : "image";
            mediaUrl = imgUrl;
            break;
          }
        }
      }

      // G. Check direct video / gif / image links in content
      if (!mediaUrl && content) {
        const directVidMatch = content.match(/https?:\/\/[^\s]+\.(mp4|webm|mov)(\?[^\s]*)?/i);
        if (directVidMatch) {
          mediaType = "video";
          mediaUrl = directVidMatch[0];
        } else {
          const directGifMatch = content.match(/https?:\/\/[^\s]+\.(gif|webp|png|jpg|jpeg)(\?[^\s]*)?/i);
          if (directGifMatch) {
            mediaType = directGifMatch[1].toLowerCase() === "gif" ? "gif" : "image";
            mediaUrl = directGifMatch[0];
          } else {
            const gifSiteMatch = content.match(/https?:\/\/[^\s]+(tenor|giphy)[^\s]+/i);
            if (gifSiteMatch) {
              mediaType = "gif";
              mediaUrl = gifSiteMatch[0];
            }
          }
        }
      }

      // Clean message content: strip all URLs (YouTube, Twitter/X, TikTok, Instagram, Tenor, Giphy, direct media) from display text
      let displayContent = content;
      if (mediaUrl || content.match(/https?:\/\/[^\s]+/i)) {
        displayContent = displayContent
          .replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+(\&[^\s]*)?/gi, "")
          .replace(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+(\?[^\s]*)?/gi, "")
          .replace(/https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+/gi, "")
          .replace(/https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p)\/[a-zA-Z0-9_-]+(\?[^\s]*)?/gi, "")
          .replace(/https?:\/\/[^\s]*(tenor\.com|giphy\.com|cdn\.discordapp\.com|media\.discordapp\.net|ddinstagram\.com)[^\s]*/gi, "")
          .replace(/https?:\/\/[^\s]+\.(gif|png|jpg|jpeg|webp|mp4|webm|mov)(\?[^\s]*)?/gi, "")
          .replace(/https?:\/\/[^\s]+/gi, "")
          .trim();
      }

      // Emit media alert
      discordMediaEmitter.emitMediaAlert(userId, {
        authorName,
        authorAvatar,
        content: displayContent,
        mediaType,
        mediaUrl,
      });

      // Auto-delete message from Discord channel immediately
      try {
        if (message.deletable) {
          message.delete().catch(() => {});
        } else {
          message.delete().catch(() => {});
        }
      } catch {}
    });

    await client.login(config.botToken);
    globalThis._discordBotInstance = { client, channelId: config.channelId };
    return { ok: true };
  } catch (err: unknown) {
    console.error("[Discord Bot Login Error]:", err);
    const message = err instanceof Error ? err.message : "Erreur de connexion au Bot Discord.";
    return { ok: false, error: message };
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

