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
  // Container image
  containerImageUrl?: string | null;
  containerWidth?: number;
  containerHeight?: number;
  // Container layout
  containerLayout?: string;
  textAlign?: string;
  imageSize?: number;
  // Font
  fontFamily?: string;
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

/** Inject a Google Font <link> once */
function loadGoogleFont(fontFamily: string) {
  const id = `gfont-${fontFamily.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700;800&display=swap`;
  document.head.appendChild(link);
}

export function AlertOverlayDisplay({
  alert,
  onDone,
}: AlertOverlayDisplayProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (alert.fontFamily) loadGoogleFont(alert.fontFamily);
  }, [alert.fontFamily]);

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
    alert.borderWidth && alert.borderWidth > 0 && !alert.containerImageUrl
      ? {
          border: `${alert.borderWidth}px solid ${alert.borderColor ?? "#ffffff"}`,
        }
      : {};

  const currentTransform = leaving
    ? getExitTransform(alert.exitAnimation ?? "fade")
    : getEnterTransform(alert.animation);

  const boxStyle: React.CSSProperties = {
    transform:
      visible && !leaving ? "translateY(0) scale(1)" : currentTransform,
    opacity: visible && !leaving ? 1 : 0,
    transition: leaving
      ? "transform 0.5s ease-in, opacity 0.4s ease-in"
      : "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease-out",
  };

  const { justifyContent, alignItems } = getPositionStyles(
    alert.position ?? "center",
  );

  const bgFadeStyle: React.CSSProperties = {
    opacity: visible && !leaving ? 1 : 0,
    transition: "opacity 0.5s ease",
  };

  const layout = alert.containerLayout ?? "column";
  const txtAlign = (alert.textAlign ?? "center") as "left" | "center" | "right";
  const imgSize = alert.imageSize ?? 80;
  const font = alert.fontFamily ?? "Inter";
  const hasContainerImage = !!alert.containerImageUrl;

  // Container sizing
  const cWidth = alert.containerWidth ?? 400;
  const cHeight = alert.containerHeight ?? 200;

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
            w={hasContainerImage ? `${cWidth}px` : undefined}
            h={hasContainerImage ? `${cHeight}px` : undefined}
            bg={
              hasContainerImage
                ? "transparent"
                : alert.bgMediaUrl
                  ? `rgba(0,0,0,${overlayOpacity + 0.1})`
                  : alert.bgColor
            }
            backgroundImage={
              hasContainerImage
                ? `url(${alert.containerImageUrl})`
                : undefined
            }
            backgroundSize={hasContainerImage ? "100% 100%" : undefined}
            backgroundRepeat={hasContainerImage ? "no-repeat" : undefined}
            backdropFilter={
              !hasContainerImage && alert.bgMediaUrl
                ? "blur(10px)"
                : undefined
            }
            borderRadius={hasContainerImage ? undefined : "2xl"}
            px={hasContainerImage ? 6 : 10}
            py={hasContainerImage ? 4 : 6}
            display="flex"
            flexDir={layout as any}
            alignItems="center"
            justifyContent="center"
            gap={3}
            boxShadow={hasContainerImage ? undefined : "0 8px 40px rgba(0,0,0,0.5)"}
            maxW={hasContainerImage ? undefined : "80vw"}
            textAlign={txtAlign}
            style={boxBorderStyle}
          >
            {alert.imageUrl && (
              <Image
                src={alert.imageUrl}
                alt="alert"
                boxSize={`${imgSize}px`}
                objectFit="contain"
                borderRadius="xl"
                flexShrink={0}
              />
            )}
            <Text
              color={alert.textColor}
              fontWeight="extrabold"
              fontFamily={`'${font}', sans-serif`}
              textAlign={txtAlign}
              w="100%"
              whiteSpace="pre-wrap"
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
