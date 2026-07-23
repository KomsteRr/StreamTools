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
import { useTranslation } from '@/lib/i18n'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatVisualConfig {
  chat_bgColor: string;
  chat_bgBlur: string;
  chat_borderRadius: string;
  chat_borderColor: string;
  chat_borderWidth: string;
  chat_textColor: string;
  chat_fontSize: string;
  chat_maxMessages: string;
  chat_position: string;
  chat_font: string;
  chat_showBadges: string;
  chat_enterAnimation: string;
}

const DEFAULT_CONFIG: ChatVisualConfig = {
  chat_bgColor: "rgba(20,20,20,0.6)",
  chat_bgBlur: "10",
  chat_borderRadius: "12",
  chat_borderColor: "rgba(255,255,255,0.1)",
  chat_borderWidth: "1",
  chat_textColor: "#e0e0e0",
  chat_fontSize: "14",
  chat_maxMessages: "10",
  chat_position: "bottom-left",
  chat_font: "Inter",
  chat_showBadges: "true",
  chat_enterAnimation: "slideIn",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FONTS = [
  "Inter",
  "Roboto",
  "Oswald",
  "Nunito",
  "Rajdhani",
  "Bebas Neue",
  "Monospace",
];
const ANIMATIONS = [
  { label: "Slide In", value: "slideIn" },
  { label: "Fade In", value: "fadeIn" },
  { label: "Zoom In", value: "zoomIn" },
  { label: "Bounce In", value: "bounceIn" },
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

function getAnimCollection(t: any) {
  return createListCollection({
    items: [
      { label: t("twitchChat.animSlideIn"), value: "slideIn" },
      { label: t("twitchChat.animFadeIn"), value: "fadeIn" },
      { label: t("twitchChat.animZoomIn"), value: "zoomIn" },
      { label: t("twitchChat.animBounceIn"), value: "bounceIn" },
    ],
  });
}

function TwitchBadgeIcon({ type, badgeMap }: { type: string; badgeMap?: Record<string, string> }) {
  const norm = type.toLowerCase().trim();
  const setId = norm.split("/")[0];

  const imageUrl = badgeMap?.[norm] || badgeMap?.[type] || badgeMap?.[setId];
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={type}
        title={type}
        width="18"
        height="18"
        style={{ borderRadius: 3, verticalAlign: "middle", display: "inline-block" }}
      />
    );
  }

  switch (setId) {
    case "broadcaster":
    case "streamer":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Streamer</title>
          <rect width="18" height="18" rx="3" fill="#E91E63"/>
          <path d="M4.5 5.5H10.5C11.05 5.5 11.5 5.95 11.5 6.5V11.5C11.5 12.05 11.05 12.5 10.5 12.5H4.5C3.95 12.5 3.5 12.05 3.5 11.5V6.5C3.5 5.95 3.95 5.5 4.5 5.5Z" fill="white"/>
          <path d="M11.5 8.5L14.5 6.5V11.5L11.5 9.5V8.5Z" fill="white"/>
        </svg>
      );
    case "moderator":
    case "mod":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Modérateur</title>
          <rect width="18" height="18" rx="3" fill="#00AD03"/>
          <path d="M12.5 3.5L14.5 5.5L9.5 10.5L10.5 11.5L9.5 12.5L8.5 11.5L7.5 12.5L5.5 10.5L6.5 9.5L5.5 8.5L6.5 7.5L7.5 8.5L12.5 3.5Z" fill="white"/>
          <path d="M4 14L6 12L5 11L3 13L4 14Z" fill="white"/>
        </svg>
      );
    case "vip":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>VIP</title>
          <rect width="18" height="18" rx="3" fill="#E040FB"/>
          <path d="M9 4.5L13.5 8.5L9 13.5L4.5 8.5L9 4.5Z" fill="white"/>
        </svg>
      );
    case "subscriber":
    case "sub":
    case "founder":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Abonné</title>
          <rect width="18" height="18" rx="3" fill="#9146FF"/>
          <path d="M9 4L10.5 7L14 7.5L11.5 10L12 13.5L9 12L6 13.5L6.5 10L4 7.5L7.5 7L9 4Z" fill="white"/>
        </svg>
      );
    case "prime":
    case "premium":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Prime</title>
          <rect width="18" height="18" rx="3" fill="#00A3DA"/>
          <path d="M4.5 12.5V11L6.5 7.5L9 9.5L11.5 7.5L13.5 11V12.5H4.5Z" fill="white"/>
        </svg>
      );
    case "partner":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Partenaire</title>
          <rect width="18" height="18" rx="3" fill="#9146FF"/>
          <path d="M7.5 11.5L4.5 8.5L5.5 7.5L7.5 9.5L12.5 4.5L13.5 5.5L7.5 11.5Z" fill="white"/>
        </svg>
      );
    case "turbo":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Turbo</title>
          <rect width="18" height="18" rx="3" fill="#FF5722"/>
          <path d="M10 3L4.5 10H9.5L8 15L13.5 8H8.5L10 3Z" fill="white"/>
        </svg>
      );
    case "bits":
    case "bits-leader":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>Bits</title>
          <rect width="18" height="18" rx="3" fill="#F57C00"/>
          <path d="M9 3L14 9L9 15L4 9L9 3Z" fill="white"/>
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ borderRadius: 3, verticalAlign: "middle" }}>
          <title>{type}</title>
          <rect width="18" height="18" rx="3" fill="#757575"/>
          <text x="9" y="12" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">{setId.substring(0, 2).toUpperCase()}</text>
        </svg>
      );
  }
}

// ─── Fake messages ────────────────────────────────────────────────────────────

function getFakeMessages(t: any) {
  return [
    {
      id: "1",
      username: "StreamFan42",
      color: "#a970ff",
      message: t("twitchChat.previewMsg1"),
      badges: ["subscriber"],
    },
    {
      id: "2",
      username: "Komsterr",
      color: "#ff6b6b",
      message: t("twitchChat.previewMsg2"),
      badges: ["broadcaster"],
    },
    {
      id: "3",
      username: "ChatterPro",
      color: "#4ecdc4",
      message: t("twitchChat.previewMsg3"),
      badges: ["moderator"],
    },
    {
      id: "4",
      username: "VipCoolGuy",
      color: "#ffd93d",
      message: "PogChamp PogChamp PogChamp",
      badges: ["vip"],
    },
    {
      id: "5",
      username: "NewViewer99",
      color: "#c9e4ca",
      message: t("twitchChat.previewMsg4"),
      badges: [],
    },
  ];
}

// ─── Inline Chat Preview ──────────────────────────────────────────────────────

function ChatPreview({ config, t }: { config: ChatVisualConfig; t: any }) {
  const [badgeMap, setBadgeMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchBadges() {
      try {
        const res = await fetch("/api/twitch/badges");
        if (res.ok) {
          setBadgeMap(await res.json());
        }
      } catch (e) {}
    }
    fetchBadges();
  }, []);

  const cssVars = {
    "--chat-bgColor": config.chat_bgColor,
    "--chat-bgBlur": `${config.chat_bgBlur}px`,
    "--chat-borderRadius": `${config.chat_borderRadius}px`,
    "--chat-borderColor": config.chat_borderColor,
    "--chat-borderWidth": `${config.chat_borderWidth}px`,
    "--chat-textColor": config.chat_textColor,
    "--chat-fontSize": `${config.chat_fontSize}px`,
    "--chat-font": config.chat_font,
  } as React.CSSProperties;

  const showBadges = String(config.chat_showBadges ?? "true") === "true";

  return (
    <Box
      position="relative"
      w="full"
      h="full"
      bg="repeating-linear-gradient(45deg, #111 0px, #111 10px, #1a1a1a 10px, #1a1a1a 20px)"
      borderRadius="xl"
      overflow="hidden"
      style={cssVars}
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
        p={5}
        direction="column"
        justify={
          config.chat_position.startsWith("top")
            ? "flex-start"
            : config.chat_position.startsWith("bottom")
              ? "flex-end"
              : "center"
        }
        align={
          config.chat_position.endsWith("left")
            ? "flex-start"
            : config.chat_position.endsWith("right")
              ? "flex-end"
              : "center"
        }
        gap={2}
      >
        {getFakeMessages(t).map((msg) => (
          <Box
            key={msg.id}
            maxW="85%"
            px={4}
            py={"10px"}
            style={{
              background: "var(--chat-bgColor)",
              backdropFilter: `blur(var(--chat-bgBlur))`,
              WebkitBackdropFilter: `blur(var(--chat-bgBlur))`,
              border: `var(--chat-borderWidth) solid var(--chat-borderColor)`,
              borderRadius: "var(--chat-borderRadius)",
              fontSize: "var(--chat-fontSize)",
              fontFamily: "var(--chat-font), sans-serif",
              color: "var(--chat-textColor)",
            }}
          >
            {showBadges && msg.badges && msg.badges.length > 0 && (
              <span style={{ display: "inline-flex", gap: 4, marginRight: 6, verticalAlign: "middle" }}>
                {msg.badges.map((b) => (
                  <TwitchBadgeIcon key={b} type={b} badgeMap={badgeMap} />
                ))}
              </span>
            )}
            <span style={{ fontWeight: 700, color: msg.color }}>
              {msg.username}
            </span>
            <span style={{ color: "rgba(255,255,255,0.5)", marginRight: 4 }}>
              :
            </span>
            <span>{msg.message}</span>
          </Box>
        ))}
      </Flex>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TwitchChatCustomizePage() {
  const { t } = useTranslation()
  const [config, setConfig] = useState<ChatVisualConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overlayToken, setOverlayToken] = useState("");

  const fetchConfig = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    if (data["twitch-chat"]) {
      setConfig((prev) => ({ ...prev, ...data["twitch-chat"] }));
    }
    if (data.system?.overlayToken) {
      setOverlayToken(data.system.overlayToken);
    }
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
        body: JSON.stringify({ platform: "twitch-chat", settings: config }),
      });
      toaster.create({ title: t('common.saved'), type: "success" });
    } catch {
      toaster.create({ title: t('common.saveError'), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof ChatVisualConfig, value: string) =>
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
                <FiArrowLeft /> {t("alerts.backBtn")}
              </Link>
            </Button>
            <Heading size="xl">{t("twitchChat.title")}</Heading>
          </HStack>
          <HStack gap={2}>
            <Button
              size="sm"
              colorPalette="green"
              loading={saving}
              onClick={save}
            >
              <FiSave /> {t("spotify.saveBtn")}
            </Button>
          </HStack>
        </HStack>

        {/* OBS URL Link Card */}
        <Box mb={6} p={5} bg="white" _dark={{ bg: "gray.800" }} borderRadius="xl" shadow="sm" border="1px solid rgba(145, 70, 255, 0.3)">
          <VStack align="stretch" gap={2}>
            <Heading size="sm" color="purple.500">🔗 URL Source Navigateur OBS (Chat Twitch)</Heading>
            <Text fontSize="xs" color="gray.400">
              Copiez ce lien et collez-le dans OBS Studio (Taille recommandée: 400 × 600px).
            </Text>
            <HStack gap={2}>
              <Input
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/twitch-chat-overlay${overlayToken ? `?token=${overlayToken}` : ""}`}
                readOnly
                size="sm"
                bg="gray.100"
                _dark={{ bg: "gray.700" }}
                fontFamily="mono"
              />
              <Button
                size="sm"
                colorPalette="purple"
                onClick={() => {
                  const url = `${window.location.origin}/twitch-chat-overlay${overlayToken ? `?token=${overlayToken}` : ""}`;
                  navigator.clipboard.writeText(url);
                  toaster.create({ title: "Lien OBS copié !", type: "success" });
                }}
              >
                Copier
              </Button>
            </HStack>
          </VStack>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* LEFT — Live Preview */}
          <GridItem>
            <Box position="sticky" top="24px">
              <HStack mb={4} justify="space-between">
                <Heading size="md">{t("spotify.previewTitle")}</Heading>
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
                <ChatPreview config={config} t={t} />
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
                  {t("spotify.positionTitle")}
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
                      variant={
                        config.chat_position === pos ? "solid" : "outline"
                      }
                      colorPalette={
                        config.chat_position === pos ? "purple" : "gray"
                      }
                      onClick={() => update("chat_position", pos)}
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
                  {t("spotify.currentPosition")} {config.chat_position}
                </Text>
              </Box>

              {/* ── Typographie ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={3}>
                  {t("twitchChat.typographyTitle")}
                </Heading>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      {t("twitchChat.textColor")}
                    </Text>
                    <HStack gap={2}>
                      <input
                        type="color"
                        value={config.chat_textColor}
                        onChange={(e) =>
                          update("chat_textColor", e.target.value)
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
                        value={config.chat_textColor}
                        onChange={(e) =>
                          update("chat_textColor", e.target.value)
                        }
                        fontFamily="mono"
                        size="sm"
                        maxW="120px"
                      />
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      {t("twitchChat.fontSize")} {config.chat_fontSize}px
                    </Text>
                    <Slider.Root
                      min={10}
                      max={36}
                      step={1}
                      value={[parseInt(config.chat_fontSize)]}
                      onValueChange={(e) =>
                        update("chat_fontSize", String(e.value[0]))
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
                  <Field label={t("twitchChat.fontTitle")}>
                    <Select.Root
                      collection={fontCollection}
                      value={[config.chat_font]}
                      onValueChange={(e) => update("chat_font", e.value[0])}
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

              {/* ── Couleurs & fond ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={3}>
                  {t("twitchChat.bgBorderTitle")}
                </Heading>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      {t("twitchChat.bgColor")}
                    </Text>
                    <HStack gap={2}>
                      <input
                        type="color"
                        value={
                          config.chat_bgColor.startsWith("rgba")
                            ? "#141414"
                            : config.chat_bgColor
                        }
                        onChange={(e) => update("chat_bgColor", e.target.value)}
                        style={{
                          width: 44,
                          height: 36,
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                        }}
                      />
                      <Input
                        value={config.chat_bgColor}
                        onChange={(e) => update("chat_bgColor", e.target.value)}
                        fontFamily="mono"
                        size="sm"
                      />
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      {t("twitchChat.blurStrength")} {config.chat_bgBlur}px
                    </Text>
                    <Slider.Root
                      min={0}
                      max={40}
                      step={1}
                      value={[parseInt(config.chat_bgBlur)]}
                      onValueChange={(e) =>
                        update("chat_bgBlur", String(e.value[0]))
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
                  <Separator />
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      {t("twitchChat.borderColor")}
                    </Text>
                    <HStack gap={2}>
                      <input
                        type="color"
                        value={
                          config.chat_borderColor.startsWith("rgba")
                            ? "#ffffff"
                            : config.chat_borderColor
                        }
                        onChange={(e) =>
                          update("chat_borderColor", e.target.value)
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
                        value={config.chat_borderColor}
                        onChange={(e) =>
                          update("chat_borderColor", e.target.value)
                        }
                        fontFamily="mono"
                        size="sm"
                      />
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      {t("twitchChat.borderWidth")} {config.chat_borderWidth}px
                    </Text>
                    <Slider.Root
                      min={0}
                      max={6}
                      step={1}
                      value={[parseInt(config.chat_borderWidth)]}
                      onValueChange={(e) =>
                        update("chat_borderWidth", String(e.value[0]))
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
                      {t("twitchChat.borderRadius")} {config.chat_borderRadius}px
                    </Text>
                    <Slider.Root
                      min={0}
                      max={32}
                      step={1}
                      value={[parseInt(config.chat_borderRadius)]}
                      onValueChange={(e) =>
                        update("chat_borderRadius", String(e.value[0]))
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

              {/* ── Comportement ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={3}>
                  {t("twitchChat.behaviorTitle")}
                </Heading>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      {t("twitchChat.maxMessages")} {config.chat_maxMessages}
                    </Text>
                    <Slider.Root
                      min={3}
                      max={30}
                      step={1}
                      value={[parseInt(config.chat_maxMessages)]}
                      onValueChange={(e) =>
                        update("chat_maxMessages", String(e.value[0]))
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
                  <Field label={t("twitchChat.enterAnimation")}>
                    <Select.Root
                      collection={getAnimCollection(t)}
                      value={[config.chat_enterAnimation]}
                      onValueChange={(e) =>
                        update("chat_enterAnimation", e.value[0])
                      }
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
                          {getAnimCollection(t).items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Field>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontSize="sm">{t('twitch.showBadges')}</Text>
                      <Text fontSize="xs" color="gray.400">
                        {t('twitchChat.twitchBadges')}
                      </Text>
                    </Box>
                    <Switch.Root
                      checked={config.chat_showBadges === "true"}
                      onCheckedChange={(e) =>
                        update("chat_showBadges", String(e.checked))
                      }
                      colorPalette="purple"
                    >
                      <Switch.HiddenInput />
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
