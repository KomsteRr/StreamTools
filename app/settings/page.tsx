"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Card,
  Spinner,
  Flex,
  Badge,
  Separator,
  Tabs,
} from "@chakra-ui/react";
import {
  FiSave,
  FiWifi,
  FiWifiOff,
  FiRefreshCw,
  FiTwitch,
  FiMusic,
  FiYoutube,
  FiSettings,
  FiCopy,
  FiCheck,
  FiExternalLink,
  FiShield,
  FiKey,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
} from "react-icons/fi";
import { toaster, Toaster } from "@/components/ui/toaster";
import { useTranslation } from '@/lib/i18n'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlatformSettings {
  [key: string]: string;
}

interface AllSettings {
  twitch?: PlatformSettings;
  youtube?: PlatformSettings;
  spotify?: PlatformSettings;
  system?: PlatformSettings;
}

// ─── Field definitions per platform ─────────────────────────────────────────

function getTwitchFields(t: (key: string) => string) {
  return [
    {
      key: "channelName",
      label: t("settings.fields.channelName"),
      hint: t("settings.fields.channelNameHint"),
      type: "text",
    },
    {
      key: "botName",
      label: t('settings.fields.botName'),
      hint: t("settings.fields.botNameHint"),
      type: "text",
    },
    {
      key: "botPassword",
      label: t('settings.fields.botPassword'),
      hint: t("settings.fields.botTokenHint"),
      type: "password",
    },
    {
      key: "broadcasterId",
      label: t("settings.fields.broadcasterId"),
      hint: t("settings.fields.broadcasterIdHint"),
      type: "text",
    },
    {
      key: "clientId",
      label: t("settings.fields.clientId"),
      hint: t("settings.fields.clientIdHint"),
      type: "text",
    },
    {
      key: "accessToken",
      label: t("settings.fields.accessToken"),
      hint: t("settings.fields.accessTokenHint"),
      type: "password",
    },
]
}

function getSpotifyFields(t: (key: string) => string) {
  return [
    {
      key: "clientId",
      label: t("settings.fields.clientId"),
      hint: t("settings.fields.spotifyClientIdHint"),
      type: "text",
    },
    {
      key: "clientSecret",
      label: t("settings.clientSecret"),
      hint: t("settings.fields.spotifyClientSecretHint"),
      type: "password",
    },
  ];
}

function getYoutubeFields(t: (key: string) => string) {
  return [
    {
      key: "channelId",
      label: t("settings.fields.broadcasterId"),
      hint: t("settings.fields.youtubeChannelIdHint"),
      type: "text",
    },
    {
      key: "apiKey",
      label: t("settings.fields.accessToken"),
      hint: t("settings.fields.youtubeApiKeyHint"),
      type: "password",
    },
  ];
}

// ─── Component ───────────────────────────────────────────────────────────────

function PlatformCard({
  platform,
  label,
  icon,
  color,
  fields,
  initialValues,
  onSave,
  connectStatus,
  onConnect,
  onDisconnect,
  onValuesChange,
}: {
  platform: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  fields: { key: string; label: string; hint: string; type: string }[];
  initialValues: PlatformSettings;
  onSave: (platform: string, settings: PlatformSettings) => Promise<void>;
  connectStatus: boolean | null;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onValuesChange?: (values: PlatformSettings) => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<PlatformSettings>(initialValues);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function handleFieldChange(key: string, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    onValuesChange?.(next);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(platform, values);
      toaster.create({ title: t("settings.saveSuccess"), type: "success" });
    } catch {
      toaster.create({ title: t('common.saveError'), type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      await onConnect();
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setConnecting(true);
    try {
      await onDisconnect();
    } finally {
      setConnecting(false);
    }
  }

  const isConnected = connectStatus === true;

  return (
    <Card.Root>
      <Card.Header>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Box
              p={2}
              bg={`${color}.100`}
              _dark={{ bg: `${color}.900`, color: `${color}.300` }}
              color={`${color}.600`}
              borderRadius="lg"
              fontSize="xl"
            >
              {icon}
            </Box>
            <Box>
              <Heading size="md">{label}</Heading>
              <Text fontSize="xs" color="gray.500">
                {t("settings.connectionParams")}
              </Text>
            </Box>
          </HStack>

          {/* Connection status & actions */}
          {connectStatus !== null && (
            <HStack gap={2}>
              <Badge
                colorPalette={isConnected ? "green" : "gray"}
                variant="subtle"
                fontSize="xs"
              >
                {isConnected ? `🟢 ${t("settings.statusConnected")}` : `⚫ ${t("settings.statusDisconnected")}`}
              </Badge>
              {isConnected ? (
                <Button
                  size="xs"
                  colorPalette="red"
                  variant="outline"
                  loading={connecting}
                  onClick={handleDisconnect}
                >
                  <FiWifiOff /> {t("settings.disconnectBtn")}
                </Button>
              ) : (
                <Button
                  size="xs"
                  colorPalette="green"
                  variant="outline"
                  loading={connecting}
                  onClick={handleConnect}
                >
                  <FiWifi /> {t("common.connect")}
                </Button>
              )}
            </HStack>
          )}
        </HStack>
      </Card.Header>

      <Separator />

      <Card.Body>
        <VStack align="stretch" gap={4}>
          {fields.map((field) => (
            <Box key={field.key}>
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                {field.label}
              </Text>
              <Input
                type={field.type}
                value={values[field.key] ?? ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.hint}
                fontFamily={field.type === "password" ? "mono" : undefined}
                size="sm"
              />
              <Text fontSize="xs" color="gray.400" mt={0.5}>
                {field.hint}
              </Text>
            </Box>
          ))}

          <HStack justify="flex-end">
            <Button
              size="sm"
              loading={saving}
              onClick={handleSave}
            >
              <FiSave /> {t("common.save")}
            </Button>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ─── Twitch scopes helper ─────────────────────────────────────────────────────

function TwitchScopeHelper({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const scopes = [
    "moderator:read:followers",
    "channel:read:subscriptions",
    "bits:read",
  ].join("+");

  const placeholder = "YOUR_CLIENT_ID";
  const id = clientId.trim() || placeholder;
  const oauthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${id}&redirect_uri=http://localhost&response_type=token&scope=${scopes}`;
  const hasClientId = !!clientId.trim();

  const [copied, setCopied] = useState(false);
  function copyUrl() {
    navigator.clipboard.writeText(oauthUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card.Root
      border="1px dashed"
      borderColor="purple.300"
      bg="purple.50"
      _dark={{ bg: "purple.950", borderColor: "purple.700" }}
    >
      <Card.Body>
        <Heading
          size="xs"
          mb={3}
          color="purple.700"
          _dark={{ color: "purple.300" }}
        >
          {t("settings.twitchAppHelpTitle")}
        </Heading>
        <VStack
          align="stretch"
          gap={3}
          fontSize="xs"
          color="gray.600"
          _dark={{ color: "gray.400" }}
        >
          <Text>{t("settings.twitchAppHelp1")}</Text>

          <Text>{t("settings.twitchAppHelp2")}</Text>

          {/* Dynamic URL box with copy + open buttons */}
          <Box
            fontFamily="mono"
            fontSize="xs"
            p={3}
            bg={hasClientId ? "purple.100" : "gray.100"}
            _dark={{ bg: hasClientId ? "purple.900" : "gray.800" }}
            borderRadius="md"
            wordBreak="break-all"
            position="relative"
          >
            <Text mb={2} color={hasClientId ? "inherit" : "gray.400"}>
              {oauthUrl}
            </Text>
            <HStack gap={2}>
              <Button
                size="xs"
                variant="outline"
                colorPalette="purple"
                onClick={copyUrl}
                disabled={!hasClientId}
              >
                {copied ? <FiCheck /> : <FiCopy />}
                {copied ? t("settings.twitchAppHelpCopied") : t("settings.twitchAppHelpCopy")}
              </Button>
              {hasClientId && (
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="purple"
                  asChild
                >
                  <a href={oauthUrl} target="_blank" rel="noopener noreferrer">
                    <FiExternalLink /> {t("settings.twitchAppHelpOpen")}
                  </a>
                </Button>
              )}
            </HStack>
          </Box>

          {!hasClientId && (
            <Text color="orange.500" fontStyle="italic">
              {t("settings.twitchAppHelpWarning")}
            </Text>
          )}

          <Box
            p={2}
            bg="blue.50"
            _dark={{ bg: "blue.950", borderColor: "blue.800" }}
            borderRadius="md"
            border="1px solid"
            borderColor="blue.200"
          >
            <Text
              color="blue.700"
              _dark={{ color: "blue.300" }}
              fontWeight="medium"
            >
              {t("settings.twitchAppHelpMsgTitle")}
            </Text>
            <Text mt={1}>
              {t("settings.twitchAppHelpMsgDescPart1")}{" "}
              <strong>{t("common.continue")}</strong>. {t("settings.twitchAppHelpMsgDescPart2")}
            </Text>
          </Box>

          <Text>{t("settings.twitchAppHelp3")}</Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ─── Twitch Broadcaster ID helper ────────────────────────────────────────────

function TwitchBroadcasterIdHelper() {
  const { t } = useTranslation();
  return (
    <Card.Root
      border="1px dashed"
      borderColor="blue.300"
      bg="blue.50"
      _dark={{ bg: "blue.950", borderColor: "blue.700" }}
    >
      <Card.Body>
        <Heading
          size="xs"
          mb={2}
          color="blue.700"
          _dark={{ color: "blue.300" }}
        >
          {t("settings.twitchIdHelpTitle")}
        </Heading>
        <VStack
          align="stretch"
          gap={2}
          fontSize="xs"
          color="gray.600"
          _dark={{ color: "gray.400" }}
        >
          <Text fontWeight="semibold">
            {t("settings.twitchIdHelpOpt1")}
          </Text>
          <Box
            fontFamily="mono"
            fontSize="xs"
            p={2}
            bg="blue.100"
            _dark={{ bg: "blue.900" }}
            borderRadius="md"
            wordBreak="break-all"
          >
            streamweasels.com/tools/convert-twitch-username-to-user-id/
          </Box>
          <Text>{t("settings.twitchIdHelpOpt1Desc")}</Text>

          <Text fontWeight="semibold" mt={1}>
            {t("settings.twitchIdHelpOpt2")}
          </Text>
          <Box
            fontFamily="mono"
            fontSize="xs"
            p={2}
            bg="blue.100"
            _dark={{ bg: "blue.900" }}
            borderRadius="md"
            wordBreak="break-all"
          >
            curl -H &quot;Authorization: Bearer VOTRE_TOKEN&quot; -H &quot;Client-Id:
            VOTRE_CLIENT_ID&quot;
            &quot;https://api.twitch.tv/helix/users?login=VOTRE_PSEUDO&quot;
          </Box>
          <Text>{t("settings.twitchIdHelpOpt2Desc")}</Text>

          <Text fontSize="xs" color="gray.400" mt={1}>
            {t("settings.twitchIdHelpInfo")}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ─── Spotify Redirect URI helper ─────────────────────────────────────────────

function SpotifyHelpHelper({ origin }: { origin: string }) {
  const { t } = useTranslation();
  const callbackUrl = `${origin || "http://localhost:3000"}/api/spotify/callback`;
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(callbackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card.Root
      border="1px dashed"
      borderColor="green.300"
      bg="green.50"
      _dark={{ bg: "green.950", borderColor: "green.700" }}
    >
      <Card.Body>
        <Heading
          size="xs"
          mb={3}
          color="green.700"
          _dark={{ color: "green.300" }}
        >
          {t("settings.spotifyHelpTitle")}
        </Heading>
        <VStack
          align="stretch"
          gap={3}
          fontSize="xs"
          color="gray.600"
          _dark={{ color: "gray.400" }}
        >
          <Text>{t("settings.spotifyHelp1")}</Text>
          <Text>{t("settings.spotifyHelp2")}</Text>

          <Box
            fontFamily="mono"
            fontSize="xs"
            p={3}
            bg="green.100"
            _dark={{ bg: "green.900" }}
            borderRadius="md"
            wordBreak="break-all"
          >
            <Text mb={2} color="inherit">
              {callbackUrl}
            </Text>
            <Button
              size="xs"
              variant="outline"
              colorPalette="green"
              onClick={copyUrl}
            >
              {copied ? <FiCheck /> : <FiCopy />}
              {copied ? t("settings.spotifyHelpCopied") : t("settings.spotifyHelpCopy")}
            </Button>
          </Box>

          <Text>{t("settings.spotifyHelp3")}</Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ─── Security & Token Regeneration Component ─────────────────────────────────

function SecurityCard({
  overlayToken,
  onRegenerateToken,
}: {
  overlayToken: string;
  onRegenerateToken: () => Promise<void>;
}) {
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRegen = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir régénérer votre Token Overlay ? Tous vos liens d'overlays OBS existants deviendront inactifs et devront être mis à jour dans OBS Studio.")) {
      return;
    }
    setLoading(true);
    try {
      await onRegenerateToken();
      toaster.create({ title: "Nouveau Token d'Overlay généré avec succès !", type: "success" });
    } catch {
      toaster.create({ title: "Erreur lors de la régénération du token", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(overlayToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toaster.create({ title: "Token copié dans le presse-papier !", type: "success" });
  };

  return (
    <Card.Root border="1px solid rgba(239, 68, 68, 0.3)" bg="#12141D" p={6} borderRadius="xl">
      <VStack align="stretch" gap={5}>
        <HStack gap={3}>
          <Box p={2.5} bg="rgba(239, 68, 68, 0.15)" color="red.400" borderRadius="lg">
            <FiShield size={24} />
          </Box>
          <Box>
            <Heading size="md" color="white">Sécurité des Tokens & Clés d&apos;Accès</Heading>
            <Text fontSize="xs" color="gray.400">
              Gérez la confidentialité de vos tokens d&apos;overlays et régénérez-les instantanément en cas de fuite en direct.
            </Text>
          </Box>
        </HStack>

        <Separator borderColor="rgba(255,255,255,0.08)" />

        {/* Token Box */}
        <Box p={4} bg="#1F2330" borderRadius="lg" border="1px solid rgba(255,255,255,0.08)">
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between">
              <Text fontWeight="bold" fontSize="sm" color="white" display="flex" alignItems="center" gap={2}>
                <FiKey color="#F59E0B" /> Token Principal d&apos;Overlay (OBS &amp; Modération)
              </Text>
              <Badge colorPalette="yellow" variant="outline">Clef de Sécurité</Badge>
            </HStack>
            
            <Text fontSize="xs" color="gray.400">
              Ce token sécurise l&apos;ensemble de vos URLs d&apos;overlays OBS (Twitch Chat, Multi Chat, Alerte Discord, Roue) et votre page de modération de la file d&apos;attente.
            </Text>

            <HStack>
              <Input
                type={showToken ? "text" : "password"}
                value={overlayToken || "..."}
                readOnly
                bg="#12141D"
                fontFamily="mono"
                color="white"
              />
              <Button size="sm" variant="outline" colorPalette="gray" onClick={() => setShowToken(!showToken)}>
                {showToken ? <FiEyeOff /> : <FiEye />}
              </Button>
              <Button size="sm" variant="outline" colorPalette="yellow" onClick={copyToken}>
                {copied ? <FiCheck /> : <FiCopy />}
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Warning Alert & Regenerate Button */}
        <Box p={4} bg="rgba(239, 68, 68, 0.1)" border="1px solid rgba(239, 68, 68, 0.3)" borderRadius="lg">
          <HStack align="flex-start" gap={3}>
            <Box color="red.400" pt={1}>
              <FiAlertTriangle size={20} />
            </Box>
            <VStack align="stretch" gap={2} flex={1}>
              <Text fontWeight="bold" fontSize="sm" color="red.300">
                Que faire en cas de fuite de vos liens en plein stream ?
              </Text>
              <Text fontSize="xs" color="gray.300" lineHeight="1.5">
                Si l&apos;une de vos clés ou votre lien d&apos;overlay a été aperçu à l&apos;écran, cliquez ci-dessous pour invalider immédiatement l&apos;ancien token et en générer un nouveau. Tous les anciens liens OBS et le lien de modération de la file d&apos;attente cesseront d&apos;être accessibles.
              </Text>

              <HStack pt={2}>
                <Button colorPalette="red" size="sm" loading={loading} onClick={handleRegen}>
                  <FiRefreshCw /> Régénérer le Token Overlay
                </Button>
              </HStack>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    </Card.Root>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const emptySubscribe = () => () => {};

export default function SettingsPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<AllSettings>({});
  const [loading, setLoading] = useState(true);
  const origin = useSyncExternalStore(emptySubscribe, () => window.location.origin, () => "");
  const [twitchConnected, setTwitchConnected] = useState<boolean | null>(null);
  const [youtubeConnected, setYoutubeConnected] = useState<boolean | null>(
    null,
  );
  const [spotifyConnected, setSpotifyConnected] = useState<boolean | null>(
    null,
  );
  const [liveClientId, setLiveClientId] = useState("");

  const fetchSettings = useCallback(async () => {
    const [settingsRes, twitchRes, ytRes, spRes] = await Promise.all([
      fetch("/api/settings"),
      fetch("/api/twitch/connect"),
      fetch("/api/youtube/connect"),
      fetch("/api/spotify/status"),
    ]);
    const s = await settingsRes.json();
    const tw = await twitchRes.json();
    const yt = await ytRes.json();
    const sp = await spRes.json();

    setSettings(s);
    setLiveClientId(s.twitch?.clientId ?? "");
    setTwitchConnected(tw.connected);
    setYoutubeConnected(yt.connected);
    setSpotifyConnected(sp.connected);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchSettings().finally(() => setLoading(false));
    });
  }, [fetchSettings]);

  async function savePlatform(platform: string, values: PlatformSettings) {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, settings: values }),
    });
  }

  async function connectTwitch() {
    const res = await fetch("/api/twitch/connect", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toaster.create({ title: data.error ?? "Erreur", type: "error" });
    } else {
      toaster.create({ title: t('settings.twitchConnected'), type: "success" });
      setTwitchConnected(true);
    }
  }

  async function disconnectTwitch() {
    await fetch("/api/twitch/connect", { method: "DELETE" });
    setTwitchConnected(false);
    toaster.create({ title: t('settings.twitchDisconnected'), type: "info" });
  }

  async function connectYouTube() {
    const res = await fetch("/api/youtube/connect", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toaster.create({ title: data.error ?? "Erreur", type: "error" });
    } else {
      toaster.create({ title: t('settings.youtubeConnected'), type: "success" });
      setYoutubeConnected(true);
    }
  }

  async function disconnectYouTube() {
    await fetch("/api/youtube/connect", { method: "DELETE" });
    setYoutubeConnected(false);
    toaster.create({ title: t('settings.youtubeDisconnected'), type: "info" });
  }

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
      <Container maxW="4xl" py={10}>
        {/* Header */}
        <HStack mb={2} gap={3}>
          <Box
            p={2}
            bg="purple.100"
            _dark={{ bg: "purple.900", color: "purple.300" }}
            color="purple.600"
            borderRadius="lg"
          >
            <FiSettings size={24} />
          </Box>
          <Box>
            <Heading size="2xl">{t("settings.headerTitle")}</Heading>
            <Text color="gray.500" mt={1}>
              {t("settings.headerDesc")}
            </Text>
          </Box>
          <Button
            ml="auto"
            size="sm"
            variant="ghost"
            onClick={() => fetchSettings()}
          >
            <FiRefreshCw /> {t("settings.refreshBtn")}
          </Button>
        </HStack>

        <Separator mb={8} />

        <Tabs.Root defaultValue="twitch" variant="enclosed">
          <Tabs.List mb={6}>
            <Tabs.Trigger value="twitch">
              <FiTwitch /> Twitch
              {twitchConnected && (
                <Badge colorPalette="green" variant="solid" size="xs" ml={1}>
                  {t("settings.statusLive")}
                </Badge>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger value="youtube">
              <FiYoutube /> YouTube
              {youtubeConnected && (
                <Badge colorPalette="red" variant="solid" size="xs" ml={1}>
                  {t("settings.statusLive")}
                </Badge>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger value="spotify">
              <FiMusic /> Spotify
              {spotifyConnected && (
                <Badge colorPalette="green" variant="solid" size="xs" ml={1}>
                  {t("settings.statusConnected")}
                </Badge>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger value="security">
              <FiShield /> Sécurité &amp; Tokens
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="twitch">
            <VStack align="stretch" gap={6}>
              <PlatformCard
                platform="twitch"
                label="Twitch"
                icon={<FiTwitch />}
                color="purple"
                fields={getTwitchFields(t)}
                initialValues={settings.twitch ?? {}}
                onSave={savePlatform}
                connectStatus={twitchConnected}
                onConnect={connectTwitch}
                onDisconnect={disconnectTwitch}
                onValuesChange={(vals) => setLiveClientId(vals.clientId ?? "")}
              />
              <TwitchScopeHelper clientId={liveClientId} />
              <TwitchBroadcasterIdHelper />
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="youtube">
            <VStack align="stretch" gap={6}>
              <PlatformCard
                platform="youtube"
                label="YouTube"
                icon={<FiYoutube />}
                color="red"
                fields={getYoutubeFields(t)}
                initialValues={settings.youtube ?? {}}
                onSave={savePlatform}
                connectStatus={youtubeConnected}
                onConnect={connectYouTube}
                onDisconnect={disconnectYouTube}
              />
              <Card.Root
                border="1px dashed"
                borderColor="red.300"
                bg="red.50"
                _dark={{ bg: "red.950", borderColor: "red.700" }}
              >
                <Card.Body>
                  <Heading
                    size="xs"
                    mb={2}
                    color="red.700"
                    _dark={{ color: "red.300" }}
                  >
                    {t("settings.youtubeHelpTitle")}
                  </Heading>
                  <VStack
                    align="stretch"
                    gap={1}
                    fontSize="xs"
                    color="gray.600"
                    _dark={{ color: "gray.400" }}
                  >
                    <Text>{t("settings.youtubeHelp1")}</Text>
                    <Text>{t("settings.youtubeHelp2")}</Text>
                    <Text>{t("settings.youtubeHelp3")}</Text>
                    <Text>{t("settings.youtubeHelp4")}</Text>
                    <Text>{t("settings.youtubeHelp5")}</Text>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="spotify">
            <VStack align="stretch" gap={6}>
              <PlatformCard
                platform="spotify"
                label="Spotify"
                icon={<FiMusic />}
                color="green"
                fields={getSpotifyFields(t)}
                initialValues={settings.spotify ?? {}}
                onSave={savePlatform}
                connectStatus={spotifyConnected}
                onConnect={async () => {
                  window.location.href = "/api/spotify/login";
                }}
                onDisconnect={async () => {
                  await fetch("/api/spotify/status", { method: "DELETE" });
                  setSpotifyConnected(false);
                  toaster.create({ title: t("settings.spotifyDisconnected"), type: "info" });
                }}
              />
              <SpotifyHelpHelper origin={origin} />
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="security">
            <VStack align="stretch" gap={6}>
              <SecurityCard
                overlayToken={settings.system?.overlayToken ?? ""}
                onRegenerateToken={async () => {
                  const res = await fetch("/api/settings/token", { method: "POST" });
                  if (res.ok) {
                    const data = await res.json();
                    setSettings((prev) => ({
                      ...prev,
                      system: {
                        ...prev.system,
                        overlayToken: data.overlayToken,
                      },
                    }));
                  } else {
                    throw new Error("Failed to regenerate token");
                  }
                }}
              />
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </Container>
    </Box>
  );
}
