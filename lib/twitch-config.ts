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
    where: { platform: "twitch", userId: safeUserId },
  });
  const config = { ...DEFAULT_CONFIG };

  configItems.forEach((item) => {
    if (item.key === "clientId") config.twitchClientId = item.value;
    else if (item.key === "accessToken") config.twitchAccessToken = item.value;
    else if (Object.keys(DEFAULT_CONFIG).includes(item.key)) {
      (config as any)[item.key] = item.value;
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
