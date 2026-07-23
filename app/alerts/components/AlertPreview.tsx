"use client";

import { useEffect } from "react";
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

interface AlertPreviewProps {
  config: AlertConfig;
  previewUser?: string;
  previewAmount?: string;
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
  const font = config.fontFamily ?? "Inter";

  useEffect(() => {
    if (font) loadGoogleFont(font);
  }, [font]);

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
    config.borderWidth && config.borderWidth > 0 && !config.containerImageUrl
      ? {
          border: `${config.borderWidth}px solid ${config.borderColor ?? "#ffffff"}`,
        }
      : {};

  const overlayOpacity = config.bgOverlayOpacity ?? 0.4;
  const layout = config.containerLayout ?? "column";
  const txtAlign = (config.textAlign ?? "center") as "left" | "center" | "right";
  const imgSize = config.imageSize ?? 80;
  const hasContainerImage = !!config.containerImageUrl;

  // Scale container dimensions down for preview (~40% of real size)
  const scale = 0.4;
  const cWidth = (config.containerWidth ?? 400) * scale;
  const cHeight = (config.containerHeight ?? 200) * scale;

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
      {!config.bgMediaUrl && !hasContainerImage && (
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
          w={hasContainerImage ? `${cWidth}px` : undefined}
          h={hasContainerImage ? `${cHeight}px` : undefined}
          bg={
            hasContainerImage
              ? "transparent"
              : config.bgMediaUrl
                ? `rgba(0,0,0,${overlayOpacity + 0.2})`
                : config.bgColor
          }
          backgroundImage={
            hasContainerImage
              ? `url(${config.containerImageUrl})`
              : undefined
          }
          backgroundSize={hasContainerImage ? "100% 100%" : undefined}
          backgroundRepeat={hasContainerImage ? "no-repeat" : undefined}
          backdropFilter={
            !hasContainerImage && config.bgMediaUrl ? "blur(4px)" : undefined
          }
          borderRadius={hasContainerImage ? undefined : "xl"}
          px={hasContainerImage ? 3 : 6}
          py={hasContainerImage ? 2 : 4}
          display="flex"
          flexDir={layout as React.CSSProperties["flexDirection"]}
          alignItems="center"
          justifyContent="center"
          gap={2}
          boxShadow={hasContainerImage ? undefined : "2xl"}
          maxW={hasContainerImage ? undefined : "80%"}
          textAlign={txtAlign}
          style={boxBorder}
        >
          {config.imageUrl && (
            <Image
              src={config.imageUrl}
              alt="alert icon"
              boxSize={`${Math.round(imgSize * scale)}px`}
              objectFit="contain"
              borderRadius="md"
              flexShrink={0}
            />
          )}
          <Text
            color={config.textColor}
            fontWeight="bold"
            fontFamily={`'${font}', sans-serif`}
            textAlign={txtAlign}
            w="100%"
            whiteSpace="pre-wrap"
            style={{
              fontSize: `${Math.round((config.fontSize ?? 28) * scale)}px`,
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
