import { prisma } from "./prisma";

export interface CombinedChatConfig {
  fontSize: number;
  maxMessages: number;
  showAvatars: boolean;
  showBadges: boolean;
  backgroundColor: string;
  textColor: string;
  chatWidth: number;
}

const DEFAULT_CHAT_CONFIG: CombinedChatConfig = {
  fontSize: 14,
  maxMessages: 30,
  showAvatars: true,
  showBadges: true,
  backgroundColor: "rgba(15, 15, 20, 0.8)",
  textColor: "#ffffff",
  chatWidth: 450,
};

export async function getCombinedChatConfig(userId?: string | null): Promise<CombinedChatConfig> {
  const safeUserId = userId ?? null;
  const items = await prisma.platformConfig.findMany({
    where: { platform: "combined-chat", userId: safeUserId },
  });

  const config: CombinedChatConfig = { ...DEFAULT_CHAT_CONFIG };
  items.forEach((item) => {
    if (item.key === "fontSize") config.fontSize = Number(item.value) || 14;
    else if (item.key === "maxMessages") config.maxMessages = Number(item.value) || 30;
    else if (item.key === "showAvatars") config.showAvatars = item.value === "true";
    else if (item.key === "showBadges") config.showBadges = item.value === "true";
    else if (item.key === "backgroundColor") config.backgroundColor = item.value;
    else if (item.key === "textColor") config.textColor = item.value;
    else if (item.key === "chatWidth") config.chatWidth = Number(item.value) || 450;
  });

  return config;
}

export async function saveCombinedChatConfig(newConfig: Partial<CombinedChatConfig>, userId?: string | null) {
  const safeUserId = userId ?? null;
  for (const [key, value] of Object.entries(newConfig)) {
    const existing = await prisma.platformConfig.findFirst({
      where: { platform: "combined-chat", key, userId: safeUserId },
    });
    if (existing) {
      await prisma.platformConfig.update({
        where: { id: existing.id },
        data: { value: String(value) },
      });
    } else {
      await prisma.platformConfig.create({
        data: { platform: "combined-chat", key, value: String(value), userId: safeUserId },
      });
    }
  }
}
