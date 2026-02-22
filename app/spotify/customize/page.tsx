"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Slider,
  Flex,
  Separator,
  Grid,
  GridItem,
  Select,
  createListCollection,
  Switch,
  Spinner,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import Link from "next/link";
import { toaster, Toaster } from "@/components/ui/toaster";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpotifyVisualConfig {
  sp_brandColor: string;
  sp_accentColor: string;
  sp_borderRadius: string;
  sp_bgOpacity: string;
  sp_blurStrength: string;
  sp_showControls: string;
  sp_showProgressBar: string;
  sp_font: string;
  sp_widgetWidth: string;
  sp_position: string;
  sp_trackFontSize: string;
  sp_albumSize: string;
}

const DEFAULT_CONFIG: SpotifyVisualConfig = {
  sp_brandColor: "#ff512f",
  sp_accentColor: "#dd2476",
  sp_borderRadius: "32",
  sp_bgOpacity: "0.1",
  sp_blurStrength: "25",
  sp_showControls: "true",
  sp_showProgressBar: "true",
  sp_font: "Outfit",
  sp_widgetWidth: "520",
  sp_position: "center",
  sp_trackFontSize: "2",
  sp_albumSize: "140",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FONTS = [
  "Outfit",
  "Inter",
  "Roboto",
  "Oswald",
  "Nunito",
  "Rajdhani",
  "Monospace",
];
const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const fontCollection = createListCollection({
  items: FONTS.map((f) => ({ label: f, value: f })),
});

// ─── Inline Spotify Preview ───────────────────────────────────────────────────

const FAKE_TRACK = {
  name: "Midnight City",
  artist: "M83",
  albumUrl:
    "https://upload.wikimedia.org/wikipedia/en/1/14/M83hurryupwerebreakingnow.jpg",
  progress: 65, // %
};

function SpotifyPreview({ config }: { config: SpotifyVisualConfig }) {
  const brandColor = config.sp_brandColor;
  const accentColor = config.sp_accentColor;
  const borderRadius = `${config.sp_borderRadius}px`;
  const albumSize = parseInt(config.sp_albumSize);
  const fontSize = parseFloat(config.sp_trackFontSize);
  const bgOpacity = parseFloat(config.sp_bgOpacity);
  const blurStrength = parseInt(config.sp_blurStrength);
  const widgetWidth = Math.min(parseInt(config.sp_widgetWidth), 700);
  const showProgressBar = config.sp_showProgressBar !== "false";
  const showControls = config.sp_showControls !== "false";

  const posMap: Record<string, { justify: string; align: string }> = {
    "top-left": { justify: "flex-start", align: "flex-start" },
    "top-center": { justify: "flex-start", align: "center" },
    "top-right": { justify: "flex-start", align: "flex-end" },
    "center-left": { justify: "center", align: "flex-start" },
    center: { justify: "center", align: "center" },
    "center-right": { justify: "center", align: "flex-end" },
    "bottom-left": { justify: "flex-end", align: "flex-start" },
    "bottom-center": { justify: "flex-end", align: "center" },
    "bottom-right": { justify: "flex-end", align: "flex-end" },
  };
  const { justify, align } = posMap[config.sp_position] ?? posMap["center"];

  return (
    <Box
      position="relative"
      w="full"
      h="full"
      bg="repeating-linear-gradient(45deg, #111 0px, #111 10px, #1a1a1a 10px, #1a1a1a 20px)"
      borderRadius="xl"
      overflow="hidden"
    >
      <Text
        position="absolute"
        top={2}
        left={3}
        fontSize="10px"
        color="whiteAlpha.400"
        zIndex={2}
        letterSpacing="wide"
        fontFamily="mono"
      >
        OBS PREVIEW
      </Text>

      <Flex
        position="absolute"
        inset={0}
        p={4}
        direction="column"
        justify={justify}
        align={align}
      >
        <Box
          w={`${widgetWidth}px`}
          maxW="full"
          p="24px"
          borderRadius={borderRadius}
          position="relative"
          overflow="hidden"
          style={{
            background: `rgba(255, 255, 255, ${bgOpacity})`,
            backdropFilter: `blur(${blurStrength}px)`,
            WebkitBackdropFilter: `blur(${blurStrength}px)`,
            border: "1px solid rgba(255,255,255,0.2)",
            fontFamily: `${config.sp_font}, sans-serif`,
          }}
          display="flex"
          gap="24px"
          alignItems="center"
          color="white"
        >
          {/* Gradient radial glow */}
          <Box
            position="absolute"
            top="-50%"
            left="-50%"
            w="100%"
            h="100%"
            pointerEvents="none"
            zIndex={0}
            style={{
              background: `radial-gradient(circle, ${brandColor} 0%, transparent 70%)`,
              opacity: 0.4,
              transform: "rotate(45deg)",
            }}
          />

          {/* Album Art */}
          <Box
            flexShrink={0}
            borderRadius={`calc(${borderRadius} - 8px)`}
            overflow="hidden"
            zIndex={1}
            style={{
              width: albumSize,
              height: albumSize,
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FAKE_TRACK.albumUrl}
              alt="Album"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>

          {/* Track Info */}
          <Box
            flex={1}
            zIndex={1}
            display="flex"
            flexDirection="column"
            gap="12px"
            minWidth={0}
          >
            <Box>
              <Box
                style={{
                  fontSize: `${fontSize}rem`,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {FAKE_TRACK.name}
              </Box>
              <Box
                style={{
                  fontSize: `${fontSize * 0.6}rem`,
                  color: "rgba(255,255,255,0.7)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {FAKE_TRACK.artist}
              </Box>
            </Box>

            {showProgressBar && (
              <Box display="flex" alignItems="center" gap="12px" mt="8px">
                <Box
                  style={{
                    fontSize: "1rem",
                    color: "rgba(255,255,255,0.7)",
                    minWidth: 36,
                  }}
                >
                  2:07
                </Box>
                <Box
                  flex={1}
                  h="8px"
                  bg="rgba(255,255,255,0.1)"
                  borderRadius="4px"
                  overflow="hidden"
                >
                  <Box
                    h="100%"
                    borderRadius="4px"
                    style={{
                      width: `${FAKE_TRACK.progress}%`,
                      background: `linear-gradient(90deg, ${brandColor}, ${accentColor})`,
                      boxShadow: `0 0 15px ${brandColor}`,
                    }}
                  />
                </Box>
                <Box
                  style={{
                    fontSize: "1rem",
                    color: "rgba(255,255,255,0.7)",
                    minWidth: 36,
                  }}
                >
                  3:24
                </Box>
              </Box>
            )}

            {showControls && (
              <Box
                display="flex"
                alignItems="center"
                gap="24px"
                mt="4px"
                fontSize="1.8rem"
              >
                <span>⏮</span>
                <span
                  style={{
                    background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: "2.2rem",
                    filter: `drop-shadow(0 0 5px ${accentColor}4d)`,
                    fontWeight: "bold",
                  }}
                >
                  ⏸
                </span>
                <span>⏭</span>
              </Box>
            )}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SpotifyCustomizePage() {
  const [config, setConfig] = useState<SpotifyVisualConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    const configRes = await fetch("/api/spotify/config");
    const legacy = await configRes.json();
    setConfig((prev) => ({
      ...prev,
      sp_brandColor: legacy.brandColor ?? prev.sp_brandColor,
      sp_accentColor: legacy.accentColor ?? prev.sp_accentColor,
      sp_borderRadius:
        legacy.borderRadius?.replace("px", "") ?? prev.sp_borderRadius,
      ...(data["spotify-visual"] ?? {}),
    }));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "spotify-visual", settings: config }),
      });
      toaster.create({ title: "Sauvegardé !", type: "success" });
    } catch {
      toaster.create({ title: "Erreur lors de la sauvegarde", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof SpotifyVisualConfig, value: string) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <Flex minH="60vh" justify="center" align="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Toaster />
      <Container maxW="7xl" py={8}>
        {/* Header */}
        <HStack mb={6} justify="space-between" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <FiArrowLeft /> Retour
              </Link>
            </Button>
            <Heading size="xl">🎵 Spotify Widget — Personnalisation</Heading>
          </HStack>
          <HStack gap={2}>
            <Button
              size="sm"
              colorPalette="green"
              loading={saving}
              onClick={save}
            >
              <FiSave /> Sauvegarder
            </Button>
          </HStack>
        </HStack>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* LEFT — Live Preview */}
          <GridItem>
            <Box position="sticky" top="24px">
              <HStack mb={4} justify="space-between">
                <Heading size="md">👁 Aperçu en temps réel</Heading>
              </HStack>
              <Box
                w="full"
                h={{ base: "400px", lg: "calc(100vh - 200px)" }}
                maxH="800px"
                borderRadius="xl"
                overflow="hidden"
                boxShadow="2xl"
                border="1px solid"
                borderColor="whiteAlpha.100"
                bg="black"
              >
                <SpotifyPreview config={config} />
              </Box>
            </Box>
          </GridItem>

          {/* RIGHT — Editor */}
          <GridItem>
            <VStack align="stretch" gap={6}>
              {/* ── Position ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={3}>
                  📍 Position sur l&apos;écran
                </Heading>
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(3, 1fr)"
                  gap={1}
                  maxW="220px"
                >
                  {POSITIONS.map((pos) => (
                    <Button
                      key={pos}
                      size="xs"
                      variant={config.sp_position === pos ? "solid" : "outline"}
                      colorPalette={
                        config.sp_position === pos ? "green" : "gray"
                      }
                      onClick={() => update("sp_position", pos)}
                      title={pos}
                      h="36px"
                    >
                      {pos === "top-left"
                        ? "↖"
                        : pos === "top-center"
                          ? "↑"
                          : pos === "top-right"
                            ? "↗"
                            : pos === "center-left"
                              ? "←"
                              : pos === "center"
                                ? "⊙"
                                : pos === "center-right"
                                  ? "→"
                                  : pos === "bottom-left"
                                    ? "↙"
                                    : pos === "bottom-center"
                                      ? "↓"
                                      : "↘"}
                    </Button>
                  ))}
                </Box>
                <Text fontSize="xs" color="gray.400" mt={2}>
                  Position actuelle : {config.sp_position}
                </Text>
              </Box>

              {/* ── Couleurs ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={4}>
                  🎨 Couleurs & fond
                </Heading>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Couleur principale
                    </Text>
                    <HStack gap={2}>
                      <input
                        type="color"
                        value={config.sp_brandColor}
                        onChange={(e) =>
                          update("sp_brandColor", e.target.value)
                        }
                        style={{
                          width: 44,
                          height: 36,
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                        }}
                      />
                      <Input
                        value={config.sp_brandColor}
                        onChange={(e) =>
                          update("sp_brandColor", e.target.value)
                        }
                        fontFamily="mono"
                        size="sm"
                        maxW="140px"
                      />
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Couleur secondaire
                    </Text>
                    <HStack gap={2}>
                      <input
                        type="color"
                        value={config.sp_accentColor}
                        onChange={(e) =>
                          update("sp_accentColor", e.target.value)
                        }
                        style={{
                          width: 44,
                          height: 36,
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                        }}
                      />
                      <Input
                        value={config.sp_accentColor}
                        onChange={(e) =>
                          update("sp_accentColor", e.target.value)
                        }
                        fontFamily="mono"
                        size="sm"
                        maxW="140px"
                      />
                    </HStack>
                  </Box>
                  <Separator />
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Opacité du fond :{" "}
                      {parseFloat(config.sp_bgOpacity).toFixed(2)}
                    </Text>
                    <Slider.Root
                      min={0}
                      max={1}
                      step={0.01}
                      value={[parseFloat(config.sp_bgOpacity)]}
                      onValueChange={(e) =>
                        update("sp_bgOpacity", String(e.value[0]))
                      }
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumb index={0} />
                      </Slider.Control>
                    </Slider.Root>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Intensité Flou : {config.sp_blurStrength}px
                    </Text>
                    <Slider.Root
                      min={0}
                      max={60}
                      step={1}
                      value={[parseInt(config.sp_blurStrength)]}
                      onValueChange={(e) =>
                        update("sp_blurStrength", String(e.value[0]))
                      }
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumb index={0} />
                      </Slider.Control>
                    </Slider.Root>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Rayon des bords : {config.sp_borderRadius}px
                    </Text>
                    <Slider.Root
                      min={0}
                      max={64}
                      step={1}
                      value={[parseInt(config.sp_borderRadius)]}
                      onValueChange={(e) =>
                        update("sp_borderRadius", String(e.value[0]))
                      }
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumb index={0} />
                      </Slider.Control>
                    </Slider.Root>
                  </Box>
                </VStack>
              </Box>

              {/* ── Taille & Police ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={4}>
                  📐 Taille & typographie
                </Heading>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Largeur du widget : {config.sp_widgetWidth}px
                    </Text>
                    <Slider.Root
                      min={280}
                      max={800}
                      step={10}
                      value={[parseInt(config.sp_widgetWidth)]}
                      onValueChange={(e) =>
                        update("sp_widgetWidth", String(e.value[0]))
                      }
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumb index={0} />
                      </Slider.Control>
                    </Slider.Root>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Taille pochette : {config.sp_albumSize}px
                    </Text>
                    <Slider.Root
                      min={80}
                      max={260}
                      step={5}
                      value={[parseInt(config.sp_albumSize)]}
                      onValueChange={(e) =>
                        update("sp_albumSize", String(e.value[0]))
                      }
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumb index={0} />
                      </Slider.Control>
                    </Slider.Root>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Taille du titre :{" "}
                      {parseFloat(config.sp_trackFontSize).toFixed(1)}rem
                    </Text>
                    <Slider.Root
                      min={1}
                      max={4}
                      step={0.1}
                      value={[parseFloat(config.sp_trackFontSize)]}
                      onValueChange={(e) =>
                        update("sp_trackFontSize", String(e.value[0]))
                      }
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumb index={0} />
                      </Slider.Control>
                    </Slider.Root>
                  </Box>
                  <Field label="Police">
                    <Select.Root
                      collection={fontCollection}
                      value={[config.sp_font]}
                      onValueChange={(e) => update("sp_font", e.value[0])}
                      size="sm"
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText />
                        </Select.Trigger>
                      </Select.Control>
                      <Select.Positioner>
                        <Select.Content>
                          {fontCollection.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Field>
                </VStack>
              </Box>

              {/* ── Options ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={4}>
                  ⚙️ Éléments affichés
                </Heading>
                <VStack align="stretch" gap={4}>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontSize="sm">Barre de progression</Text>
                      <Text fontSize="xs" color="gray.400">
                        Temps écoulé / durée
                      </Text>
                    </Box>
                    <Switch.Root
                      checked={config.sp_showProgressBar === "true"}
                      onCheckedChange={(e) =>
                        update("sp_showProgressBar", String(e.checked))
                      }
                      colorPalette="green"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontSize="sm">Contrôles de lecture</Text>
                      <Text fontSize="xs" color="gray.400">
                        ⏮ ⏸ ⏭
                      </Text>
                    </Box>
                    <Switch.Root
                      checked={config.sp_showControls === "true"}
                      onCheckedChange={(e) =>
                        update("sp_showControls", String(e.checked))
                      }
                      colorPalette="green"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}
