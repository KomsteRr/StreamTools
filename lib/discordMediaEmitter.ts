import { EventEmitter } from "events";

export interface DiscordMediaAlert {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaType: "image" | "gif" | "video" | "audio" | "youtube" | "text";
  mediaUrl?: string;
  timestamp: number;
}

class DiscordMediaEmitter extends EventEmitter {
  private queueMap = new Map<string, DiscordMediaAlert[]>();

  private key(userId?: string | null) {
    return userId ?? "global";
  }

  public getQueue(userId?: string | null): DiscordMediaAlert[] {
    return this.queueMap.get(this.key(userId)) || [];
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

    const k = this.key(userId);
    const currentQueue = this.queueMap.get(k) || [];
    const updatedQueue = [fullAlert, ...currentQueue].slice(0, 100); // Keep last 100 items
    this.queueMap.set(k, updatedQueue);

    this.emit(`media-alert:${k}`, fullAlert);
    this.emit(`queue-update:${k}`, updatedQueue);
  }

  public deleteAlert(userId: string | null | undefined, alertId: string): boolean {
    const k = this.key(userId);
    const currentQueue = this.queueMap.get(k) || [];
    const updatedQueue = currentQueue.filter((item) => item.id !== alertId);
    if (updatedQueue.length !== currentQueue.length) {
      this.queueMap.set(k, updatedQueue);
      this.emit(`queue-update:${k}`, updatedQueue);
      this.emit(`media-delete:${k}`, alertId);
      return true;
    }
    return false;
  }

  public clearQueue(userId?: string | null) {
    const k = this.key(userId);
    this.queueMap.set(k, []);
    this.emit(`queue-update:${k}`, []);
    this.emit(`queue-clear:${k}`);
  }

  public subscribe(
    userId: string | null | undefined,
    listener: (alert: DiscordMediaAlert) => void,
  ) {
    const event = `media-alert:${this.key(userId)}`;
    this.on(event, listener);
    return () => this.off(event, listener);
  }

  public subscribeQueue(
    userId: string | null | undefined,
    listener: (queue: DiscordMediaAlert[]) => void,
  ) {
    const event = `queue-update:${this.key(userId)}`;
    this.on(event, listener);
    return () => this.off(event, listener);
  }

  public subscribeDelete(
    userId: string | null | undefined,
    listener: (alertId: string) => void,
  ) {
    const event = `media-delete:${this.key(userId)}`;
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
