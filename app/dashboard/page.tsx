"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Card,
  Text,
  HStack,
  Badge,
  VStack,
  Clipboard,
  IconButton,
  InputGroup,
  Input,
  Flex,
  Spinner,
  Separator,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import {
  FiMusic,
  FiMessageSquare,
  FiBell,
  FiSettings,
  FiExternalLink,
  FiSliders,
  FiCheckCircle,
  FiAlertCircle,
  FiWifi,
  FiWifiOff,
  FiYoutube,
  FiEye,
  FiShield,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  spotify: { connected: boolean };
  twitch: { channelName?: string; clientId?: string };
  youtube: { connected: boolean };
  overlayToken?: string;
  user?: { userId: string; role: string };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ClipboardCopyButton = () => (
  <Clipboard.Trigger asChild>
    <IconButton variant="surface" size="xs" me="-2">
      <Clipboard.Indicator />
    </IconButton>
  </Clipboard.Trigger>
);

function OverlayUrl({ value }: { value: string }) {
  return (
    <Clipboard.Root value={value}>
      <InputGroup endElement={<ClipboardCopyButton />}>
        <Clipboard.Input asChild>
          <Input
            size="sm"
            readOnly
            fontFamily="mono"
            fontSize="xs"
            color="gray.500"
            _dark={{ color: "gray.400" }}
          />
        </Clipboard.Input>
      </InputGroup>
    </Clipboard.Root>
  );
}

function StatusBadge({
  ok,
  labelOk,
  labelKo,
}: {
  ok: boolean;
  labelOk: string;
  labelKo: string;
}) {
  return (
    <Badge
      colorPalette={ok ? "green" : "orange"}
      variant="subtle"
      display="flex"
      alignItems="center"
      gap={1}
      px={2}
      py={0.5}
      borderRadius="full"
    >
      {ok ? <FiCheckCircle size={11} /> : <FiAlertCircle size={11} />}
      {ok ? labelOk : labelKo}
    </Badge>
  );
}

function ServiceCard({
  icon,
  iconBg,
  iconColor,
  title,
  status,
  description,
  configHref,
  overlayHref,
  overlayUrl,
  basicHref,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  status: React.ReactNode;
  description: string;
  configHref: string;
  overlayHref?: string;
  overlayUrl?: string;
  basicHref?: string;
}) {
  return (
    <Card.Root
      bg="white"
      _dark={{ bg: "gray.800" }}
      shadow="sm"
      borderRadius="xl"
      overflow="hidden"
      transition="shadow 0.15s"
      _hover={{ shadow: "md" }}
      h="full"
      display="flex"
      flexDir="column"
    >
      <Card.Header pb={2}>
        <HStack justify="space-between" align="flex-start">
          <HStack gap={3}>
            <Box
              p={2}
              bg={iconBg}
              borderRadius="lg"
              color={iconColor}
              flexShrink={0}
            >
              {icon}
            </Box>
            <Box>
              <Heading size="sm">{title}</Heading>
              <Box mt={1}>{status}</Box>
            </Box>
          </HStack>
        </HStack>
      </Card.Header>

      <Card.Body pt={2}>
        <VStack align="stretch" gap={4} flex={1}>
          <Box>
            <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
              {description}
            </Text>

            <HStack gap={2} flexWrap="wrap" mt={4}>
              <Button asChild variant="outline" size="sm">
                <Link href={configHref}>
                  <FiSliders /> Personnaliser
                </Link>
              </Button>
              {overlayHref && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={overlayHref} target="_blank">
                    <FiExternalLink /> Overlay OBS
                  </Link>
                </Button>
              )}
              {basicHref && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={basicHref}>
                    <FiEye /> Utilisation
                  </Link>
                </Button>
              )}
            </HStack>
          </Box>

          {overlayUrl && (
            <Box mt="auto">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                mb={1.5}
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                URL Overlay
              </Text>
              <OverlayUrl value={overlayUrl} />
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    async function fetchData() {
      try {
        const [spotifyRes, twitchRes, youtubeRes, settingsRes, meRes] =
          await Promise.all([
            fetch("/api/spotify/status"),
            fetch("/api/twitch/config"),
            fetch("/api/youtube/status"),
            fetch("/api/settings"),
            fetch("/api/me"),
          ]);
        const spotify = await spotifyRes.json();
        const twitch = await twitchRes.json();
        const youtube = await youtubeRes.json();
        const settings = await settingsRes.json();
        const me = meRes.ok ? await meRes.json() : null;
        setData({
          spotify,
          twitch,
          youtube,
          overlayToken: settings.system?.overlayToken,
          user: me,
        });
      } catch (e) {
        console.error("Dashboard fetch error", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Flex minH="50vh" justify="center" align="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  const twitchOk = !!data?.twitch?.channelName;
  const spotifyOk = !!data?.spotify?.connected;
  const youtubeOk = !!data?.youtube?.connected;
  const tokenQuery = data?.overlayToken ? `?token=${data.overlayToken}` : "";
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Container maxW="7xl" py={8}>
        {/* ── Hero header ── */}
        <Grid
          templateColumns={{ base: "1fr", md: "1fr auto" }}
          mb={8}
          gap={4}
          alignItems="center"
        >
          <GridItem>
            <Heading size="2xl" mb={1}>
              🎛 Stream Dashboard
            </Heading>
            <Text color="gray.400" fontSize="sm" textTransform="capitalize">
              {dateStr}
            </Text>
          </GridItem>

          {/* ── Status overview ── */}
          <GridItem>
            <Flex
              gap={3}
              p={4}
              bg="white"
              _dark={{ bg: "gray.800" }}
              borderRadius="xl"
              shadow="sm"
              align="center"
              flexWrap="wrap"
            >
              <HStack gap={2}>
                {twitchOk ? (
                  <FiWifi size={14} color="var(--chakra-colors-purple-400)" />
                ) : (
                  <FiWifiOff size={14} color="var(--chakra-colors-gray-400)" />
                )}
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.600"
                  _dark={{ color: "gray.300" }}
                >
                  Twitch
                </Text>
                <Badge
                  colorPalette={twitchOk ? "purple" : "gray"}
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                >
                  {twitchOk ? `@${data?.twitch.channelName}` : "Non configuré"}
                </Badge>
              </HStack>

              <Separator orientation="vertical" h={5} />

              <HStack gap={2}>
                {spotifyOk ? (
                  <FiWifi size={14} color="var(--chakra-colors-green-400)" />
                ) : (
                  <FiWifiOff size={14} color="var(--chakra-colors-gray-400)" />
                )}
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.600"
                  _dark={{ color: "gray.300" }}
                >
                  Spotify
                </Text>
                <Badge
                  colorPalette={spotifyOk ? "green" : "gray"}
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                >
                  {spotifyOk ? "Connecté" : "Non connecté"}
                </Badge>
              </HStack>
              <Separator orientation="vertical" h={5} />

              <HStack gap={2}>
                {youtubeOk ? (
                  <FiWifi size={14} color="var(--chakra-colors-red-400)" />
                ) : (
                  <FiWifiOff size={14} color="var(--chakra-colors-gray-400)" />
                )}
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.600"
                  _dark={{ color: "gray.300" }}
                >
                  YouTube
                </Text>
                <Badge
                  colorPalette={youtubeOk ? "red" : "gray"}
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                >
                  {youtubeOk ? "Connecté" : "Non connecté"}
                </Badge>
              </HStack>
            </Flex>
          </GridItem>
        </Grid>

        {/* ── Service cards ── */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {/* Spotify */}
          <ServiceCard
            icon={<FiMusic size={20} />}
            iconBg="green.50"
            iconColor="green.500"
            title="Spotify Widget"
            status={
              <StatusBadge
                ok={spotifyOk}
                labelOk="Connecté"
                labelKo="Non connecté"
              />
            }
            description="Widget now-playing glassmorphism avec pochette, barre de progression et contrôles de lecture."
            configHref="/spotify/customize"
            overlayHref={`/spotify-stream${tokenQuery}`}
            overlayUrl={`${origin}/spotify-stream${tokenQuery}`}
          />

          {/* Twitch Chat */}
          <ServiceCard
            icon={<FiMessageSquare size={20} />}
            iconBg="purple.50"
            iconColor="purple.500"
            title="Twitch Chat"
            status={
              <StatusBadge
                ok={twitchOk}
                labelOk={`@${data?.twitch.channelName}`}
                labelKo="Non configuré"
              />
            }
            description="Overlay chat Twitch transparent avec support des badges, animations personnalisables et police libre."
            configHref="/twitch-chat/customize"
            overlayHref={`/twitch-chat-overlay${tokenQuery}`}
            overlayUrl={`${origin}/twitch-chat-overlay${tokenQuery}`}
          />

          {/* YouTube Chat */}
          <ServiceCard
            icon={<FiYoutube size={20} />}
            iconBg="red.50"
            iconColor="red.500"
            title="YouTube Chat"
            status={
              <StatusBadge
                ok={youtubeOk}
                labelOk="Connecté"
                labelKo="Non connecté"
              />
            }
            description="Utilise l'URL officielle du chat YouTube injectée avec du Custom CSS OBS généré depuis le Dashboard."
            configHref="/youtube-chat/customize"
            basicHref="/youtube-chat"
          />

          {/* Alertes */}
          <ServiceCard
            icon={<FiBell size={20} />}
            iconBg="orange.50"
            iconColor="orange.500"
            title="Alertes Stream"
            status={
              <Badge
                colorPalette="blue"
                variant="subtle"
                borderRadius="full"
                px={2}
              >
                Twitch · YouTube
              </Badge>
            }
            description="Follow, sub, bits, raid, cheer, gift_sub — alertes entièrement personnalisables avec fond plein écran 1080p."
            configHref="/alerts"
            overlayHref={`/alerts-overlay${tokenQuery}`}
            overlayUrl={`${origin}/alerts-overlay${tokenQuery}`}
          />
        </SimpleGrid>

        {/* ── Quick settings shortcut ── */}
        <SimpleGrid
          columns={{ base: 1, md: data?.user?.role === "admin" ? 2 : 1 }}
          gap={6}
          mt={8}
        >
          <Box
            p={5}
            bg="white"
            _dark={{ bg: "gray.800" }}
            borderRadius="xl"
            shadow="sm"
          >
            <HStack justify="space-between" flexWrap="wrap" gap={3}>
              <HStack gap={3}>
                <Box
                  p={2}
                  bg="gray.100"
                  _dark={{ bg: "gray.700" }}
                  borderRadius="lg"
                  color="gray.500"
                >
                  <FiSettings size={18} />
                </Box>
                <Box>
                  <Heading size="sm">Paramètres globaux</Heading>
                  <Text fontSize="sm" color="gray.400" mt={0.5}>
                    Connexions Twitch, Spotify, YouTube…
                  </Text>
                </Box>
              </HStack>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings">
                  <FiSettings /> Ouvrir les paramètres
                </Link>
              </Button>
            </HStack>
          </Box>

          {data?.user?.role === "admin" && (
            <Box
              p={5}
              bg="white"
              _dark={{ bg: "gray.800" }}
              borderRadius="xl"
              shadow="sm"
            >
              <HStack justify="space-between" flexWrap="wrap" gap={3}>
                <HStack gap={3}>
                  <Box
                    p={2}
                    bg="blue.50"
                    _dark={{ bg: "blue.900" }}
                    borderRadius="lg"
                    color="blue.500"
                  >
                    <FiShield size={18} />
                  </Box>
                  <Box>
                    <Heading size="sm">Administration</Heading>
                    <Text fontSize="sm" color="gray.400" mt={0.5}>
                      Gérer les utilisateurs et les accès.
                    </Text>
                  </Box>
                </HStack>
                <Button asChild variant="outline" size="sm" colorPalette="blue">
                  <Link href="/admin">
                    <FiShield /> Panneau Admin
                  </Link>
                </Button>
              </HStack>
            </Box>
          )}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
