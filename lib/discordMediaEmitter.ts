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
  private key(userId?: string | null) {
    return userId ?? "global";
  }

  public emitMediaAlert(
    userId: string | null | undefined,
    alert: Omit<DiscordMediaAlert, "id" | "timestamp">,
  ) {
    const fullAlert: DiscordMediaAlert = {
      ...alert,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    this.emit(`media-alert:${this.key(userId)}`, fullAlert);
  }

  public subscribe(
    userId: string | null | undefined,
    listener: (alert: DiscordMediaAlert) => void,
  ) {
    const event = `media-alert:${this.key(userId)}`;
    this.on(event, listener);
    return () => this.off(event, listener);
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
