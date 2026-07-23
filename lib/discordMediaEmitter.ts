import { EventEmitter } from "events";

export interface DiscordMediaAlert {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaType: "image" | "gif" | "video" | "audio" | "text";
  mediaUrl?: string;
  timestamp: number;
}

class DiscordMediaEmitter extends EventEmitter {
  private alertsQueue: DiscordMediaAlert[] = [];

  public emitMediaAlert(alert: Omit<DiscordMediaAlert, "id" | "timestamp">) {
    const fullAlert: DiscordMediaAlert = {
      ...alert,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    this.alertsQueue.push(fullAlert);
    this.emit("media-alert", fullAlert);
  }

  public getQueue(): DiscordMediaAlert[] {
    return this.alertsQueue;
  }
}

declare global {
  var _discordMediaEmitter: DiscordMediaEmitter | undefined;
}

export const discordMediaEmitter =
  globalThis._discordMediaEmitter || new DiscordMediaEmitter();

if (process.env.NODE_ENV !== "production") {
  globalThis._discordMediaEmitter = discordMediaEmitter;
}

