"use client";

import { useEffect, useState } from "react";
import styles from "./spotify.module.css";
import { FaStepBackward, FaPause, FaPlay, FaStepForward } from "react-icons/fa";

interface SpotifyState {
  is_playing: boolean;
  progress_ms: number;
  item: {
    name: string;
    duration_ms: number;
    album: {
      images: { url: string }[];
    };
    artists: { name: string }[];
  } | null;
}

interface SpotifyVisualConfig {
  sp_brandColor?: string;
  sp_accentColor?: string;
  sp_borderRadius?: string;
  sp_bgOpacity?: string;
  sp_blurStrength?: string;
  sp_showControls?: string;
  sp_showProgressBar?: string;
  sp_font?: string;
  sp_widgetWidth?: string;
  sp_position?: string;
  sp_trackFontSize?: string;
  sp_albumSize?: string;
  // Legacy fallbacks from old spotify config
  brandColor?: string;
  accentColor?: string;
  borderRadius?: string;
}

const DEFAULT_VISUAL: SpotifyVisualConfig = {
  sp_brandColor: "#ff512f",
  sp_accentColor: "#dd2476",
  sp_borderRadius: "32",
  sp_bgOpacity: "0.1",
  sp_blurStrength: "25",
  sp_showControls: "true",
  sp_showProgressBar: "true",
  sp_font: "Outfit",
  sp_widgetWidth: "600",
  sp_position: "center",
  sp_trackFontSize: "2",
  sp_albumSize: "160",
};

const POSITION_MAP: Record<
  string,
  { justifyContent: string; alignItems: string }
> = {
  "top-left": { justifyContent: "flex-start", alignItems: "flex-start" },
  "top-center": { justifyContent: "flex-start", alignItems: "center" },
  "top-right": { justifyContent: "flex-start", alignItems: "flex-end" },
  "center-left": { justifyContent: "center", alignItems: "flex-start" },
  center: { justifyContent: "center", alignItems: "center" },
  "center-right": { justifyContent: "center", alignItems: "flex-end" },
  "bottom-left": { justifyContent: "flex-end", alignItems: "flex-start" },
  "bottom-center": { justifyContent: "flex-end", alignItems: "center" },
  "bottom-right": { justifyContent: "flex-end", alignItems: "flex-end" },
};

export default function SpotifyStreamPage() {
  const [data, setData] = useState<SpotifyState | null>(null);
  const [visual, setVisual] = useState<SpotifyVisualConfig>(DEFAULT_VISUAL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVisual = async () => {
    try {
      const token = new URLSearchParams(window.location.search).get("token");
      const tokenQuery = token ? `?token=${token}` : "";

      const [settingsRes] = await Promise.all([
        fetch(`/api/settings/public${tokenQuery}`),
      ]);
      const settings = await settingsRes.json();

      setVisual({
        ...DEFAULT_VISUAL,
        ...(settings["spotify-visual"] ?? {}),
      });
    } catch (e) {
      console.error("Visual config fetch error", e);
    }
  };

  const fetchNowPlaying = async () => {
    try {
      const token = new URLSearchParams(window.location.search).get("token");
      const tokenQuery = token ? `?token=${token}` : "";
      const res = await fetch(`/api/spotify/now-playing${tokenQuery}`);
      if (res.status === 401) {
        setError("Not Authenticated");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisual();
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 1000);
    const visualInterval = setInterval(fetchVisual, 5000);
    return () => {
      clearInterval(interval);
      clearInterval(visualInterval);
    };
  }, []);

  const formatTime = (ms: number) => {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (error === "Not Authenticated") {
    return (
      <div className={styles.body}>
        <div style={{ color: "white", textAlign: "center" }}>
          <p>Not Authenticated</p>
          <a
            href="/spotify"
            style={{
              color: "var(--sp-brandColor, #ff512f)",
              textDecoration: "underline",
            }}
          >
            Go to Dashboard to Login
          </a>
        </div>
      </div>
    );
  }

  if (loading) return null;

  const isPlaying = data?.is_playing ?? false;
  const trackName = data?.item?.name ?? "Paused / Idle";
  const artistName =
    data?.item?.artists.map((a) => a.name).join(", ") ?? "Spotify";
  const albumArt = data?.item?.album.images[0]?.url ?? "/album_art.png";
  const progressMs = data?.progress_ms ?? 0;
  const durationMs = data?.item?.duration_ms ?? 0;
  const progressPercent = durationMs ? (progressMs / durationMs) * 100 : 0;

  const pos =
    POSITION_MAP[visual.sp_position ?? "center"] ?? POSITION_MAP["center"];

  const cssVars = {
    "--sp-brandColor": visual.sp_brandColor,
    "--sp-accentColor": visual.sp_accentColor,
    "--sp-borderRadius": `${visual.sp_borderRadius}px`,
    "--sp-bgOpacity": visual.sp_bgOpacity,
    "--sp-blurStrength": `${visual.sp_blurStrength}px`,
    "--sp-font": visual.sp_font,
    "--sp-widgetWidth": `${visual.sp_widgetWidth}px`,
    "--sp-trackFontSize": `${visual.sp_trackFontSize}rem`,
    "--sp-albumSize": `${visual.sp_albumSize}px`,
    "--sp-justifyContent": pos.justifyContent,
    "--sp-alignItems": pos.alignItems,
  } as React.CSSProperties;

  const showControls = visual.sp_showControls !== "false";
  const showProgressBar = visual.sp_showProgressBar !== "false";

  return (
    <div className={styles.body} style={cssVars}>
      <div className={styles.widgetContainer}>
        <div className={styles.glassCard}>
          <div className={styles.albumArt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={albumArt} alt="Album Art" />
          </div>

          <div className={styles.trackInfo}>
            <div className={styles.textContent}>
              <h2 className={styles.trackName}>{trackName}</h2>
              <p className={styles.artistName}>{artistName}</p>
            </div>

            {showProgressBar && (
              <div className={styles.progressContainer}>
                <span className={styles.currTime}>
                  {formatTime(progressMs)}
                </span>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className={styles.totalTime}>
                  {formatTime(durationMs)}
                </span>
              </div>
            )}

            {showControls && (
              <div className={styles.controls}>
                <FaStepBackward style={{ cursor: "pointer" }} />
                {isPlaying ? (
                  <FaPause
                    className={styles.playBtn}
                    style={{ cursor: "pointer" }}
                  />
                ) : (
                  <FaPlay
                    className={styles.playBtn}
                    style={{ cursor: "pointer" }}
                  />
                )}
                <FaStepForward style={{ cursor: "pointer" }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
