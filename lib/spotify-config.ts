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

export async function getConfig(): Promise<VisualConfig> {
  try {
    const visualItems = await prisma.spotifyConfig.findMany();
    const techItems = await prisma.platformConfig.findMany({
      where: { platform: "spotify" },
    });
    
    if (visualItems.length === 0 && techItems.length === 0) return DEFAULT_CONFIG;

    // Convert array of key-values to object
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

export async function saveConfig(newConfig: Partial<VisualConfig>) {
  try {
    const visualKeys = ["brandColor", "accentColor", "borderRadius", "showBackground"];
    const techKeys = ["clientId", "clientSecret"];
    
    const operations: any[] = [];
    Object.entries(newConfig).forEach(([key, value]) => {
      if (visualKeys.includes(key)) {
        operations.push(
          prisma.spotifyConfig.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          })
        );
      } else if (techKeys.includes(key)) {
        operations.push(
          prisma.platformConfig.upsert({
            where: { platform_key: { platform: "spotify", key } },
            update: { value: String(value) },
            create: { platform: "spotify", key, value: String(value) },
          })
        );
      }
    });

    await prisma.$transaction(operations);
  } catch (e) {
    console.error("Error saving config", e);
  }
}
