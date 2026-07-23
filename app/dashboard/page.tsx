"use client";

import { useTranslation } from "@/lib/i18n";

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
  twitch: { channelName?: string; clientId?: string; connected?: boolean };
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
  const { t } = useTranslation();
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
                  <FiSliders /> {t("common.customize")}
                </Link>
              </Button>
              {overlayHref && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={overlayHref} target="_blank">
                    <FiExternalLink /> {t("common.overlayOBS")}
                  </Link>
                </Button>
              )}
              {basicHref && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={basicHref}>
                    <FiEye /> {t("dashboard.usageBtn")}
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
                {t("dashboard.overlayUrl")}
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
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    async function fetchData() {
      try {
        const [spotifyRes, twitchRes, twitchConnectRes, youtubeRes, settingsRes, meRes] =
          await Promise.all([
            fetch("/api/spotify/status"),
            fetch("/api/twitch/config"),
            fetch("/api/twitch/connect"),
            fetch("/api/youtube/status"),
            fetch("/api/settings"),
            fetch("/api/me"),
          ]);
        const spotify = await spotifyRes.json();
        const twitch = await twitchRes.json();
        const twitchConn = await twitchConnectRes.json();
        const youtube = await youtubeRes.json();
        const settings = await settingsRes.json();
        const me = meRes.ok ? await meRes.json() : null;
        setData({
          spotify,
          twitch: { ...twitch, connected: twitchConn?.connected ?? false },
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

  const twitchConfigured = !!data?.twitch?.channelName;
  const twitchConnected = !!data?.twitch?.connected;
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
              {t("dashboard.headerTitle")}
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
                {twitchConnected ? (
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
                  colorPalette={twitchConnected ? "purple" : twitchConfigured ? "orange" : "gray"}
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                >
                  {twitchConnected
                    ? `@${data?.twitch.channelName}`
                    : twitchConfigured
                    ? `@${data?.twitch.channelName} (${t("dashboard.statusNotConnected")})`
                    : t("dashboard.statusNotConfigured")}
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
                  {spotifyOk ? t("dashboard.statusConnected") : t("dashboard.statusNotConnected")}
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
                  {youtubeOk ? t("dashboard.statusConnected") : t("dashboard.statusNotConnected")}
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
            title={t("dashboard.spotifyWidget")}
            status={
              <StatusBadge
                ok={spotifyOk}
                labelOk={t("dashboard.statusConnected")}
                labelKo={t("dashboard.statusNotConnected")}
              />
            }
            description={t("dashboard.spotifyDesc")}
            configHref="/spotify/customize"
            overlayHref={`/spotify-stream${tokenQuery}`}
            overlayUrl={`${origin}/spotify-stream${tokenQuery}`}
          />

          {/* Twitch Chat */}
          <ServiceCard
            icon={<FiMessageSquare size={20} />}
            iconBg="purple.50"
            iconColor="purple.500"
            title={t("dashboard.twitchTitle")}
            status={
              <StatusBadge
                ok={twitchConnected}
                labelOk={`@${data?.twitch.channelName}`}
                labelKo={
                  twitchConfigured
                    ? `@${data?.twitch.channelName} (${t("dashboard.statusNotConnected")})`
                    : t("dashboard.statusNotConfigured")
                }
              />
            }
            description={t("dashboard.twitchDesc")}
            configHref="/twitch-chat/customize"
            overlayHref={`/twitch-chat-overlay${tokenQuery}`}
            overlayUrl={`${origin}/twitch-chat-overlay${tokenQuery}`}
          />

          {/* YouTube Chat */}
          <ServiceCard
            icon={<FiYoutube size={20} />}
            iconBg="red.50"
            iconColor="red.500"
            title={t("dashboard.youtubeTitle")}
            status={
              <StatusBadge
                ok={youtubeOk}
                labelOk={t("dashboard.statusConnected")}
                labelKo={t("dashboard.statusNotConnected")}
              />
            }
            description={t("dashboard.youtubeDesc")}
            configHref="/youtube-chat/customize"
            basicHref="/youtube-chat"
          />

          {/* Alertes */}
          <ServiceCard
            icon={<FiBell size={20} />}
            iconBg="orange.50"
            iconColor="orange.500"
            title={t("dashboard.streamAlerts")}
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
            description={t("dashboard.alertsDesc")}
            configHref="/alerts"
            overlayHref={`/alerts-overlay${tokenQuery}`}
            overlayUrl={`${origin}/alerts-overlay${tokenQuery}`}
          />

          {/* Discord Media Alert Overlay */}
          <ServiceCard
            icon={<FiBell size={20} />}
            iconBg="blue.50"
            iconColor="blue.500"
            title="Live Chat"
            status={
              <Badge colorPalette="blue" variant="subtle" borderRadius="full" px={2}>
                Discord Bot
              </Badge>
            }
            description="Affichez sur OBS les images, GIFs, vidéos et audios postés dans votre salon Discord."
            configHref="/discord/customize"
            overlayHref={`/discord-overlay${tokenQuery}`}
            overlayUrl={`${origin}/discord-overlay${tokenQuery}`}
          />

          {/* Goal Bar Overlay */}
          <ServiceCard
            icon={<FiSliders size={20} />}
            iconBg="purple.50"
            iconColor="purple.500"
            title="Goal Bar Overlay"
            status={
              <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={2}>
                Objectifs Stream
              </Badge>
            }
            description="Jauge d'objectifs animée avec confettis lors du passage des 100%."
            configHref="/goal/customize"
            overlayHref={`/goal-overlay${tokenQuery}`}
            overlayUrl={`${origin}/goal-overlay${tokenQuery}`}
          />

          {/* Combined Chat */}
          <ServiceCard
            icon={<FiMessageSquare size={20} />}
            iconBg="green.50"
            iconColor="green.500"
            title="Chat Fusionné (Twitch/YT/Discord)"
            status={
              <Badge colorPalette="green" variant="subtle" borderRadius="full" px={2}>
                Multi-plateforme
              </Badge>
            }
            description="Un seul chat transparent sur OBS réunissant Twitch, YouTube et Discord."
            configHref="/combined-chat/customize"
            overlayHref={`/combined-chat-overlay${tokenQuery}`}
            overlayUrl={`${origin}/combined-chat-overlay${tokenQuery}`}
          />

          {/* Roue de la Fortune */}
          <ServiceCard
            icon={<FiSliders size={20} />}
            iconBg="yellow.50"
            iconColor="yellow.600"
            title="Roue de la Fortune Interactive"
            status={
              <Badge colorPalette="yellow" variant="subtle" borderRadius="full" px={2}>
                Interactive
              </Badge>
            }
            description="Roue des défis animée à déclencher en live sur OBS."
            configHref="/wheel/customize"
            overlayHref={`/wheel-overlay${tokenQuery}`}
            overlayUrl={`${origin}/wheel-overlay${tokenQuery}`}
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
                  <Heading size="sm">{t("dashboard.globalSettings")}</Heading>
                  <Text fontSize="sm" color="gray.400" mt={0.5}>
                    {t("dashboard.globalSettingsDesc")}
                  </Text>
                </Box>
              </HStack>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings">
                  <FiSettings /> {t("dashboard.openSettingsBtn")}
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
                    <Heading size="sm">{t("common.admin")}</Heading>
                    <Text fontSize="sm" color="gray.400" mt={0.5}>
                      {t("dashboard.adminDesc")}
                    </Text>
                  </Box>
                </HStack>
                <Button asChild variant="outline" size="sm" colorPalette="blue">
                  <Link href="/admin">
                    <FiShield /> {t("dashboard.adminPanelBtn")}
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
