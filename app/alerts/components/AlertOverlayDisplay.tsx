"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Text, Image } from "@chakra-ui/react";

export interface AlertEvent {
  id: string;
  type: string;
  platform?: string;
  text: string;
  soundUrl?: string | null;
  imageUrl?: string | null;
  bgMediaUrl?: string | null;
  bgMediaType?: string | null;
  duration: number;
  volume: number;
  bgColor: string;
  bgOverlayOpacity?: number;
  textColor: string;
  fontSize: number;
  glowColor?: string | null;
  glowSize?: number;
  borderColor?: string | null;
  borderWidth?: number;
  animation: string;
  exitAnimation?: string;
  position?: string;
}

interface AlertOverlayDisplayProps {
  alert: AlertEvent;
  onDone: () => void;
}

function getPositionStyles(position: string): {
  justifyContent: string;
  alignItems: string;
} {
  const [v = "center", h = "center"] = position.split("-");
  const vertMap: Record<string, string> = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
  };
  const horizMap: Record<string, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };
  return {
    alignItems: vertMap[v] ?? "center",
    justifyContent: horizMap[h] ?? "center",
  };
}

function getEnterTransform(animation: string): string {
  return (
    {
      "slide-in": "translateY(-80px)",
      bounce: "scale(0.3)",
      fade: "scale(1)",
      zoom: "scale(0)",
    }[animation] ?? "translateY(-80px)"
  );
}

function getExitTransform(exitAnimation: string): string {
  return (
    {
      fade: "scale(1)",
      "slide-out": "translateY(80px)",
      "zoom-out": "scale(0)",
      "bounce-out": "scale(1.4)",
    }[exitAnimation] ?? "scale(1)"
  );
}

export function AlertOverlayDisplay({
  alert,
  onDone,
}: AlertOverlayDisplayProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    if (alert.soundUrl && audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, alert.volume));
      audioRef.current.play().catch(() => {});
    }

    const exitTimer = setTimeout(
      () => {
        setLeaving(true);
        setTimeout(onDone, 700);
      },
      alert.duration * 1000 - 700,
    );

    return () => clearTimeout(exitTimer);
  }, [alert, onDone]);

  const overlayOpacity = alert.bgOverlayOpacity ?? 0.5;
  const glowStyle =
    alert.glowSize && alert.glowSize > 0
      ? `0 0 ${alert.glowSize}px ${alert.glowColor ?? "#6441a5"}, 0 2px 8px rgba(0,0,0,0.5)`
      : "0 2px 8px rgba(0,0,0,0.5)";

  const boxBorderStyle =
    alert.borderWidth && alert.borderWidth > 0
      ? {
          border: `${alert.borderWidth}px solid ${alert.borderColor ?? "#ffffff"}`,
        }
      : {};

  const currentTransform = leaving
    ? getExitTransform(alert.exitAnimation ?? "fade")
    : getEnterTransform(alert.animation);

  const currentOpacity = visible && !leaving ? 1 : 0;
  const currentScale = visible && !leaving ? "scale(1)" : currentTransform;

  const boxStyle: React.CSSProperties = {
    transform:
      visible && !leaving ? "translateY(0) scale(1)" : currentTransform,
    opacity: currentOpacity,
    transition: leaving
      ? "transform 0.5s ease-in, opacity 0.4s ease-in"
      : "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease-out",
  };
  void currentScale;

  const { justifyContent, alignItems } = getPositionStyles(
    alert.position ?? "center",
  );

  const bgFadeStyle: React.CSSProperties = {
    opacity: visible && !leaving ? 1 : 0,
    transition: "opacity 0.5s ease",
  };

  return (
    <Box position="fixed" inset={0} zIndex={9999} pointerEvents="none">
      {/* Full-screen background media */}
      {alert.bgMediaUrl &&
        (alert.bgMediaType === "image" || alert.bgMediaType === "gif") && (
          <Box position="absolute" inset={0} style={bgFadeStyle}>
            <Image
              src={alert.bgMediaUrl}
              alt="bg"
              w="100%"
              h="100%"
              objectFit="cover"
            />
          </Box>
        )}
      {alert.bgMediaUrl && alert.bgMediaType === "video" && (
        <Box position="absolute" inset={0} style={bgFadeStyle}>
          <video
            src={alert.bgMediaUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            autoPlay
            muted
            loop
          />
        </Box>
      )}

      {/* Dark overlay scrim over background */}
      {alert.bgMediaUrl && (
        <Box
          position="absolute"
          inset={0}
          bg="black"
          style={{
            ...bgFadeStyle,
            opacity: visible && !leaving ? overlayOpacity : 0,
          }}
        />
      )}

      {/* Alert box — positioned */}
      <Box
        position="absolute"
        inset={0}
        display="flex"
        p={8}
        style={{ alignItems, justifyContent }}
      >
        <Box
          style={boxStyle}
          display="flex"
          flexDir="column"
          alignItems="center"
          gap={3}
        >
          <Box
            bg={
              alert.bgMediaUrl
                ? `rgba(0,0,0,${overlayOpacity + 0.1})`
                : alert.bgColor
            }
            backdropFilter={alert.bgMediaUrl ? "blur(10px)" : undefined}
            borderRadius="2xl"
            px={10}
            py={6}
            display="flex"
            flexDir="column"
            alignItems="center"
            gap={3}
            boxShadow="0 8px 40px rgba(0,0,0,0.5)"
            maxW="80vw"
            textAlign="center"
            style={boxBorderStyle}
          >
            {alert.imageUrl && (
              <Image
                src={alert.imageUrl}
                alt="alert"
                boxSize="80px"
                objectFit="contain"
                borderRadius="xl"
              />
            )}
            <Text
              color={alert.textColor}
              fontWeight="extrabold"
              style={{ fontSize: `${alert.fontSize}px`, textShadow: glowStyle }}
            >
              {alert.text}
            </Text>
          </Box>
        </Box>
      </Box>

      {alert.soundUrl && (
        <audio
          ref={audioRef}
          src={alert.soundUrl}
          style={{ display: "none" }}
        />
      )}
    </Box>
  );
}
