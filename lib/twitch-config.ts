import { prisma } from "./prisma";

export interface TwitchConfig {
  channelName: string;
  botName: string;
  botPassword: string;
  twitchClientId?: string;
  twitchAccessToken?: string;
}

const DEFAULT_CONFIG: TwitchConfig = {
  channelName: "",
  botName: "",
  botPassword: "",
  twitchClientId: "",
  twitchAccessToken: "",
};

export async function getTwitchConfig(userId?: string | null): Promise<TwitchConfig> {
  const safeUserId = userId ?? null;
  const configItems = await prisma.platformConfig.findMany({
    where: safeUserId
      ? { platform: "twitch", OR: [{ userId: null }, { userId: safeUserId }] }
      : { platform: "twitch", userId: null },
  });
  const config = { ...DEFAULT_CONFIG };

  // Global values are fallbacks; user-specific values take precedence.
  const orderedItems = safeUserId
    ? [
        ...configItems.filter((item) => item.userId === null),
        ...configItems.filter((item) => item.userId === safeUserId),
      ]
    : configItems;

  orderedItems.forEach((item) => {
    if (item.key === "clientId") config.twitchClientId = item.value;
    else if (item.key === "accessToken") config.twitchAccessToken = item.value;
    else if (Object.keys(DEFAULT_CONFIG).includes(item.key)) {
      if (item.value) (config as any)[item.key] = item.value;
    }
  });

  return config;
}

export async function saveTwitchConfig(newConfig: Partial<TwitchConfig>, userId?: string | null) {
  const safeUserId = userId ?? null;
  const toSave: Record<string, string> = {};
  if (newConfig.channelName !== undefined) toSave.channelName = newConfig.channelName;
  if (newConfig.botName !== undefined) toSave.botName = newConfig.botName;
  if (newConfig.botPassword !== undefined) toSave.botPassword = newConfig.botPassword;
  if (newConfig.twitchClientId !== undefined) toSave.clientId = newConfig.twitchClientId;
  if (newConfig.twitchAccessToken !== undefined) toSave.accessToken = newConfig.twitchAccessToken;

  for (const [key, value] of Object.entries(toSave)) {
    const existing = await prisma.platformConfig.findFirst({
      where: { platform: "twitch", key, userId: safeUserId },
    });
    if (existing) {
      await prisma.platformConfig.update({
        where: { id: existing.id },
        data: { value: String(value || "") },
      });
    } else {
      await prisma.platformConfig.create({
        data: { platform: "twitch", key, value: String(value || ""), userId: safeUserId },
      });
    }
  }
}

export async function getRealTwitchStats(userId?: string | null): Promise<{ followers: number; subs: number } | null> {
  try {
    const config = await getTwitchConfig(userId);
    if (!config.channelName) return null;

    const channel = config.channelName.toLowerCase().replace(/^#/, "").trim();
    const clientId = config.twitchClientId;
    const accessToken = config.twitchAccessToken;

    if (clientId && accessToken) {
      // 1. Get user id
      const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${channel}`, {
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.data && userData.data.length > 0) {
          const broadcasterId = userData.data[0].id;

          // 2. Get followers
          const folRes = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}`, {
            headers: {
              "Client-ID": clientId,
              "Authorization": `Bearer ${accessToken}`,
            },
          });
          let followers = 0;
          if (folRes.ok) {
            const folData = await folRes.json();
            followers = folData.total ?? (folData.data ? folData.data.length : 0);
          }

          // 3. Get subs
          const subRes = await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${broadcasterId}`, {
            headers: {
              "Client-ID": clientId,
              "Authorization": `Bearer ${accessToken}`,
            },
          });
          let subs = 0;
          if (subRes.ok) {
            const subData = await subRes.json();
            subs = subData.total ?? 0;
          }

          return { followers, subs };
        }
      }
    }
  } catch (err) {
    console.error("Error fetching real Twitch stats:", err);
  }
  return null;
}
