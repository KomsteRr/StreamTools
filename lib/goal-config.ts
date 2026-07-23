import { prisma } from "./prisma";
import { getRealTwitchStats } from "./twitch-config";

export interface GoalConfig {
  title: string;
  currentAmount: number;
  targetAmount: number;
  goalType: "followers_twitch" | "subs_twitch" | "followers_youtube" | "custom";
  customUnit: string;
  barColor: string;
  gradientColor: string;
  fontFamily: string;
  showPercentage: boolean;
  barHeight: number;
  borderRadius: number;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  pulseAnimation: boolean;
  confettiEnabled: boolean;
  confettiDuration: number;
}

const DEFAULT_GOAL: GoalConfig = {
  title: "Objectif Followers",
  currentAmount: 75,
  targetAmount: 100,
  goalType: "followers_twitch",
  customUnit: "",
  barColor: "#9146FF",
  gradientColor: "#FF007A",
  fontFamily: "Inter",
  showPercentage: true,
  barHeight: 28,
  borderRadius: 14,
  backgroundColor: "rgba(18, 18, 24, 0.85)",
  textColor: "#ffffff",
  fontSize: 16,
  pulseAnimation: true,
  confettiEnabled: true,
  confettiDuration: 5,
};

export async function getGoalConfig(userId?: string | null): Promise<GoalConfig> {
  const safeUserId = userId ?? null;
  const items = await prisma.platformConfig.findMany({
    where: { platform: "goal", userId: safeUserId },
  });

  const config: GoalConfig = { ...DEFAULT_GOAL };
  items.forEach((item) => {
    if (item.key === "title") config.title = item.value;
    else if (item.key === "currentAmount") config.currentAmount = Number(item.value) || 0;
    else if (item.key === "targetAmount") config.targetAmount = Number(item.value) || 100;
    else if (item.key === "goalType") config.goalType = item.value as any;
    else if (item.key === "customUnit") config.customUnit = item.value;
    else if (item.key === "barColor") config.barColor = item.value;
    else if (item.key === "gradientColor") config.gradientColor = item.value;
    else if (item.key === "fontFamily") config.fontFamily = item.value;
    else if (item.key === "showPercentage") config.showPercentage = item.value === "true";
    else if (item.key === "barHeight") config.barHeight = Number(item.value) || 28;
    else if (item.key === "borderRadius") config.borderRadius = Number(item.value) || 14;
    else if (item.key === "backgroundColor") config.backgroundColor = item.value;
    else if (item.key === "textColor") config.textColor = item.value;
    else if (item.key === "fontSize") config.fontSize = Number(item.value) || 16;
    else if (item.key === "pulseAnimation") config.pulseAnimation = item.value === "true";
    else if (item.key === "confettiEnabled") config.confettiEnabled = item.value === "true";
    else if (item.key === "confettiDuration") config.confettiDuration = Number(item.value) || 5;
  });

  // Dynamically sync real Twitch stats if preset is active
  if (config.goalType === "followers_twitch" || config.goalType === "subs_twitch") {
    const realStats = await getRealTwitchStats(safeUserId);
    if (realStats) {
      if (config.goalType === "followers_twitch") {
        config.currentAmount = realStats.followers;
      } else if (config.goalType === "subs_twitch") {
        config.currentAmount = realStats.subs;
      }
    }
  }

  return config;
}

export async function saveGoalConfig(newConfig: Partial<GoalConfig>, userId?: string | null) {
  const safeUserId = userId ?? null;
  for (const [key, value] of Object.entries(newConfig)) {
    const existing = await prisma.platformConfig.findFirst({
      where: { platform: "goal", key, userId: safeUserId },
    });
    if (existing) {
      await prisma.platformConfig.update({
        where: { id: existing.id },
        data: { value: String(value) },
      });
    } else {
      await prisma.platformConfig.create({
        data: { platform: "goal", key, value: String(value), userId: safeUserId },
      });
    }
  }
}
