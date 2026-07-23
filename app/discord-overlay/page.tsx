"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface DiscordMediaAlert {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaType: "image" | "gif" | "video" | "audio" | "youtube" | "text";
  mediaUrl?: string;
  timestamp: number;
}

interface DiscordConfig {
  alertDuration?: number;
}

export default function DiscordMediaOverlayPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [currentAlert, setCurrentAlert] = useState<DiscordMediaAlert | null>(null);
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DiscordConfig>({
    alertDuration: 8,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAlertRef = useRef<DiscordMediaAlert | null>(currentAlert);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    currentAlertRef.current = currentAlert;
  }, [currentAlert]);

  // Load config
  useEffect(() => {
    const fetchConfig = async () => {
      const url = token ? `/api/discord/config?token=${token}` : `/api/discord/config`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConfig({
          alertDuration: Number(data.alertDuration) || 8,
        });
      }
    };
    fetchConfig();
  }, [token]);

  // Helper to remove item from queue when played/finished
  const removeAlertFromQueue = useCallback((alertId: string) => {
    const url = token ? `/api/discord/queue?token=${token}&id=${alertId}` : `/api/discord/queue?id=${alertId}`;
    fetch(url, { method: "DELETE" }).catch(() => {});
  }, [token]);

  // Finish current alert and auto-clear from queue
  const handleFinishAlert = useCallback((alertId: string) => {
    setVisible(false);
    removeAlertFromQueue(alertId);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => {
      setCurrentAlert((prev) => (prev?.id === alertId ? null : prev));
    }, 200);
  }, [removeAlertFromQueue]);

  // Explicit Autoplay for Video and Audio when currentAlert updates or renders
  useEffect(() => {
    if (currentAlert?.mediaType === "video" && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((err) => console.log("Autoplay video error:", err));
    }
    if (currentAlert?.mediaType === "audio" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => console.log("Autoplay audio error:", err));
    }
  }, [currentAlert]);

  // Connect to SSE stream and handle incoming media alerts, deletes, and queue clears
  useEffect(() => {
    const url = token ? `/api/discord/stream?token=${token}` : `/api/discord/stream`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener("media-alert", (event) => {
      try {
        const alert: DiscordMediaAlert = JSON.parse(event.data);

        // Strip raw URLs from text content so text isn't printed as URL string
        let cleanText = alert.content || "";
        if (alert.mediaUrl || cleanText.match(/https?:\/\/[^\s]+/i)) {
          cleanText = cleanText
            .replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+(\&[^\s]*)?/gi, "")
            .replace(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+(\?[^\s]*)?/gi, "")
            .replace(/https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/[^\s]+/gi, "")
            .replace(/https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p)\/[a-zA-Z0-9_-]+(\?[^\s]*)?/gi, "")
            .replace(/https?:\/\/[^\s]*(tenor\.com|giphy\.com|cdn\.discordapp\.com|media\.discordapp\.net|ddinstagram\.com)[^\s]*/gi, "")
            .replace(/https?:\/\/[^\s]+\.(gif|png|jpg|jpeg|webp|mp4|webm|mov)(\?[^\s]*)?/gi, "")
            .replace(/https?:\/\/[^\s]+/gi, "")
            .trim();
        }

        setCurrentAlert({ ...alert, content: cleanText });
        setVisible(true);

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        // Only set timer for static media (images, gifs, text). Videos & Audio use onEnded event.
        const isStaticMedia = !alert.mediaUrl || alert.mediaType === "image" || alert.mediaType === "gif" || alert.mediaType === "text";
        if (isStaticMedia) {
          const duration = (configRef.current.alertDuration || 8) * 1000;
          timerRef.current = setTimeout(() => {
            handleFinishAlert(alert.id);
          }, duration);
        }
      } catch (err) {
        console.error("Error parsing discord media alert:", err);
      }
    });

    // INSTANT SKIP: Handle when an item currently playing is deleted from moderation queue
    eventSource.addEventListener("media-delete", (event) => {
      try {
        const { id } = JSON.parse(event.data);
        setCurrentAlert((prev) => {
          if (prev && prev.id === id) {
            setVisible(false);
            if (timerRef.current) clearTimeout(timerRef.current);
            setTimeout(() => setCurrentAlert(null), 150);
          }
          return prev;
        });
      } catch (err) {
        console.error("Error processing media-delete event:", err);
      }
    });

    // INSTANT CLEAR: Handle when queue is cleared
    eventSource.addEventListener("queue-update", (event) => {
      try {
        const updatedQueue: DiscordMediaAlert[] = JSON.parse(event.data);
        if (updatedQueue.length === 0) {
          setVisible(false);
          if (timerRef.current) clearTimeout(timerRef.current);
          setTimeout(() => setCurrentAlert(null), 150);
        }
      } catch {}
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      eventSource.close();
    };
  }, [token, handleFinishAlert]);

  // YouTube Iframe API postMessage listener for video ENDED (playerState === 0)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        const isEnded =
          data?.info?.playerState === 0 ||
          data?.playerState === 0 ||
          (data?.event === "onStateChange" && data?.info === 0) ||
          (data?.event === "infoDelivery" && data?.info?.playerState === 0);

        if (isEnded && currentAlertRef.current?.id) {
          handleFinishAlert(currentAlertRef.current.id);
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleFinishAlert]);

  // Adaptive Font Size calculation based on text length
  const getAdaptiveFontSize = (text: string) => {
    const len = text.length;
    if (len <= 25) return "34px";
    if (len <= 60) return "26px";
    if (len <= 120) return "22px";
    return "18px";
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "transparent",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {currentAlert && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        >
          {/* Full Screen Media Display */}
          {currentAlert.mediaUrl ? (
            <div
              style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {currentAlert.mediaType === "youtube" ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${currentAlert.mediaUrl}?autoplay=1&controls=0&mute=0&enablejsapi=1&playsinline=1&rel=0`}
                  title="YouTube video player"
                  style={{
                    width: "100vw",
                    height: "100vh",
                    border: "none",
                    pointerEvents: "none",
                  }}
                  allow="autoplay; encrypted-media; fullscreen"
                  onLoad={(e) => {
                    try {
                      e.currentTarget.contentWindow?.postMessage(
                        JSON.stringify({ event: "listening", id: 1 }),
                        "*"
                      );
                    } catch {}
                  }}
                />
              ) : currentAlert.mediaType === "video" ? (
                <video
                  ref={videoRef}
                  src={currentAlert.mediaUrl}
                  autoPlay
                  playsInline
                  controls={false}
                  style={{
                    maxWidth: "100vw",
                    maxHeight: "100vh",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                  }}
                  onCanPlay={(e) => {
                    const v = e.currentTarget;
                    v.play().catch((err) => console.log("Video autoplay onCanPlay error:", err));
                  }}
                  onLoadedData={(e) => {
                    const v = e.currentTarget;
                    v.play().catch(() => {});
                  }}
                  onEnded={() => handleFinishAlert(currentAlert.id)}
                />
              ) : currentAlert.mediaType === "audio" ? (
                <audio
                  ref={audioRef}
                  src={currentAlert.mediaUrl}
                  autoPlay
                  controls
                  style={{ width: "80%", maxWidth: "500px" }}
                  onCanPlay={(e) => {
                    const a = e.currentTarget;
                    a.play().catch((err) => console.log("Audio autoplay onCanPlay error:", err));
                  }}
                  onLoadedData={(e) => {
                    const a = e.currentTarget;
                    a.play().catch(() => {});
                  }}
                  onEnded={() => handleFinishAlert(currentAlert.id)}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentAlert.mediaUrl}
                  alt="Discord Media"
                  style={{
                    maxWidth: "100vw",
                    maxHeight: "100vh",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          ) : null}

          {/* Top-Center Message Banner with Adaptive Font Size */}
          {(currentAlert.content || currentAlert.authorName) && (
            <div
              style={{
                position: "absolute",
                top: "32px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                background: "rgba(10, 10, 15, 0.88)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "20px",
                padding: "12px 28px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.7)",
                color: "#ffffff",
                maxWidth: "90vw",
                pointerEvents: "none",
              }}
            >
              {/* Author Row */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: currentAlert.content ? "6px" : "0" }}>
                {currentAlert.authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentAlert.authorAvatar}
                    alt={currentAlert.authorName}
                    style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid #5865F2" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#5865F2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {currentAlert.authorName.charAt(0)}
                  </div>
                )}
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#5865F2", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                  {currentAlert.authorName}
                </span>
              </div>

              {/* Adaptive Text Row */}
              {currentAlert.content && (
                <div
                  style={{
                    fontSize: getAdaptiveFontSize(currentAlert.content),
                    fontWeight: "700",
                    color: "#FFFFFF",
                    lineHeight: "1.3",
                    textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                    wordBreak: "break-word",
                  }}
                >
                  {currentAlert.content}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
