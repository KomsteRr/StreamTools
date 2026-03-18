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
const animCollection = createListCollection({ items: ANIMATIONS });

// ─── Fake messages ────────────────────────────────────────────────────────────

const FAKE_MESSAGES = [
  {
    id: "1",
    username: "StreamFan42",
    color: "#a970ff",
    message: "Giga stream ce soir 🔥",
    badges: [],
  },
  {
    id: "2",
    username: "Komsterr",
    color: "#ff6b6b",
    message: "Bienvenue tout le monde !",
    badges: [],
  },
  {
    id: "3",
    username: "ChatterPro",
    color: "#4ecdc4",
    message: "J'adore le contenu !",
    badges: [],
  },
  {
    id: "4",
    username: "VipCoolGuy",
    color: "#ffd93d",
    message: "PogChamp PogChamp PogChamp",
    badges: [],
  },
  {
    id: "5",
    username: "NewViewer99",
    color: "#c9e4ca",
    message: "Premier stream ici, la classe !",
    badges: [],
  },
];

// ─── Inline Chat Preview ──────────────────────────────────────────────────────

function ChatPreview({ config }: { config: ChatVisualConfig }) {
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
        {FAKE_MESSAGES.map((msg) => (
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

  const fetchConfig = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    if (data["twitch-chat"]) {
      setConfig((prev) => ({ ...prev, ...data["twitch-chat"] }));
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
                <FiArrowLeft /> Retour
              </Link>
            </Button>
            <Heading size="xl">🎨 Chat Twitch — Personnalisation</Heading>
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
                <ChatPreview config={config} />
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
                  Position actuelle : {config.chat_position}
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
                  ✏️ Typographie
                </Heading>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Couleur du texte
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
                      Taille : {config.chat_fontSize}px
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
                  <Field label="Police">
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
                  🎨 Fond & Bordure
                </Heading>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Couleur de fond
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
                      Intensité Flou : {config.chat_bgBlur}px
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
                      Couleur bordure
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
                      Épaisseur : {config.chat_borderWidth}px
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
                      Rayon coins : {config.chat_borderRadius}px
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
                  ⚙️ Comportement
                </Heading>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Nombre max de messages : {config.chat_maxMessages}
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
                  <Field label="Animation d'entrée">
                    <Select.Root
                      collection={animCollection}
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
                          {animCollection.items.map((item) => (
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
                      <Text fontSize="sm">Afficher les badges</Text>
                      <Text fontSize="xs" color="gray.400">
                        Badges Twitch
                      </Text>
                    </Box>
                    <Switch.Root
                      checked={config.chat_showBadges === "true"}
                      onCheckedChange={(e) =>
                        update("chat_showBadges", String(e.checked))
                      }
                      colorPalette="purple"
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
