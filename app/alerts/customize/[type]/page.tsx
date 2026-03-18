"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { use } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  Slider,
  Spinner,
  Flex,
  Separator,
  Grid,
  GridItem,
  RadioGroup,
  Select,
  createListCollection,
  Badge,
} from "@chakra-ui/react";
import {
  FiArrowLeft,
  FiSave,
  FiPlay,
  FiCopy,
  FiTwitch,
  FiYoutube,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
} from "react-icons/fi";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toaster, Toaster } from "@/components/ui/toaster";
import {
  AlertPreview,
  AlertConfig,
} from "@/app/alerts/components/AlertPreview";
import {
  AlertOverlayDisplay,
  AlertEvent,
} from "@/app/alerts/components/AlertOverlayDisplay";
import { FileUploader } from "@/app/alerts/components/FileUploader";
import { useTranslation } from '@/lib/i18n'

const ALERT_LABELS: Record<string, string> = {
  follow: "Follow",
  sub: "Abonnement",
  bits: "Bits",
  raid: "Raid",
  cheer: "Cheer",
  gift_sub: "Gift Sub",
};

const ANIMATIONS = ["slide-in", "bounce", "fade", "zoom"];
const EXIT_ANIMATIONS = ["fade", "slide-out", "zoom-out", "bounce-out"];

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

const PLATFORMS = [
  { id: "twitch", label: "Twitch", icon: <FiTwitch size={14} /> },
  { id: "youtube", label: "YouTube", icon: <FiYoutube size={14} /> },
  // { id: "kick", label: "Kick", icon: <span>🎮</span> },
];

const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Outfit",
  "Poppins",
  "Montserrat",
  "Oswald",
  "Raleway",
  "Lato",
  "Nunito",
  "Bangers",
  "Bebas Neue",
  "Fredoka One",
  "Permanent Marker",
  "Press Start 2P",
  "Righteous",
  "Russo One",
  "Bungee",
  "Orbitron",
];

const LAYOUT_OPTIONS = [
  { value: "column", label: "Image en haut", icon: "⬆" },
  { value: "column-reverse", label: "Image en bas", icon: "⬇" },
  { value: "row", label: t('alerts.imageLeft'), icon: "⬅" },
  { value: "row-reverse", label: t('alerts.imageRight'), icon: "➡" },
];

const platformCollection = createListCollection({
  items: PLATFORMS.map((p) => ({ label: p.label, value: p.id })),
});

const fontCollection = createListCollection({
  items: GOOGLE_FONTS.map((f) => ({ label: f, value: f })),
});

export default function CustomizePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { t } = useTranslation()
  const { type } = use(params);
  const searchParams = useSearchParams();
  const initialPlatform = searchParams.get("platform") ?? "twitch";

  const label = ALERT_LABELS[type] ?? type;

  const [platform, setPlatform] = useState(initialPlatform);
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [copyTarget, setCopyTarget] = useState("");
  const [animTestEvent, setAnimTestEvent] = useState<AlertEvent | null>(null);
  const animTestTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadConfig = useCallback(
    async (p: string) => {
      setLoading(true);
      try {
        const d = await fetch(`/api/alerts/config/${type}?platform=${p}`).then(
          (r) => r.json(),
        );
        setConfig(d);
      } finally {
        setLoading(false);
      }
    },
    [type],
  );

  useEffect(() => {
    loadConfig(platform);
  }, [platform, loadConfig]);

  const update = useCallback(
    <K extends keyof AlertConfig>(key: K, value: AlertConfig[K]) => {
      setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    [],
  );

  async function save() {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/alerts/config/${type}?platform=${platform}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        },
      );
      if (res.ok) toaster.create({ title: t('common.saved'), type: "success" });
      else
        toaster.create({
          title: t('common.saveError'),
          type: "error",
        });
    } finally {
      setSaving(false);
    }
  }

  async function testAlert() {
    setTesting(true);
    try {
      await fetch("/api/alerts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, platform }),
      });
      toaster.create({ title: t('alerts.testSent'), type: "success" });
    } finally {
      setTesting(false);
    }
  }

  function testAnimLocal() {
    if (!config) return;
    if (animTestTimerRef.current) {
      clearTimeout(animTestTimerRef.current);
    }
    const previewText = config.text
      .replace(/\{user\}/g, "TestUser")
      .replace(/\{amount\}/g, "100");
    const event: AlertEvent = {
      id: `anim-test-${Date.now()}`,
      type,
      text: previewText,
      duration: Math.min(config.duration, 4),
      volume: 0,
      bgColor: config.bgColor,
      bgOverlayOpacity: config.bgOverlayOpacity,
      textColor: config.textColor,
      fontSize: config.fontSize,
      animation: config.animation,
      exitAnimation: config.exitAnimation ?? "fade",
      position: config.position,
      glowColor: config.glowColor,
      glowSize: config.glowSize,
      borderColor: config.borderColor,
      borderWidth: config.borderWidth,
      imageUrl: config.imageUrl,
      containerImageUrl: config.containerImageUrl,
      containerWidth: config.containerWidth,
      containerHeight: config.containerHeight,
      containerLayout: config.containerLayout,
      textAlign: config.textAlign,
      imageSize: config.imageSize,
      fontFamily: config.fontFamily,
    };
    setAnimTestEvent(event);
  }

  async function copyFrom() {
    if (!copyTarget || copyTarget === platform) return;
    setCopying(true);
    try {
      const res = await fetch(`/api/alerts/config/${type}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromPlatform: copyTarget,
          toPlatform: platform,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        toaster.create({
          title: `Copié depuis ${PLATFORMS.find((p) => p.id === copyTarget)?.label} !`,
          type: "success",
        });
      } else {
        toaster.create({ title: t('common.copyError'), type: "error" });
      }
    } finally {
      setCopying(false);
    }
  }

  if (loading || !config) {
    return (
      <Flex minH="60vh" justify="center" align="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  const otherPlatforms = PLATFORMS.filter((p) => p.id !== platform);

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Toaster />
      <Container maxW="7xl" py={8}>
        {/* Header */}
        <HStack mb={6} justify="space-between" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/alerts?platform=${platform}`}>
                <FiArrowLeft /> Retour
              </Link>
            </Button>
            <Heading size="xl">🎨 {label} — Personnalisation</Heading>
            {/* Platform badge */}
            <Badge
              colorPalette={
                platform === "twitch"
                  ? "purple"
                  : platform === "youtube"
                    ? "red"
                    : "green"
              }
              variant="subtle"
              fontSize="xs"
            >
              {PLATFORMS.find((p) => p.id === platform)?.icon}{" "}
              {PLATFORMS.find((p) => p.id === platform)?.label}
            </Badge>
          </HStack>
          <HStack gap={2}>
            <Button
              size="sm"
              colorPalette="purple"
              variant="outline"
              loading={testing}
              onClick={testAlert}
            >
              <FiPlay /> Tester
            </Button>
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

        {/* Platform selector + copy-from */}
        <HStack
          mb={8}
          p={4}
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderRadius="xl"
          shadow="sm"
          flexWrap="wrap"
          gap={4}
        >
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="gray.600"
            _dark={{ color: "gray.400" }}
          >
            Plateforme :
          </Text>
          <HStack gap={2}>
            {PLATFORMS.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={platform === p.id ? "solid" : "outline"}
                colorPalette={
                  p.id === "twitch"
                    ? "purple"
                    : p.id === "youtube"
                      ? "red"
                      : "green"
                }
                onClick={() => setPlatform(p.id)}
              >
                {p.icon} {p.label}
              </Button>
            ))}
          </HStack>

          <Separator orientation="vertical" h="30px" />

          {/* Copy from another platform */}
          <HStack gap={2} flex={1} minW="220px">
            <Select.Root
              collection={platformCollection}
              value={copyTarget ? [copyTarget] : []}
              onValueChange={(e) => setCopyTarget(e.value[0])}
              size="sm"
              maxW="160px"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Copier depuis..." />
                </Select.Trigger>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {otherPlatforms.map((p) => (
                    <Select.Item
                      key={p.id}
                      item={{ label: p.label, value: p.id }}
                    >
                      {p.icon} {p.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
            <Button
              size="sm"
              variant="outline"
              loading={copying}
              disabled={!copyTarget}
              onClick={copyFrom}
            >
              <FiCopy /> Copier
            </Button>
          </HStack>
        </HStack>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* LEFT — Live Preview */}
          <GridItem>
            <Box position="sticky" top="24px">
              <HStack mb={4} justify="space-between">
                <Heading size="md">👁 Aperçu en temps réel</Heading>
                <Text fontSize="xs" color="gray.400">
                  16:9
                </Text>
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
                bg="repeating-linear-gradient(45deg, #111 0px, #111 10px, #1a1a1a 10px, #1a1a1a 20px)"
                position="relative"
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
                {animTestEvent ? (
                  <AlertOverlayDisplay
                    key={animTestEvent.id}
                    alert={animTestEvent}
                    onDone={() => setAnimTestEvent(null)}
                  />
                ) : (
                  <AlertPreview config={config} />
                )}
              </Box>
              <Text fontSize="xs" color="gray.400" textAlign="center" mt={2}>
                Mis à jour en temps réel
              </Text>
            </Box>
          </GridItem>

          {/* RIGHT — Editor */}
          <GridItem>
            <VStack align="stretch" gap={6}>
              {/* ── Text ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={3}>
                  💬 Texte de l&apos;alerte
                </Heading>
                <Textarea
                  value={config.text}
                  onChange={(e) => update("text", e.target.value)}
                  placeholder="{user} vient de follow !"
                  mb={2}
                  rows={3}
                  resize="vertical"
                />
                <HStack gap={2} flexWrap="wrap">
                  {["{user}", "{amount}"].map((ph) => (
                    <Button
                      key={ph}
                      size="xs"
                      variant="outline"
                      onClick={() => update("text", config.text + ph)}
                    >
                      + {ph}
                    </Button>
                  ))}
                </HStack>
                <Text fontSize="xs" color="gray.400" mt={2}>
                  {"{user}"} = nom · {"{amount}"} = montant (bits, viewers,
                  etc.)
                </Text>
              </Box>

              {/* ── Sound ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={3}>
                  🔊 Son
                </Heading>
                <FileUploader
                  label="Fichier audio (.mp3, .ogg, .wav)"
                  accept=".mp3,.ogg,.wav,.aac"
                  currentUrl={config.soundUrl}
                  mediaType="audio"
                  onUploaded={(url) => update("soundUrl", url)}
                  onRemove={() => update("soundUrl", null)}
                />
                <Box mt={3}>
                  <Text fontSize="sm" mb={1}>
                    Volume : {Math.round(config.volume * 100)}%
                  </Text>
                  <Slider.Root
                    min={0}
                    max={1}
                    step={0.05}
                    value={[config.volume]}
                    onValueChange={(e) => update("volume", e.value[0])}
                  >
                    <Slider.Control>
                      <Slider.Track>
                        <Slider.Range />
                      </Slider.Track>
                      <Slider.Thumb index={0} />
                    </Slider.Control>
                  </Slider.Root>
                </Box>
              </Box>

              {/* ── Alert image / icon ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={3}>
                  🖼 Image / Icône
                </Heading>
                <FileUploader
                  label="Image de l'alerte (.png, .jpg, .gif)"
                  accept=".png,.jpg,.jpeg,.gif,.webp"
                  currentUrl={config.imageUrl}
                  mediaType={
                    config.imageUrl?.endsWith(".gif")
                      ? "gif"
                      : config.imageUrl
                        ? "image"
                        : null
                  }
                  onUploaded={(url) => update("imageUrl", url)}
                  onRemove={() => update("imageUrl", null)}
                />
                <Box mt={3}>
                  <Text fontSize="sm" mb={1}>
                    Taille de l&apos;icône : {config.imageSize ?? 80}px
                  </Text>
                  <Slider.Root
                    min={24}
                    max={200}
                    step={4}
                    value={[config.imageSize ?? 80]}
                    onValueChange={(e) => update("imageSize", e.value[0])}
                  >
                    <Slider.Control>
                      <Slider.Track>
                        <Slider.Range />
                      </Slider.Track>
                      <Slider.Thumb index={0} />
                    </Slider.Control>
                  </Slider.Root>
                </Box>
              </Box>

              {/* ── Container Image ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800", borderColor: "purple.700" }}
                borderRadius="xl"
                shadow="sm"
                border="1px solid"
                borderColor="purple.200"
              >
                <Heading size="sm" mb={1}>
                  📦 Image conteneur
                </Heading>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  Une image qui sert de cadre/fond à l&apos;alerte. Remplace le
                  fond blur et la couleur de fond quand définie.
                </Text>
                <FileUploader
                  label="Image conteneur (.png, .jpg, .gif, .webp)"
                  accept=".png,.jpg,.jpeg,.gif,.webp"
                  currentUrl={config.containerImageUrl}
                  mediaType={
                    config.containerImageUrl?.endsWith(".gif")
                      ? "gif"
                      : config.containerImageUrl
                        ? "image"
                        : null
                  }
                  onUploaded={(url) => update("containerImageUrl", url)}
                  onRemove={() => update("containerImageUrl", null)}
                />
                {config.containerImageUrl && (
                  <VStack align="stretch" gap={3} mt={4}>
                    <Box>
                      <HStack gap={2} mb={1}>
                        <Text fontSize="sm">Largeur :</Text>
                        <Input
                          type="number"
                          size="sm"
                          maxW="90px"
                          fontFamily="mono"
                          value={config.containerWidth ?? 400}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v > 0) update("containerWidth", v);
                          }}
                        />
                        <Text fontSize="sm" color="gray.500">px</Text>
                      </HStack>
                      <Slider.Root
                        min={200}
                        max={800}
                        step={10}
                        value={[config.containerWidth ?? 400]}
                        onValueChange={(e) =>
                          update("containerWidth", e.value[0])
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
                      <HStack gap={2} mb={1}>
                        <Text fontSize="sm">Hauteur :</Text>
                        <Input
                          type="number"
                          size="sm"
                          maxW="90px"
                          fontFamily="mono"
                          value={config.containerHeight ?? 200}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v > 0) update("containerHeight", v);
                          }}
                        />
                        <Text fontSize="sm" color="gray.500">px</Text>
                      </HStack>
                      <Slider.Root
                        min={100}
                        max={600}
                        step={10}
                        value={[config.containerHeight ?? 200]}
                        onValueChange={(e) =>
                          update("containerHeight", e.value[0])
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
                )}
              </Box>

              {/* ── Container Layout ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={3}>
                  🔀 Layout conteneur
                </Heading>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  Position de l&apos;image/icône par rapport au texte dans le
                  conteneur.
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  {LAYOUT_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      size="sm"
                      variant={
                        (config.containerLayout ?? "column") === opt.value
                          ? "solid"
                          : "outline"
                      }
                      colorPalette={
                        (config.containerLayout ?? "column") === opt.value
                          ? "purple"
                          : "gray"
                      }
                      onClick={() => update("containerLayout", opt.value)}
                    >
                      {opt.icon} {opt.label}
                    </Button>
                  ))}
                </HStack>
              </Box>

              {/* ── Full-screen background ── */}
              <Box
                p={5}
                bg="white"
                borderRadius="xl"
                shadow="sm"
                _dark={{ bg: "gray.800" }}
              >
                <HStack mb={1}>
                  <Heading size="sm">🎬 Fond plein écran (1920×1080)</Heading>
                </HStack>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  Image, GIF animé ou vidéo affiché en plein écran derrière la
                  boîte.
                </Text>
                <FileUploader
                  label=t('alerts.fullscreenBg')
                  accept=".jpg,.jpeg,.png,.gif,.mp4,.webm"
                  currentUrl={config.bgMediaUrl}
                  mediaType={
                    config.bgMediaType as "image" | "gif" | "video" | null
                  }
                  onUploaded={(url, mt) => {
                    update("bgMediaUrl", url);
                    update("bgMediaType", mt as AlertConfig["bgMediaType"]);
                  }}
                  onRemove={() => {
                    update("bgMediaUrl", null);
                    update("bgMediaType", null);
                  }}
                />
                <Separator my={3} />
                {!config.containerImageUrl && (
                  <>
                    <Text fontSize="sm" mb={1}>
                      Couleur de fond (fallback)
                    </Text>
                    <HStack gap={2}>
                      <input
                        type="color"
                        value={config.bgColor}
                        onChange={(e) => update("bgColor", e.target.value)}
                        style={{
                          width: 44,
                          height: 36,
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                        }}
                      />
                      <Input
                        value={config.bgColor}
                        onChange={(e) => update("bgColor", e.target.value)}
                        fontFamily="mono"
                        size="sm"
                        maxW="120px"
                      />
                    </HStack>
                  </>
                )}
                {config.containerImageUrl && (
                  <Text fontSize="xs" color="orange.500" fontStyle="italic">
                    ⚠ La couleur de fond est ignorée car une image conteneur est
                    définie.
                  </Text>
                )}
                <Box mt={3}>
                  <Text fontSize="sm" mb={1}>
                    Opacité fondation sombre :{" "}
                    {Math.round(config.bgOverlayOpacity * 100)}%
                  </Text>
                  <Text fontSize="xs" color="gray.400" mb={1}>
                    Assombrit le fond media pour rendre le texte lisible
                  </Text>
                  <Slider.Root
                    min={0}
                    max={1}
                    step={0.05}
                    value={[config.bgOverlayOpacity]}
                    onValueChange={(e) =>
                      update("bgOverlayOpacity", e.value[0])
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
              </Box>

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
                      variant={config.position === pos ? "solid" : "outline"}
                      colorPalette={config.position === pos ? "purple" : "gray"}
                      onClick={() => update("position", pos)}
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
                  Position actuelle : {config.position}
                </Text>
              </Box>

              {/* ── Typography ── */}
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
                  {/* Font Family */}
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Police
                    </Text>
                    <Select.Root
                      collection={fontCollection}
                      value={[config.fontFamily ?? "Inter"]}
                      onValueChange={(e) => update("fontFamily", e.value[0])}
                      size="sm"
                      maxW="240px"
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder=t('alerts.chooseFont') />
                        </Select.Trigger>
                      </Select.Control>
                      <Select.Positioner>
                        <Select.Content>
                          {GOOGLE_FONTS.map((f) => (
                            <Select.Item
                              key={f}
                              item={{ label: f, value: f }}
                            >
                              {f}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Box>

                  {/* Text Color */}
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Couleur du texte
                    </Text>
                    <HStack gap={2}>
                      <input
                        type="color"
                        value={config.textColor}
                        onChange={(e) => update("textColor", e.target.value)}
                        style={{
                          width: 44,
                          height: 36,
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                        }}
                      />
                      <Input
                        value={config.textColor}
                        onChange={(e) => update("textColor", e.target.value)}
                        fontFamily="mono"
                        size="sm"
                        maxW="120px"
                      />
                    </HStack>
                  </Box>

                  {/* Font Size */}
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Taille : {config.fontSize}px
                    </Text>
                    <Slider.Root
                      min={16}
                      max={72}
                      step={2}
                      value={[config.fontSize]}
                      onValueChange={(e) => update("fontSize", e.value[0])}
                    >
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumb index={0} />
                      </Slider.Control>
                    </Slider.Root>
                  </Box>

                  {/* Text Alignment */}
                  <Box>
                    <Text fontSize="sm" mb={2}>
                      Alignement du texte
                    </Text>
                    <HStack gap={2}>
                      {[
                        { value: "left", icon: <FiAlignLeft />, label: "Gauche" },
                        { value: "center", icon: <FiAlignCenter />, label: "Centre" },
                        { value: "right", icon: <FiAlignRight />, label: "Droite" },
                      ].map((opt) => (
                        <Button
                          key={opt.value}
                          size="sm"
                          variant={
                            (config.textAlign ?? "center") === opt.value
                              ? "solid"
                              : "outline"
                          }
                          colorPalette={
                            (config.textAlign ?? "center") === opt.value
                              ? "purple"
                              : "gray"
                          }
                          onClick={() => update("textAlign", opt.value)}
                        >
                          {opt.icon} {opt.label}
                        </Button>
                      ))}
                    </HStack>
                  </Box>
                </VStack>
              </Box>

              {/* ── Text Glow / Shadow ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={3}>
                  ✨ Effet Glow / Ombre
                </Heading>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Couleur du glow
                    </Text>
                    <HStack gap={2}>
                      <input
                        type="color"
                        value={config.glowColor ?? "#6441a5"}
                        onChange={(e) => update("glowColor", e.target.value)}
                        style={{
                          width: 44,
                          height: 36,
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                        }}
                      />
                      <Input
                        value={config.glowColor ?? "#6441a5"}
                        onChange={(e) => update("glowColor", e.target.value)}
                        fontFamily="mono"
                        size="sm"
                        maxW="120px"
                      />
                    </HStack>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Intensité : {config.glowSize}px{" "}
                      {config.glowSize === 0 && "(désactivé)"}
                    </Text>
                    <Slider.Root
                      min={0}
                      max={40}
                      step={2}
                      value={[config.glowSize ?? 0]}
                      onValueChange={(e) => update("glowSize", e.value[0])}
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

              {/* ── Alert Box Border ── */}
              {!config.containerImageUrl && (
                <Box
                  p={5}
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                  borderRadius="xl"
                  shadow="sm"
                >
                  <Heading size="sm" mb={3}>
                    🔲 Bordure de la boîte
                  </Heading>
                  <VStack align="stretch" gap={4}>
                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Couleur
                      </Text>
                      <HStack gap={2}>
                        <input
                          type="color"
                          value={config.borderColor ?? "#ffffff"}
                          onChange={(e) =>
                            update("borderColor", e.target.value)
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
                          value={config.borderColor ?? "#ffffff"}
                          onChange={(e) =>
                            update("borderColor", e.target.value)
                          }
                          fontFamily="mono"
                          size="sm"
                          maxW="120px"
                        />
                      </HStack>
                    </Box>
                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Épaisseur : {config.borderWidth}px{" "}
                        {config.borderWidth === 0 && "(désactivé)"}
                      </Text>
                      <Slider.Root
                        min={0}
                        max={8}
                        step={1}
                        value={[config.borderWidth ?? 0]}
                        onValueChange={(e) =>
                          update("borderWidth", e.value[0])
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
              )}

              {/* ── Timing & Animation ── */}
              <Box
                p={5}
                bg="white"
                _dark={{ bg: "gray.800" }}
                borderRadius="xl"
                shadow="sm"
              >
                <Heading size="sm" mb={3}>
                  ⏱️ Durée & Animations
                </Heading>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Durée : {config.duration}s
                    </Text>
                    <Slider.Root
                      min={2}
                      max={20}
                      step={1}
                      value={[config.duration]}
                      onValueChange={(e) => update("duration", e.value[0])}
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
                    <Text fontSize="sm" mb={2}>
                      Animation d&apos;entrée
                    </Text>
                    <RadioGroup.Root
                      value={config.animation}
                      onValueChange={(e) =>
                        update("animation", e.value ?? "slide-in")
                      }
                    >
                      <HStack gap={3} flexWrap="wrap">
                        {ANIMATIONS.map((anim) => (
                          <RadioGroup.Item key={anim} value={anim}>
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemIndicator />
                            <RadioGroup.ItemText fontSize="sm">
                              {anim}
                            </RadioGroup.ItemText>
                          </RadioGroup.Item>
                        ))}
                      </HStack>
                    </RadioGroup.Root>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={2}>
                      Animation de sortie
                    </Text>
                    <RadioGroup.Root
                      value={config.exitAnimation ?? "fade"}
                      onValueChange={(e) =>
                        update("exitAnimation", e.value ?? "fade")
                      }
                    >
                      <HStack gap={3} flexWrap="wrap">
                        {EXIT_ANIMATIONS.map((anim) => (
                          <RadioGroup.Item key={anim} value={anim}>
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemIndicator />
                            <RadioGroup.ItemText fontSize="sm">
                              {anim}
                            </RadioGroup.ItemText>
                          </RadioGroup.Item>
                        ))}
                      </HStack>
                    </RadioGroup.Root>
                  </Box>
                  <Separator />
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="purple"
                    onClick={testAnimLocal}
                    disabled={!!animTestEvent}
                  >
                    🎬 Tester l&apos;animation (entrée + sortie)
                  </Button>
                  <Text fontSize="xs" color="gray.400">
                    Joue l&apos;animation d&apos;entrée puis de sortie dans
                    l&apos;aperçu ci-contre, sans envoyer d&apos;alerte via
                    OBS.
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}
