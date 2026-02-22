"use client";

import { useEffect, useState, useRef } from "react";
import tmi from "tmi.js";
import styles from "./twitch-chat.module.css";

interface BadgeVersion {
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
}

interface BadgeSet {
  versions: Record<string, BadgeVersion>;
}

interface ChatMessage {
  id: string;
  username: string;
  color: string;
  message: string;
  badges: { url: string; name: string }[];
}

interface TwitchConfig {
  channelName: string;
  botName: string;
  twitchClientId?: string;
  twitchAccessToken?: string;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [config, setConfig] = useState<TwitchConfig | null>(null);
  const [visual, setVisual] = useState<ChatVisualConfig>(DEFAULT_VISUAL);
  const badgesRef = useRef<{
    global: Record<string, BadgeSet>;
    channel: Record<string, BadgeSet>;
  }>({ global: {}, channel: {} });
  const clientRef = useRef<tmi.Client | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Fetch connection config AND visual config in parallel
  useEffect(() => {
    async function fetchAll() {
      try {
        const token = new URLSearchParams(window.location.search).get("token");
        const tokenQuery = token ? `?token=${token}` : "";

        const [configRes, settingsRes] = await Promise.all([
          fetch(`/api/twitch/config${tokenQuery}`),
          fetch(`/api/settings/public${tokenQuery}`),
        ]);
        const configData = await configRes.json();
        const settings = await settingsRes.json();
        setConfig(configData);
        // Merge platform settings for "twitch-chat" into visual config
        if (settings["twitch-chat"]) {
          setVisual((prev) => ({ ...prev, ...settings["twitch-chat"] }));
        }
      } catch (error) {
        console.error("Failed to load config", error);
      }
    }
    fetchAll();
  }, []);

  // Helper to build badge maps
  const parseHelixBadges = (data: any) => {
    const map: Record<string, BadgeSet> = {};
    if (data && Array.isArray(data)) {
      data.forEach((set) => {
        map[set.set_id] = { versions: {} };
        set.versions.forEach((v: any) => {
          map[set.set_id].versions[v.id] = {
            image_url_1x: v.image_url_1x,
            image_url_2x: v.image_url_2x,
            image_url_4x: v.image_url_4x,
          };
        });
      });
    }
    return map;
  };

  // Connect TMI & Fetch Badges
  useEffect(() => {
    if (!config?.channelName) return;

    if (config.twitchClientId && config.twitchAccessToken) {
      fetch("https://api.twitch.tv/helix/chat/badges/global", {
        headers: {
          "Client-Id": config.twitchClientId,
          Authorization: `Bearer ${config.twitchAccessToken}`,
        },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.data) badgesRef.current.global = parseHelixBadges(json.data);
        })
        .catch((e) => console.error("Global badges error", e));
    }

    const client = new tmi.Client({
      channels: [config.channelName],
      connection: { secure: true, reconnect: true },
    });
    clientRef.current = client;
    client.connect().catch(console.error);

    let channelBadgesFetched = false;

    client.on("message", (channel, tags, message, self) => {
      if (tags.id && processedMessageIds.current.has(tags.id)) return;
      if (tags.id) processedMessageIds.current.add(tags.id);
      if (processedMessageIds.current.size > 1000) {
        const it = processedMessageIds.current.values();
        for (let i = 0; i < 500; i++)
          processedMessageIds.current.delete(it.next().value as string);
      }

      if (
        !channelBadgesFetched &&
        tags["room-id"] &&
        config.twitchClientId &&
        config.twitchAccessToken
      ) {
        channelBadgesFetched = true;
        fetch(
          `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${tags["room-id"]}`,
          {
            headers: {
              "Client-Id": config.twitchClientId,
              Authorization: `Bearer ${config.twitchAccessToken}`,
            },
          },
        )
          .then((res) => res.json())
          .then((json) => {
            if (json.data)
              badgesRef.current.channel = parseHelixBadges(json.data);
          })
          .catch((e) => console.error("Channel badges error", e));
      }

      const showBadges = visual.chat_showBadges !== "false";
      const msgBadges: { url: string; name: string }[] = [];
      if (showBadges && tags.badges) {
        Object.keys(tags.badges).forEach((key) => {
          const version = tags.badges![key];
          let url: string | null = null;
          if (badgesRef.current.channel[key]?.versions[String(version)]) {
            url =
              badgesRef.current.channel[key].versions[String(version)]
                .image_url_1x;
          } else if (badgesRef.current.global[key]?.versions[String(version)]) {
            url =
              badgesRef.current.global[key].versions[String(version)]
                .image_url_1x;
          }
          if (url) msgBadges.push({ url, name: key });
        });
      }

      const newMessage: ChatMessage = {
        id: tags.id || Math.random().toString(),
        username: tags["display-name"] || tags.username || "Anonymous",
        color: tags.color || "#a970ff",
        message,
        badges: msgBadges,
      };

      const maxMessages = parseInt(visual.chat_maxMessages || "10", 10);
      setMessages((prev) => {
        const next = [...prev, newMessage];
        if (next.length > maxMessages) next.shift();
        return next;
      });
    });

    return () => {
      client.disconnect().catch(console.error);
    };
  }, [config, visual]);

  if (!config) return null;

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

  return (
    <div
      id="chat-container"
      className={styles.chatContainer}
      data-position={visual.chat_position || "bottom-left"}
      style={cssVars}
    >
      {messages.map((msg) => (
        <div key={msg.id} className={styles.chatMessage}>
          <div className={styles.usernameContainer}>
            {msg.badges.length > 0 && (
              <div className={styles.badges}>
                {msg.badges.map((b, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={b.url}
                    alt={b.name}
                    className={styles.badge}
                  />
                ))}
              </div>
            )}
            <span className={styles.username} style={{ color: msg.color }}>
              {msg.username}
            </span>
            <span
              style={{ marginRight: "4px", color: "rgba(255,255,255,0.7)" }}
            >
              :{" "}
            </span>
            <span className={styles.messageText}>{msg.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
