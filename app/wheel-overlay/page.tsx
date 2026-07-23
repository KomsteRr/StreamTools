"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";

interface WheelSegment {
  id: string;
  label: string;
  color: string;
}

interface WheelConfig {
  title: string;
  segments: WheelSegment[];
  soundEnabled: boolean;
  wheelSize: number;
  spinDuration: number;
  pointerColor: string;
  centerColor: string;
  winnerDisplayDuration: number;
  confettiOnWin: boolean;
}

export default function WheelOverlayPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [config, setConfig] = useState<WheelConfig | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<WheelSegment | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const url = token ? `/api/wheel/config?token=${token}` : `/api/wheel/config`;
      const res = await fetch(url);
      if (res.ok) {
        setConfig(await res.json());
      }
    };
    fetchConfig();
  }, [token]);

  const handleSpin = useCallback(
    (winnerIndex: number) => {
      if (!config || spinning) return;
      setSpinning(true);
      setWinner(null);

      const segCount = config.segments.length;
      const segAngle = 360 / segCount;
      const targetAngle = 360 - (winnerIndex * segAngle + segAngle / 2);
      const fullSpins = 5 * 360;
      const finalRotation = rotation + fullSpins + targetAngle;
      const spinDuration = config.spinDuration || 4.5;

      setRotation(finalRotation);

      setTimeout(() => {
        setWinner(config.segments[winnerIndex]);
        setSpinning(false);
        if (config.confettiOnWin) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }, spinDuration * 1000);

      setTimeout(() => {
        setWinner(null);
      }, (spinDuration + (config.winnerDisplayDuration || 8)) * 1000);
    },
    [config, spinning, rotation]
  );

  useEffect(() => {
    const url = token ? `/api/wheel/stream?token=${token}` : `/api/wheel/stream`;
    const es = new EventSource(url);

    es.addEventListener("spin", (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSpin(data.winnerIndex);
      } catch {}
    });

    return () => es.close();
  }, [token, handleSpin]);

  if (!config || config.segments.length < 2) return null;

  const size = config.wheelSize || 500;
  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;

  const segCount = config.segments.length;
  const segAngle = 360 / segCount;

  const polarToCartesian = (angle: number) => {
    const rad = (Math.PI / 180) * angle;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        fontFamily: "Inter, sans-serif",
        position: "relative",
      }}
    >
      {/* Pointer needle */}
      <div
        style={{
          position: "absolute",
          top: `calc(50% - ${size / 2 + 10}px)`,
          zIndex: 10,
          width: 0,
          height: 0,
          borderLeft: "16px solid transparent",
          borderRight: "16px solid transparent",
          borderTop: `35px solid ${config.pointerColor || "#FFD700"}`,
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.6))",
        }}
      />

      {/* Wheel SVG */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? `transform ${config.spinDuration || 4.5}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`
            : "none",
          filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))",
        }}
      >
        {config.segments.map((seg, i) => {
          const startAngle = i * segAngle - 90;
          const endAngle = (i + 1) * segAngle - 90;
          const start = polarToCartesian(startAngle);
          const end = polarToCartesian(endAngle);
          const largeArc = segAngle > 180 ? 1 : 0;

          const midAngle = startAngle + segAngle / 2;
          const labelR = radius * 0.65;
          const labelRad = (Math.PI / 180) * midAngle;
          const labelX = cx + labelR * Math.cos(labelRad);
          const labelY = cy + labelR * Math.sin(labelRad);

          return (
            <g key={seg.id || i}>
              <path
                d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                fill={seg.color}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
              />
              <text
                x={labelX}
                y={labelY}
                fill="#ffffff"
                fontSize={Math.max(10, Math.min(16, Math.floor(size / 32)))}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${midAngle}, ${labelX}, ${labelY})`}
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)", pointerEvents: "none" }}
              >
                {seg.label}
              </text>
            </g>
          );
        })}
        {/* Center circle */}
        <circle cx={cx} cy={cy} r={size * 0.06} fill={config.centerColor || "#1a1a2e"} stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        <circle cx={cx} cy={cy} r={size * 0.02} fill={config.pointerColor || "#FFD700"} />
      </svg>

      {/* Winner popup */}
      {winner && (
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            background: "rgba(18, 18, 24, 0.95)",
            backdropFilter: "blur(16px)",
            border: `2px solid ${config.pointerColor || "#FFD700"}`,
            borderRadius: "20px",
            padding: "20px 40px",
            textAlign: "center",
            boxShadow: `0 10px 40px ${config.pointerColor || "#FFD700"}55`,
            animation: "popIn 0.5s ease",
            color: "#ffffff",
          }}
        >
          <div style={{ fontSize: "14px", color: config.pointerColor || "#FFD700", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
            Gagnant !
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "4px" }}>
            {winner.label}
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.7) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
