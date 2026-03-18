"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  HStack,
  VStack,
  Badge,
  Button,
  Switch,
  Spinner,
  Flex,
  IconButton,
  Tabs,
  Clipboard,
  Input,
  InputGroup,
} from "@chakra-ui/react";
import {
  FiHeart,
  FiStar,
  FiZap,
  FiShield,
  FiGift,
  FiAward,
  FiSettings,
  FiPlay,
  FiCopy,
  FiCheck,
  FiTwitch,
  FiYoutube,
} from "react-icons/fi";
import Link from "next/link";
import { toaster, Toaster } from "@/components/ui/toaster";
import { useTranslation } from '@/lib/i18n'

interface AlertConfig {
  id: string;
  type: string;
  platform: string;
  enabled: boolean;
  text: string;
  soundUrl?: string | null;
  imageUrl?: string | null;
  bgMediaUrl?: string | null;
  bgMediaType?: string | null;
  duration: number;
  bgColor: string;
  textColor: string;
  animation: string;
  position: string;
}

const PLATFORMS = [
  {
    id: "twitch",
    label: "Twitch",
    icon: <FiTwitch />,
    color: "purple",
    disabled: false,
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: <FiYoutube />,
    color: "red",
    disabled: false,
  },
];

const ALERT_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; desc: string }
> = {
  follow: {
    label: "Follow",
    icon: <FiHeart size={20} />,
    color: "pink",
    desc: "Quelqu'un suit votre chaîne",
  },
  sub: {
    label: "Abonnement",
    icon: <FiStar size={20} />,
    color: "purple",
    desc: "Nouvel abonné",
  },
  bits: {
    label: "Bits",
    icon: <FiZap size={20} />,
    color: "yellow",
    desc: "Don de bits",
  },
  raid: {
    label: "Raid",
    icon: <FiShield size={20} />,
    color: "red",
    desc: "Raid entrant",
  },
  cheer: {
    label: "Cheer",
    icon: <FiAward size={20} />,
    color: "violet",
    desc: "Encouragement",
  },
  gift_sub: {
    label: "Gift Sub",
    icon: <FiGift size={20} />,
    color: "cyan",
    desc: "Abonnements offerts",
  },
};

export default function AlertsConfigPage() {
  const { t } = useTranslation()
  const [platform, setPlatform] = useState("twitch");
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [tokenQuery, setTokenQuery] = useState("");

  async function loadConfigs(p: string) {
    setLoading(true);
    try {
      const [data, settingsRes] = await Promise.all([
        fetch(`/api/alerts/config?platform=${p}`).then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
      ]);
      setConfigs(data);
      if (settingsRes.system?.overlayToken) {
        setTokenQuery(`?token=${settingsRes.system.overlayToken}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfigs(platform);
  }, [platform]);

  async function toggleEnabled(type: string, enabled: boolean) {
    setConfigs((prev) =>
      prev.map((c) => (c.type === type ? { ...c, enabled } : c)),
    );
    await fetch(`/api/alerts/config/${type}?platform=${platform}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
  }

  async function testAlert(type: string) {
    setTesting(type);
    try {
      const res = await fetch("/api/alerts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, platform }),
      });
      if (res.ok) {
        toaster.create({
          title: `Test "${ALERT_META[type]?.label}" envoyé !`,
          type: "success",
        });
      }
    } catch {
      toaster.create({ title: t('alerts.testError'), type: "error" });
    } finally {
      setTesting(null);
    }
  }

  const overlayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/alerts-overlay${tokenQuery}`
      : "";

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Toaster />
      <Container maxW="7xl" py={10}>
        {/* Header */}
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <Box>
            <Heading size="2xl">🔔 Alertes Stream</Heading>
            <Text color="gray.500" mt={1}>
              Activez, configurez et testez vos alertes par plateforme.
            </Text>
          </Box>
          <HStack gap={2}>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings">
                <FiSettings /> Config plateformes
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/alerts-overlay${tokenQuery}`} target="_blank">
                Overlay OBS ↗
              </Link>
            </Button>
          </HStack>
        </HStack>

        {/* OBS URL — Clipboard */}
        <Box
          mb={8}
          p={4}
          bg="purple.50"
          _dark={{ bg: "purple.950", borderColor: "purple.800" }}
          borderRadius="xl"
          border="1px solid"
          borderColor="purple.200"
        >
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="purple.600"
            _dark={{ color: "purple.300" }}
            mb={2}
            textTransform="uppercase"
          >
            🎮 URL OBS Browser Source
          </Text>
          <Clipboard.Root value={overlayUrl}>
            <InputGroup
              endElement={
                <Clipboard.Trigger asChild>
                  <IconButton size="xs" variant="ghost" aria-label="Copier URL">
                    <Clipboard.Indicator copied={<FiCheck />} />
                  </IconButton>
                </Clipboard.Trigger>
              }
            >
              <Clipboard.Input asChild>
                <Input
                  size="sm"
                  readOnly
                  fontFamily="mono"
                  bg="white"
                  _dark={{ bg: "purple.900" }}
                  borderColor="purple.300"
                />
              </Clipboard.Input>
            </InputGroup>
          </Clipboard.Root>
        </Box>

        {/* Platform Tabs */}
        <Tabs.Root
          value={platform}
          onValueChange={(e) => setPlatform(e.value)}
          mb={8}
          variant="enclosed"
        >
          <Tabs.List>
            {PLATFORMS.map((p) => (
              <Tabs.Trigger key={p.id} value={p.id} disabled={p.disabled}>
                {p.icon} {p.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        {/* Alert Cards */}
        {loading ? (
          <Flex justify="center" py={16}>
            <Spinner size="xl" />
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {configs.map((config) => {
              const meta = ALERT_META[config.type] ?? {
                label: config.type,
                icon: <FiHeart size={20} />,
                color: "gray",
                desc: "",
              };

              return (
                <Card.Root
                  key={config.type}
                  opacity={config.enabled ? 1 : 0.6}
                  transition="all 0.2s"
                  _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
                >
                  <Card.Header pb={0}>
                    <HStack justify="space-between">
                      <HStack gap={3}>
                        <Box
                          p={2}
                          bg={`${meta.color}.100`}
                          _dark={{
                            bg: `${meta.color}.900`,
                            color: `${meta.color}.300`,
                          }}
                          color={`${meta.color}.600`}
                          borderRadius="lg"
                        >
                          {meta.icon}
                        </Box>
                        <Box>
                          <Heading size="sm">{meta.label}</Heading>
                          <Text fontSize="xs" color="gray.500">
                            {meta.desc}
                          </Text>
                        </Box>
                      </HStack>
                      <Switch.Root
                        checked={config.enabled}
                        onCheckedChange={(e) =>
                          toggleEnabled(config.type, e.checked)
                        }
                        colorPalette={meta.color}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Root>
                    </HStack>
                  </Card.Header>

                  <Card.Body pt={3}>
                    <VStack align="stretch" gap={3}>
                      <HStack gap={2} flexWrap="wrap">
                        <Badge variant="outline" size="sm">
                          {config.animation}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {config.duration}s
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {config.position}
                        </Badge>
                        {config.soundUrl && (
                          <Badge
                            colorPalette="green"
                            variant="subtle"
                            size="sm"
                          >
                            🔊 Son
                          </Badge>
                        )}
                        {config.imageUrl && (
                          <Badge colorPalette="blue" variant="subtle" size="sm">
                            🖼 Image
                          </Badge>
                        )}
                        {config.bgMediaUrl && (
                          <Badge
                            colorPalette="violet"
                            variant="subtle"
                            size="sm"
                          >
                            {config.bgMediaType === "video"
                              ? "🎬 Vidéo"
                              : "🎨 Fond"}
                          </Badge>
                        )}
                      </HStack>

                      <Box
                        p={2}
                        bg="gray.100"
                        _dark={{ bg: "gray.800" }}
                        borderRadius="md"
                        borderLeft="3px solid"
                        borderColor={`${meta.color}.400`}
                      >
                        <Text fontSize="xs" color="gray.500" mb={0.5}>
                          Texte
                        </Text>
                        <Text fontSize="sm" lineClamp={1}>
                          {config.text}
                        </Text>
                      </Box>

                      <HStack gap={2}>
                        <Button asChild variant="outline" size="sm" flex={1}>
                          <Link
                            href={`/alerts/customize/${config.type}?platform=${platform}`}
                          >
                            <FiSettings /> Personnaliser
                          </Link>
                        </Button>
                        <IconButton
                          size="sm"
                          colorPalette={meta.color}
                          variant="subtle"
                          loading={testing === config.type}
                          disabled={!config.enabled}
                          onClick={() => testAlert(config.type)}
                          aria-label={`Tester ${meta.label}`}
                          title=t('alerts.sendFakeAlert')
                        >
                          <FiPlay />
                        </IconButton>
                      </HStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              );
            })}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}
