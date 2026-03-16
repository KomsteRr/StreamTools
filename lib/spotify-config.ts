import { prisma } from "@/lib/prisma";

export interface VisualConfig {
  brandColor: string;
  accentColor: string;
  borderRadius: string;
  clientId?: string;
  clientSecret?: string;
}

const DEFAULT_CONFIG: VisualConfig = {
  brandColor: "#ff512f",
  accentColor: "#dd2476",
  borderRadius: "32px",
  clientId: "",
  clientSecret: "",
};

export async function getConfig(userId?: string | null): Promise<VisualConfig> {
  try {
    const safeUserId = userId ?? null;
    const visualItems = await prisma.spotifyConfig.findMany({
      where: { userId: safeUserId },
    });
    const techItems = await prisma.platformConfig.findMany({
      where: { platform: "spotify", userId: safeUserId },
    });
    
    if (visualItems.length === 0 && techItems.length === 0) return DEFAULT_CONFIG;

    const config = { ...DEFAULT_CONFIG } as any;
    visualItems.forEach((item) => {
      config[item.key] = item.value;
    });
    techItems.forEach((item) => {
      if (item.key === "clientId" || item.key === "clientSecret") {
        config[item.key] = item.value;
      }
    });

    return config as VisualConfig;
  } catch (e) {
    console.error("Error reading config", e);
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(newConfig: Partial<VisualConfig>, userId?: string | null) {
  try {
    const safeUserId = userId ?? null;
    const visualKeys = ["brandColor", "accentColor", "borderRadius", "showBackground"];
    const techKeys = ["clientId", "clientSecret"];
    
    for (const [key, value] of Object.entries(newConfig)) {
      if (visualKeys.includes(key)) {
        const existing = await prisma.spotifyConfig.findFirst({
          where: { key, userId: safeUserId },
        });
        if (existing) {
          await prisma.spotifyConfig.update({
            where: { id: existing.id },
            data: { value: String(value) },
          });
        } else {
          await prisma.spotifyConfig.create({
            data: { key, value: String(value), userId: safeUserId },
          });
        }
      } else if (techKeys.includes(key)) {
        const existing = await prisma.platformConfig.findFirst({
          where: { platform: "spotify", key, userId: safeUserId },
        });
        if (existing) {
          await prisma.platformConfig.update({
            where: { id: existing.id },
            data: { value: String(value) },
          });
        } else {
          await prisma.platformConfig.create({
            data: { platform: "spotify", key, value: String(value), userId: safeUserId },
          });
        }
      }
    }
  } catch (e) {
    console.error("Error saving config", e);
  }
}
