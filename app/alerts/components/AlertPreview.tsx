"use client";

import { Box, Text, Image } from "@chakra-ui/react";

export interface AlertConfig {
  type: string;
  platform?: string;
  enabled: boolean;
  soundUrl?: string | null;
  imageUrl?: string | null;
  bgMediaUrl?: string | null;
  bgMediaType?: string | null;
  text: string;
  duration: number;
  volume: number;
  bgColor: string;
  bgOverlayOpacity: number;
  textColor: string;
  fontSize: number;
  glowColor?: string | null;
  glowSize?: number;
  borderColor?: string | null;
  borderWidth?: number;
  animation: string;
  exitAnimation?: string;
  position: string;
}

interface AlertPreviewProps {
  config: AlertConfig;
  previewUser?: string;
  previewAmount?: string;
}

/** Maps position string to CSS justify/align values */
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

export function AlertPreview({
  config,
  previewUser = "TestUser",
  previewAmount = "100",
}: AlertPreviewProps) {
  const previewText = config.text
    .replace(/\{user\}/g, previewUser)
    .replace(/\{amount\}/g, previewAmount);

  const { justifyContent, alignItems } = getPositionStyles(
    config.position ?? "center",
  );

  const glowStyle =
    config.glowSize && config.glowSize > 0
      ? `0 0 ${config.glowSize}px ${config.glowColor ?? "#6441a5"}`
      : undefined;

  const boxBorder =
    config.borderWidth && config.borderWidth > 0
      ? {
          border: `${config.borderWidth}px solid ${config.borderColor ?? "#ffffff"}`,
        }
      : {};

  const overlayOpacity = config.bgOverlayOpacity ?? 0.4;

  return (
    <Box w="full" h="full" position="absolute" inset={0} overflow="hidden">
      {/* Full-screen background */}
      {config.bgMediaUrl &&
        (config.bgMediaType === "image" || config.bgMediaType === "gif") && (
          <Image
            src={config.bgMediaUrl}
            alt="background"
            position="absolute"
            inset={0}
            w="100%"
            h="100%"
            objectFit="cover"
          />
        )}
      {config.bgMediaUrl && config.bgMediaType === "video" && (
        <video
          src={config.bgMediaUrl}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          autoPlay
          muted
          loop
        />
      )}

      {/* Dark overlay for readability when using bg media */}
      {config.bgMediaUrl && (
        <Box
          position="absolute"
          inset={0}
          bg="black"
          opacity={overlayOpacity}
        />
      )}

      {/* Fallback solid bg tint (when no media) */}
      {!config.bgMediaUrl && (
        <Box position="absolute" inset={0} bg={config.bgColor} opacity={0.15} />
      )}

      {/* Alert box — positioned according to config.position */}
      <Box
        position="absolute"
        inset={0}
        display="flex"
        style={{ alignItems, justifyContent }}
        p={3}
      >
        <Box
          bg={
            config.bgMediaUrl
              ? `rgba(0,0,0,${overlayOpacity + 0.2})`
              : config.bgColor
          }
          backdropFilter={config.bgMediaUrl ? "blur(4px)" : undefined}
          borderRadius="xl"
          px={6}
          py={4}
          display="flex"
          flexDir="column"
          alignItems="center"
          gap={2}
          boxShadow="2xl"
          maxW="80%"
          textAlign="center"
          style={boxBorder}
        >
          {config.imageUrl && (
            <Image
              src={config.imageUrl}
              alt="alert icon"
              boxSize="48px"
              objectFit="contain"
              borderRadius="md"
            />
          )}
          <Text
            color={config.textColor}
            fontWeight="bold"
            style={{
              fontSize: `${Math.round((config.fontSize ?? 28) * 0.4)}px`,
              textShadow: glowStyle,
            }}
          >
            {previewText}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
