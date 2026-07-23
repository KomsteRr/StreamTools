import { EventEmitter } from "events";

export interface CombinedChatMessage {
  id: string;
  platform: "twitch" | "youtube";
  user: string;
  avatar?: string;
  message: string;
  color?: string;
  badges?: string[];
  /** Per-message emote map: word → proxied image URL (Twitch native emotes) */
  emotes?: Record<string, string>;
  timestamp: number;
}

class ChatEmitter extends EventEmitter {
  private readonly messagesByUser = new Map<string, CombinedChatMessage[]>();
  private readonly maxMessages = 100;

  private key(userId?: string | null) {
    return userId ?? "global";
  }

  public addMessage(
    userId: string | null | undefined,
    msg: Omit<CombinedChatMessage, "id" | "timestamp">,
  ) {
    const key = this.key(userId);
    const fullMsg: CombinedChatMessage = {
      ...msg,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    const messages = this.messagesByUser.get(key) ?? [];
    messages.push(fullMsg);
    if (messages.length > this.maxMessages) messages.shift();
    this.messagesByUser.set(key, messages);
    this.emit(`message:${key}`, fullMsg);
  }

  public getRecentMessages(userId?: string | null): CombinedChatMessage[] {
    return this.messagesByUser.get(this.key(userId)) ?? [];
  }

  public subscribe(userId: string | null | undefined, listener: (message: CombinedChatMessage) => void) {
    const event = `message:${this.key(userId)}`;
    this.on(event, listener);
    return () => this.off(event, listener);
  }
}

declare global {
  var _chatEmitter: ChatEmitter | undefined;
}

export const chatEmitter = globalThis._chatEmitter || new ChatEmitter();
if (process.env.NODE_ENV !== "production") {
  globalThis._chatEmitter = chatEmitter;
}
