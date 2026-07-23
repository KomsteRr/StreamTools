"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface DiscordMediaAlert {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaType: "image" | "gif" | "video" | "audio" | "text";
  mediaUrl?: string;
  timestamp: number;
}

interface DiscordConfig {
  alertDuration?: number;
  maxMediaHeight?: number;
  borderColor?: string;
}

export default function DiscordMediaOverlayPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [queue, setQueue] = useState<DiscordMediaAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<DiscordMediaAlert | null>(null);
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DiscordConfig>({
    alertDuration: 8,
    maxMediaHeight: 350,
    borderColor: "#5865F2",
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const url = token ? `/api/discord/config?token=${token}` : `/api/discord/config`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConfig({
          alertDuration: Number(data.alertDuration) || 8,
          maxMediaHeight: Number(data.maxMediaHeight) || 350,
          borderColor: data.borderColor || "#5865F2",
        });
      }
    };
    fetchConfig();
  }, [token]);

  useEffect(() => {
    const url = token ? `/api/discord/stream?token=${token}` : `/api/discord/stream`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener("media-alert", (event) => {
      try {
        const alert: DiscordMediaAlert = JSON.parse(event.data);
        setQueue((prev) => [...prev, alert]);
      } catch (err) {
        console.error("Error parsing discord media alert:", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [token]);

  useEffect(() => {
    if (!currentAlert && queue.length > 0) {
      const nextAlert = queue[0];
      setQueue((prev) => prev.slice(1));
      setCurrentAlert(nextAlert);

      // Animate in
      requestAnimationFrame(() => setVisible(true));

      const duration = (config.alertDuration || 8) * 1000;
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setCurrentAlert(null), 500);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [queue, currentAlert, config.alertDuration]);

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: "transparent",
      fontFamily: "Inter, sans-serif",
    }}>
      {currentAlert && (
        <div
          style={{
            background: "rgba(18, 18, 24, 0.85)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${config.borderColor || "#5865F2"}`,
            borderRadius: "24px",
            padding: "24px 32px",
            maxWidth: "600px",
            width: "90%",
            boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 30px ${config.borderColor || "#5865F2"}55`,
            color: "#ffffff",
            textAlign: "center",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1) translateY(0)" : "scale(0.8) translateY(50px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          {/* Header: Avatar + User */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "16px" }}>
            {currentAlert.authorAvatar ? (
              <img
                src={currentAlert.authorAvatar}
                alt={currentAlert.authorName}
                style={{ width: "50px", height: "50px", borderRadius: "50%", border: `2px solid ${config.borderColor || "#5865F2"}` }}
              />
            ) : (
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: config.borderColor || "#5865F2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "20px" }}>
                {currentAlert.authorName.charAt(0)}
              </div>
            )}
            <div style={{ textAlign: "left" }}>
              <span style={{ fontSize: "14px", color: config.borderColor || "#5865F2", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                Discord Stream Alert
              </span>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#ffffff" }}>
                {currentAlert.authorName}
              </h3>
            </div>
          </div>

          {/* Message Text */}
          {currentAlert.content && (
            <p style={{ fontSize: "16px", color: "#E0E0E0", marginBottom: "16px", lineHeight: "1.5" }}>
              {currentAlert.content}
            </p>
          )}

          {/* Media Display */}
          {currentAlert.mediaUrl && (
            <div style={{ marginTop: "12px", borderRadius: "16px", overflow: "hidden", maxHeight: `${config.maxMediaHeight || 350}px`, display: "flex", justifyContent: "center" }}>
              {currentAlert.mediaType === "video" ? (
                <video
                  src={currentAlert.mediaUrl}
                  autoPlay
                  playsInline
                  style={{ maxWidth: "100%", maxHeight: `${config.maxMediaHeight || 350}px`, borderRadius: "12px" }}
                  onEnded={() => {
                    setVisible(false);
                    setTimeout(() => setCurrentAlert(null), 500);
                  }}
                />
              ) : currentAlert.mediaType === "audio" ? (
                <audio
                  src={currentAlert.mediaUrl}
                  autoPlay
                  controls
                  style={{ width: "100%", marginTop: "8px" }}
                  onEnded={() => {
                    setVisible(false);
                    setTimeout(() => setCurrentAlert(null), 500);
                  }}
                />
              ) : (
                <img
                  src={currentAlert.mediaUrl}
                  alt="Discord Media"
                  style={{ maxWidth: "100%", maxHeight: `${config.maxMediaHeight || 350}px`, borderRadius: "12px", objectFit: "contain" }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
