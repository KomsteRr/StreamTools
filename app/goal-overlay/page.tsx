"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { GoalConfig } from "@/lib/goal-config";

export default function GoalOverlayPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [config, setConfig] = useState<GoalConfig | null>(null);
  const confettiFired = useRef(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const url = token ? `/api/goal/config?token=${token}` : `/api/goal/config`;
        const res = await fetch(url);
        if (res.ok) {
          const data: GoalConfig = await res.json();
          setConfig(data);

          if (
            data.confettiEnabled &&
            data.currentAmount >= data.targetAmount &&
            data.targetAmount > 0 &&
            !confettiFired.current
          ) {
            confettiFired.current = true;
            const duration = (data.confettiDuration || 5) * 1000;
            const animationEnd = Date.now() + duration;

            // Launch confetti directly above the goal bar
            const frame = () => {
              confetti({
                particleCount: 8,
                angle: 90,
                spread: 100,
                origin: { x: 0.5, y: 0.42 },
                startVelocity: 35,
                ticks: 200,
              });

              if (Date.now() < animationEnd) {
                requestAnimationFrame(frame);
              }
            };
            frame();
          } else if (data.currentAmount < data.targetAmount) {
            confettiFired.current = false;
          }
        }
      } catch (e) {
        console.error("Error fetching goal config", e);
      }
    };

    fetchConfig();
    const interval = setInterval(fetchConfig, 5000);
    return () => clearInterval(interval);
  }, [token]);

  if (!config) return null;

  const percentage = Math.min(
    100,
    Math.round((config.currentAmount / Math.max(1, config.targetAmount)) * 100)
  );

  const unitDisplay = config.customUnit ? ` ${config.customUnit}` : "";

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "transparent",
      fontFamily: `${config.fontFamily || "Inter"}, sans-serif`,
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "650px",
        background: config.backgroundColor || "rgba(18, 18, 24, 0.85)",
        backdropFilter: "blur(12px)",
        borderRadius: `${config.borderRadius || 14}px`,
        padding: "20px 24px",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        color: config.textColor || "#ffffff",
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: `${config.fontSize || 16}px`, fontWeight: "800", letterSpacing: "0.5px" }}>
            {config.title}
          </span>
          <span style={{ fontSize: `${(config.fontSize || 16) - 1}px`, fontWeight: "700", opacity: 0.9 }}>
            {config.currentAmount}{unitDisplay} / {config.targetAmount}{unitDisplay} {config.showPercentage && `(${percentage}%)`}
          </span>
        </div>

        <div style={{
          width: "100%",
          height: `${config.barHeight || 28}px`,
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: `${config.borderRadius || 14}px`,
          overflow: "hidden",
          position: "relative",
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{
            width: `${percentage}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${config.barColor || "#9146FF"}, ${config.gradientColor || "#FF007A"})`,
            borderRadius: `${config.borderRadius || 14}px`,
            transition: "width 0.8s ease-in-out",
            boxShadow: config.pulseAnimation ? `0 0 15px ${config.gradientColor || "#FF007A"}` : "none",
          }} />
        </div>
      </div>
    </div>
  );
}
