import { EventEmitter } from "events";

export interface CombinedChatMessage {
  id: string;
  platform: "twitch" | "youtube" | "discord";
  user: string;
  avatar?: string;
  message: string;
  color?: string;
  badges?: string[];
  timestamp: number;
}

class ChatEmitter extends EventEmitter {
  private messages: CombinedChatMessage[] = [];
  private maxMessages = 100;

  constructor() {
    super();
    // Allow up to 100 simultaneous overlay connections without warning
    this.setMaxListeners(100);
  }

  public addMessage(msg: Omit<CombinedChatMessage, "id" | "timestamp">) {
    const fullMsg: CombinedChatMessage = {
      ...msg,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    this.messages.push(fullMsg);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
    this.emit("message", fullMsg);
  }

  public getRecentMessages(): CombinedChatMessage[] {
    return this.messages;
  }
}

declare global {
  var _chatEmitter: ChatEmitter | undefined;
}

export const chatEmitter = globalThis._chatEmitter || new ChatEmitter();
if (process.env.NODE_ENV !== "production") {
  globalThis._chatEmitter = chatEmitter;
}
