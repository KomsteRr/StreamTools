"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CombinedChatMessage } from "@/lib/chatEmitter";
import { CombinedChatConfig } from "@/lib/combined-chat-config";

const PLATFORM_COLORS: Record<string, string> = {
  twitch: "#9146FF",
  youtube: "#FF0000",
  discord: "#5865F2",
};

const PLATFORM_LABELS: Record<string, string> = {
  twitch: "TW",
  youtube: "YT",
  discord: "DC",
};

export default function CombinedChatOverlayPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [messages, setMessages] = useState<CombinedChatMessage[]>([]);
  const [config, setConfig] = useState<CombinedChatConfig>({
    fontSize: 14,
    maxMessages: 30,
    showAvatars: true,
    showBadges: true,
    backgroundColor: "rgba(15, 15, 20, 0.8)",
    textColor: "#ffffff",
    chatWidth: 450,
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const url = token ? `/api/chat/config?token=${token}` : `/api/chat/config`;
      const res = await fetch(url);
      if (res.ok) {
        setConfig(await res.json());
      }
    };
    fetchConfig();
  }, [token]);

  useEffect(() => {
    const url = token ? `/api/chat/stream?token=${token}` : `/api/chat/stream`;
    const es = new EventSource(url);

    es.addEventListener("init", (event) => {
      try {
        const msgs: CombinedChatMessage[] = JSON.parse(event.data);
        setMessages(msgs.slice(-(config.maxMessages || 30)));
      } catch {}
    });

    es.addEventListener("message", (event) => {
      try {
        const msg: CombinedChatMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev.slice(-(config.maxMessages - 1 || 29)), msg]);
      } catch {}
    });

    return () => es.close();
  }, [token, config.maxMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: "20px",
      boxSizing: "border-box",
      background: "transparent",
      fontFamily: "Inter, sans-serif",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: `${config.chatWidth || 450}px`,
        maxHeight: "80vh",
        overflowY: "auto",
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              background: config.backgroundColor || "rgba(15, 15, 20, 0.8)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              padding: "10px 14px",
              color: config.textColor || "#fff",
              boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {config.showAvatars && (
              <div style={{ flexShrink: 0, marginTop: "2px" }}>
                {msg.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.avatar} alt={msg.user} style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
                ) : (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: PLATFORM_COLORS[msg.platform] || "#666",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: "#fff",
                  }}>
                    {PLATFORM_LABELS[msg.platform] || "?"}
                  </span>
                )}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontWeight: 700, fontSize: `${config.fontSize || 14}px`, color: msg.color || PLATFORM_COLORS[msg.platform] || "#fff" }}>
                  {msg.user}
                </span>
                {config.showBadges && (
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                    background: PLATFORM_COLORS[msg.platform] || "#666",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    color: "#fff",
                    textTransform: "uppercase",
                  }}>
                    {msg.platform}
                  </span>
                )}
              </div>
              <div style={{ fontSize: `${config.fontSize || 14}px`, color: config.textColor || "#E0E0E0" }}>
                {msg.message}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
