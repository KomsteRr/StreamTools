"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./twitch-chat.module.css";

interface ChatMessage {
  id: string;
  username: string;
  color: string;
  message: string;
  avatar?: string;
  badges?: string[];
}

function TwitchBadgeIcon({ type, badgeMap }: { type: string; badgeMap?: Record<string, string> }) {
  const norm = type.toLowerCase().trim();
  const setId = norm.split("/")[0];

  const imageUrl = badgeMap?.[norm] || badgeMap?.[type] || badgeMap?.[setId];
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={type}
        title={type}
        width="18"
        height="18"
        style={{ borderRadius: 3, verticalAlign: "middle", display: "inline-block" }}
      />
    );
  }

  switch (setId) {
    case "broadcaster":
    case "streamer":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Streamer</title>
          <rect width="18" height="18" rx="3" fill="#E91E63"/>
          <path d="M4.5 5.5H10.5C11.05 5.5 11.5 5.95 11.5 6.5V11.5C11.5 12.05 11.05 12.5 10.5 12.5H4.5C3.95 12.5 3.5 12.05 3.5 11.5V6.5C3.5 5.95 3.95 5.5 4.5 5.5Z" fill="white"/>
          <path d="M11.5 8.5L14.5 6.5V11.5L11.5 9.5V8.5Z" fill="white"/>
        </svg>
      );
    case "moderator":
    case "mod":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Modérateur</title>
          <rect width="18" height="18" rx="3" fill="#00AD03"/>
          <path d="M12.5 3.5L14.5 5.5L9.5 10.5L10.5 11.5L9.5 12.5L8.5 11.5L7.5 12.5L5.5 10.5L6.5 9.5L5.5 8.5L6.5 7.5L7.5 8.5L12.5 3.5Z" fill="white"/>
          <path d="M4 14L6 12L5 11L3 13L4 14Z" fill="white"/>
        </svg>
      );
    case "vip":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>VIP</title>
          <rect width="18" height="18" rx="3" fill="#E040FB"/>
          <path d="M9 4.5L13.5 8.5L9 13.5L4.5 8.5L9 4.5Z" fill="white"/>
        </svg>
      );
    case "subscriber":
    case "sub":
    case "founder":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Abonné</title>
          <rect width="18" height="18" rx="3" fill="#9146FF"/>
          <path d="M9 4L10.5 7L14 7.5L11.5 10L12 13.5L9 12L6 13.5L6.5 10L4 7.5L7.5 7L9 4Z" fill="white"/>
        </svg>
      );
    case "prime":
    case "premium":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Prime</title>
          <rect width="18" height="18" rx="3" fill="#00A3DA"/>
          <path d="M4.5 12.5V11L6.5 7.5L9 9.5L11.5 7.5L13.5 11V12.5H4.5Z" fill="white"/>
        </svg>
      );
    case "partner":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Partenaire</title>
          <rect width="18" height="18" rx="3" fill="#9146FF"/>
          <path d="M7.5 11.5L4.5 8.5L5.5 7.5L7.5 9.5L12.5 4.5L13.5 5.5L7.5 11.5Z" fill="white"/>
        </svg>
      );
    case "turbo":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Turbo</title>
          <rect width="18" height="18" rx="3" fill="#FF5722"/>
          <path d="M10 3L4.5 10H9.5L8 15L13.5 8H8.5L10 3Z" fill="white"/>
        </svg>
      );
    case "bits":
    case "bits-leader":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Bits</title>
          <rect width="18" height="18" rx="3" fill="#F57C00"/>
          <path d="M9 3L14 9L9 15L4 9L9 3Z" fill="white"/>
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>{type}</title>
          <rect width="18" height="18" rx="3" fill="#757575"/>
          <text x="9" y="12" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">{setId.substring(0, 2).toUpperCase()}</text>
        </svg>
      );
  }
}

interface ChatVisualConfig {
  chat_bgColor?: string;
  chat_bgBlur?: string;
  chat_borderRadius?: string;
  chat_borderColor?: string;
  chat_borderWidth?: string;
  chat_textColor?: string;
  chat_fontSize?: string;
  chat_maxMessages?: string;
  chat_position?: string;
  chat_font?: string;
  chat_showBadges?: string;
  chat_enterAnimation?: string;
}

const DEFAULT_VISUAL: ChatVisualConfig = {
  chat_bgColor: "rgba(20,20,20,0.6)",
  chat_bgBlur: "10",
  chat_borderRadius: "12",
  chat_borderColor: "rgba(255,255,255,0.1)",
  chat_borderWidth: "1",
  chat_textColor: "#e0e0e0",
  chat_fontSize: "14",
  chat_maxMessages: "10",
  chat_position: "bottom-left",
  chat_font: "Inter",
  chat_showBadges: "true",
  chat_enterAnimation: "slideIn",
};

export default function TwitchChatOverlay() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visual, setVisual] = useState<ChatVisualConfig>(DEFAULT_VISUAL);
  const [status, setStatus] = useState<string>("Connexion au flux Twitch...");
  const [badgeMap, setBadgeMap] = useState<Record<string, string>>({});
  const visualRef = useRef(visual);
  visualRef.current = visual;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Twitch Badge images dictionary
  useEffect(() => {
    if (!mounted) return;
    async function fetchBadges() {
      try {
        const res = await fetch("/api/twitch/badges");
        if (res.ok) {
          setBadgeMap(await res.json());
        }
      } catch (e) {}
    }
    fetchBadges();
  }, [mounted]);

  // Load visual configuration
  useEffect(() => {
    if (!mounted) return;

    async function fetchVisual() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token");
        const tokenQuery = token ? `?token=${token}` : "";

        const res = await fetch(`/api/settings/public${tokenQuery}`);
        if (res.ok) {
          const settings = await res.json();
          if (settings["twitch-chat"]) {
            setVisual((prev) => ({ ...prev, ...settings["twitch-chat"] }));
          }
        }
      } catch (e) {
        console.error("Failed to load visual config", e);
      }
    }
    fetchVisual();
  }, [mounted]);

  // Connect to unified chat stream (/api/chat/stream)
  useEffect(() => {
    if (!mounted) return;

    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    const streamUrl = token ? `/api/chat/stream?token=${token}` : "/api/chat/stream";

    console.log("[Twitch Chat Overlay] Subscribing to SSE stream:", streamUrl);
    const es = new EventSource(streamUrl);

    es.addEventListener("open", () => {
      setStatus("Connecté au flux Twitch");
    });

    es.addEventListener("init", (event) => {
      try {
        const initialMsgs = JSON.parse(event.data);
        if (Array.isArray(initialMsgs)) {
          const maxMessages = parseInt(visualRef.current.chat_maxMessages || "10", 10) || 10;
          const twitchMsgs: ChatMessage[] = initialMsgs
            .filter((m: any) => m.platform === "twitch")
            .map((m: any) => ({
              id: m.id || Math.random().toString(),
              username: m.user || "Anonymous",
              color: m.color || "#9146FF",
              message: m.message || "",
              avatar: m.avatar,
              badges: m.badges || [],
            }))
            .slice(-maxMessages);
          setMessages(twitchMsgs);
        }
      } catch (e) {}
    });

    es.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg && msg.platform === "twitch") {
          const newMsg: ChatMessage = {
            id: msg.id || Math.random().toString(),
            username: msg.user || "Anonymous",
            color: msg.color || "#9146FF",
            message: msg.message || "",
            avatar: msg.avatar,
            badges: msg.badges || [],
          };

          const maxMessages = parseInt(visualRef.current.chat_maxMessages || "10", 10) || 10;
          setMessages((prev) => {
            const next = [...prev, newMsg];
            return next.slice(-maxMessages);
          });
        }
      } catch (e) {}
    });

    es.addEventListener("error", () => {
      setStatus("Reconnexion au flux...");
    });

    return () => {
      es.close();
    };
  }, [mounted]);

  if (!mounted) return null;

  // Build CSS variable object from visual config
  const cssVars = {
    "--chat-bgColor": visual.chat_bgColor,
    "--chat-bgBlur": `${visual.chat_bgBlur}px`,
    "--chat-borderRadius": `${visual.chat_borderRadius}px`,
    "--chat-borderColor": visual.chat_borderColor,
    "--chat-borderWidth": `${visual.chat_borderWidth}px`,
    "--chat-textColor": visual.chat_textColor,
    "--chat-fontSize": `${visual.chat_fontSize}px`,
    "--chat-font": visual.chat_font,
    "--chat-enterAnimation": visual.chat_enterAnimation,
  } as React.CSSProperties;

  const showBadges = String(visual.chat_showBadges ?? "true") === "true";

  return (
    <div
      id="chat-container"
      className={styles.chatContainer}
      data-position={visual.chat_position || "bottom-left"}
      style={cssVars}
    >
      {messages.length === 0 && (
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontStyle: "italic", padding: "4px 8px" }}>
          {status}
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className={styles.chatMessage}>
          <div className={styles.usernameContainer}>
            {showBadges && msg.badges && msg.badges.length > 0 && (
              <span style={{ display: "inline-flex", gap: "4px", marginRight: "6px", verticalAlign: "middle" }}>
                {msg.badges.map((b) => (
                  <TwitchBadgeIcon key={b} type={b} badgeMap={badgeMap} />
                ))}
              </span>
            )}
            <span className={styles.username} style={{ color: msg.color }}>
              {msg.username}
            </span>
            <span style={{ marginRight: "4px", color: "rgba(255,255,255,0.7)" }}>
              :{" "}
            </span>
            <span className={styles.messageText}>{msg.message}</span>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(0); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: translateY(30px); }
          60% { opacity: 1; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes none {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
