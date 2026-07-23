import { prisma } from "./prisma";
import { EventEmitter } from "events";

export interface WheelSegment {
  id: string;
  label: string;
  color: string;
}

export interface WheelConfig {
  title: string;
  segments: WheelSegment[];
  soundEnabled: boolean;
  wheelSize: number;
  spinDuration: number;
  pointerColor: string;
  centerColor: string;
  winnerDisplayDuration: number;
  confettiOnWin: boolean;
}

const DEFAULT_WHEEL: WheelConfig = {
  title: "Roue des Defis Stream",
  segments: [
    { id: "1", label: "10 Pompes", color: "#FF5733" },
    { id: "2", label: "Imitation Bot", color: "#33FF57" },
    { id: "3", label: "Verre d'eau", color: "#3357FF" },
    { id: "4", label: "GG 50 Subs !", color: "#F333FF" },
    { id: "5", label: "Gagne 1 VIP", color: "#FFD700" },
    { id: "6", label: "Rejouer", color: "#00FFFF" },
  ],
  soundEnabled: true,
  wheelSize: 500,
  spinDuration: 4.5,
  pointerColor: "#FFD700",
  centerColor: "#1a1a2e",
  winnerDisplayDuration: 8,
  confettiOnWin: true,
};

export async function getWheelConfig(userId?: string | null): Promise<WheelConfig> {
  const safeUserId = userId ?? null;
  const items = await prisma.platformConfig.findMany({
    where: { platform: "wheel", userId: safeUserId },
  });

  const config: WheelConfig = { ...DEFAULT_WHEEL };
  items.forEach((item) => {
    if (item.key === "title") config.title = item.value;
    else if (item.key === "soundEnabled") config.soundEnabled = item.value === "true";
    else if (item.key === "wheelSize") config.wheelSize = Number(item.value) || 500;
    else if (item.key === "spinDuration") config.spinDuration = Number(item.value) || 4.5;
    else if (item.key === "pointerColor") config.pointerColor = item.value;
    else if (item.key === "centerColor") config.centerColor = item.value;
    else if (item.key === "winnerDisplayDuration") config.winnerDisplayDuration = Number(item.value) || 8;
    else if (item.key === "confettiOnWin") config.confettiOnWin = item.value === "true";
    else if (item.key === "segments") {
      try {
        config.segments = JSON.parse(item.value);
      } catch {}
    }
  });

  return config;
}

export async function saveWheelConfig(newConfig: Partial<WheelConfig>, userId?: string | null) {
  const safeUserId = userId ?? null;
  for (const [key, value] of Object.entries(newConfig)) {
    const stringVal = typeof value === "object" ? JSON.stringify(value) : String(value);
    const existing = await prisma.platformConfig.findFirst({
      where: { platform: "wheel", key, userId: safeUserId },
    });
    if (existing) {
      await prisma.platformConfig.update({
        where: { id: existing.id },
        data: { value: stringVal },
      });
    } else {
      await prisma.platformConfig.create({
        data: { platform: "wheel", key, value: stringVal, userId: safeUserId },
      });
    }
  }
}

class WheelEmitter extends EventEmitter {
  public spin(winnerIndex: number) {
    this.emit("spin", { winnerIndex, timestamp: Date.now() });
  }
}

declare global {
  var _wheelEmitter: WheelEmitter | undefined;
}

export const wheelEmitter = globalThis._wheelEmitter || new WheelEmitter();
if (process.env.NODE_ENV !== "production") {
  globalThis._wheelEmitter = wheelEmitter;
}
