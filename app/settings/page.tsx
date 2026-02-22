"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "react-icons/fi";
import { toaster, Toaster } from "@/components/ui/toaster";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlatformSettings {
  [key: string]: string;
}

interface AllSettings {
  twitch?: PlatformSettings;
  youtube?: PlatformSettings;
  kick?: PlatformSettings;
  spotify?: PlatformSettings;
}

// ─── Field definitions per platform ─────────────────────────────────────────

const TWITCH_FIELDS = [
  {
    key: "channelName",
    label: "Channel Name",
    hint: "Votre nom d'utilisateur Twitch (ex: komsterr)",
    type: "text",
  },
  {
    key: "botName",
    label: "Bot Name (Optionnel)",
    hint: "Nom d'utilisateur du compte Bot Twitch",
    type: "text",
  },
  {
    key: "botPassword",
    label: "Bot Password (Optionnel)",
    hint: "Token OAuth du bot (oauth:...)",
    type: "password",
  },

  {
    key: "broadcasterId",
    label: "Broadcaster ID",
    hint: "Votre ID numérique Twitch (ex: 12345678)",
    type: "text",
  },
  {
    key: "clientId",
    label: "Client ID",
    hint: "ID de votre application sur dev.twitch.tv",
    type: "text",
  },
  {
    key: "accessToken",
    label: "Access Token",
    hint: "Token OAuth avec scopes: channel:read:subscriptions, bits:read, moderator:read:followers",
    type: "password",
  },
];

const SPOTIFY_FIELDS = [
  {
    key: "clientId",
    label: "Client ID",
    hint: "Depuis developer.spotify.com",
    type: "text",
  },
  {
    key: "clientSecret",
    label: "Client Secret",
    hint: "Depuis developer.spotify.com",
    type: "password",
  },
];

const YOUTUBE_FIELDS = [
  {
    key: "channelId",
    label: "Channel ID",
    hint: "Votre Channel ID YouTube (ex: UCxxxxxxxx)",
    type: "text",
  },
  {
    key: "apiKey",
    label: "API Key",
    hint: "Clé API Google Cloud avec YouTube Data API v3 activé",
    type: "password",
  },
];

const KICK_FIELDS = [
  {
    key: "channelName",
    label: "Channel Name",
    hint: "Votre nom de chaîne Kick (pas d'API officielle pour l'instant)",
    type: "text",
  },
];

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
      toaster.create({ title: `${label} sauvegardé !`, type: "success" });
    } catch {
      toaster.create({ title: "Erreur lors de la sauvegarde", type: "error" });
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
                Paramètres de connexion
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
                {isConnected ? "🟢 Connecté" : "⚫ Déconnecté"}
              </Badge>
              {isConnected ? (
                <Button
                  size="xs"
                  colorPalette="red"
                  variant="outline"
                  loading={connecting}
                  onClick={handleDisconnect}
                >
                  <FiWifiOff /> Déconnecter
                </Button>
              ) : (
                <Button
                  size="xs"
                  colorPalette="green"
                  variant="outline"
                  loading={connecting}
                  onClick={handleConnect}
                >
                  <FiWifi /> Connecter
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
              colorPalette={color}
              loading={saving}
              onClick={handleSave}
            >
              <FiSave /> Sauvegarder
            </Button>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ─── Twitch scopes helper ─────────────────────────────────────────────────────

function TwitchScopeHelper({ clientId }: { clientId: string }) {
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
          🔑 Comment obtenir un Access Token Twitch
        </Heading>
        <VStack
          align="stretch"
          gap={3}
          fontSize="xs"
          color="gray.600"
          _dark={{ color: "gray.400" }}
        >
          <Text>
            1. Créez une app sur <strong>dev.twitch.tv/console</strong> → copiez
            votre <strong>Client ID</strong> et collez-le dans le champ
            ci-dessus.
          </Text>

          <Text>
            2. Cliquez sur le lien ci-dessous pour autoriser votre app :
          </Text>

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
                {copied ? "Copié !" : "Copier l'URL"}
              </Button>
              {hasClientId && (
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="purple"
                  asChild
                >
                  <a href={oauthUrl} target="_blank" rel="noopener noreferrer">
                    <FiExternalLink /> Ouvrir
                  </a>
                </Button>
              )}
            </HStack>
          </Box>

          {!hasClientId && (
            <Text color="orange.500" fontStyle="italic">
              ⬆️ Entrez d'abord votre Client ID dans le formulaire ci-dessus.
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
              ℹ️ Message "You are about to leave Twitch" ?
            </Text>
            <Text mt={1}>
              C'est <strong>normal</strong> — Twitch vous avertit que vous allez
              être redirigé vers <code>localhost</code>. Cliquez{" "}
              <strong>Continue</strong>. Après redirection, copiez le paramètre{" "}
              <code>access_token=...</code>
              depuis l'URL de votre navigateur.
            </Text>
          </Box>

          <Text>
            3. Collez le token dans le champ <strong>Access Token</strong>{" "}
            ci-dessus et cliquez <strong>Sauvegarder</strong>.
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ─── Twitch Broadcaster ID helper ────────────────────────────────────────────

function TwitchBroadcasterIdHelper() {
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
          🆔 Comment trouver votre Broadcaster ID
        </Heading>
        <VStack
          align="stretch"
          gap={2}
          fontSize="xs"
          color="gray.600"
          _dark={{ color: "gray.400" }}
        >
          <Text fontWeight="semibold">
            Option 1 — Outil en ligne (le plus rapide) :
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
          <Text>
            Tapez votre pseudo → l'ID numérique s'affiche instantanément.
          </Text>

          <Text fontWeight="semibold" mt={1}>
            Option 2 — Via l'API (avec votre token) :
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
            curl -H "Authorization: Bearer VOTRE_TOKEN" -H "Client-Id:
            VOTRE_CLIENT_ID"
            "https://api.twitch.tv/helix/users?login=VOTRE_PSEUDO"
          </Box>
          <Text>
            La réponse JSON contient <code>{'"id"'}</code> — c'est votre
            Broadcaster ID.
          </Text>

          <Text fontSize="xs" color="gray.400" mt={1}>
            ℹ️ C'est un nombre entier, ex: <strong>123456789</strong>. Il ne
            change jamais.
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<AllSettings>({});
  const [loading, setLoading] = useState(true);
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
    fetchSettings().finally(() => setLoading(false));
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
      toaster.create({ title: "Twitch connecté ! 🎉", type: "success" });
      setTwitchConnected(true);
    }
  }

  async function disconnectTwitch() {
    await fetch("/api/twitch/connect", { method: "DELETE" });
    setTwitchConnected(false);
    toaster.create({ title: "Twitch déconnecté", type: "info" });
  }

  async function connectYouTube() {
    const res = await fetch("/api/youtube/connect", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toaster.create({ title: data.error ?? "Erreur", type: "error" });
    } else {
      toaster.create({ title: "YouTube connecté ! 🎉", type: "success" });
      setYoutubeConnected(true);
    }
  }

  async function disconnectYouTube() {
    await fetch("/api/youtube/connect", { method: "DELETE" });
    setYoutubeConnected(false);
    toaster.create({ title: "YouTube déconnecté", type: "info" });
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
            <Heading size="2xl">⚙️ Paramètres Globaux</Heading>
            <Text color="gray.500" mt={1}>
              Connexions aux plateformes de streaming
            </Text>
          </Box>
          <Button
            ml="auto"
            size="sm"
            variant="ghost"
            onClick={() => fetchSettings()}
          >
            <FiRefreshCw /> Rafraîchir
          </Button>
        </HStack>

        <Separator mb={8} />

        <Tabs.Root defaultValue="twitch" variant="enclosed">
          <Tabs.List mb={6}>
            <Tabs.Trigger value="twitch">
              <FiTwitch /> Twitch
              {twitchConnected && (
                <Badge colorPalette="green" variant="solid" size="xs" ml={1}>
                  Live
                </Badge>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger value="youtube">
              <FiYoutube /> YouTube
              {youtubeConnected && (
                <Badge colorPalette="red" variant="solid" size="xs" ml={1}>
                  Live
                </Badge>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger value="spotify">
              <FiMusic /> Spotify
              {spotifyConnected && (
                <Badge colorPalette="green" variant="solid" size="xs" ml={1}>
                  Connecté
                </Badge>
              )}
            </Tabs.Trigger>
            {/* <Tabs.Trigger value="kick">🎮 Kick</Tabs.Trigger> */}
          </Tabs.List>

          <Tabs.Content value="twitch">
            <VStack align="stretch" gap={6}>
              <PlatformCard
                platform="twitch"
                label="Twitch"
                icon={<FiTwitch />}
                color="purple"
                fields={TWITCH_FIELDS}
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
                fields={YOUTUBE_FIELDS}
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
                    📺 Comment configurer YouTube
                  </Heading>
                  <VStack
                    align="stretch"
                    gap={1}
                    fontSize="xs"
                    color="gray.600"
                    _dark={{ color: "gray.400" }}
                  >
                    <Text>
                      1. Allez sur <strong>console.cloud.google.com</strong>
                    </Text>
                    <Text>
                      2. Créez un projet → Activez{" "}
                      <strong>YouTube Data API v3</strong>
                    </Text>
                    <Text>3. Créez une clé API → collez-la ci-dessus</Text>
                    <Text>
                      4. Trouvez votre Channel ID dans YouTube Studio →
                      Paramètres → Infos sur la chaîne
                    </Text>
                    <Text>
                      5. Lancez votre live, puis cliquez{" "}
                      <strong>Connecter</strong>
                    </Text>
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
                fields={SPOTIFY_FIELDS}
                initialValues={settings.spotify ?? {}}
                onSave={savePlatform}
                connectStatus={spotifyConnected}
                onConnect={async () => {
                  window.location.href = "/api/spotify/login";
                }}
                onDisconnect={async () => {}}
              />
            </VStack>
          </Tabs.Content>

          {/* <Tabs.Content value="kick">
            <PlatformCard
              platform="kick"
              label="Kick"
              icon={<span>🎮</span>}
              color="green"
              fields={KICK_FIELDS}
              initialValues={settings.kick ?? {}}
              onSave={savePlatform}
              connectStatus={null}
              onConnect={async () => {}}
              onDisconnect={async () => {}}
            />
            <Box
              mt={4}
              p={4}
              bg="orange.50"
              _dark={{ bg: "orange.950", borderColor: "orange.700" }}
              borderRadius="lg"
              border="1px dashed"
              borderColor="orange.300"
            >
              <Text
                fontSize="xs"
                color="orange.700"
                _dark={{ color: "orange.300" }}
              >
                ⚠️ Kick n'a pas encore d'API officielle publique. La connexion
                automatique n'est pas disponible pour l'instant. Vous pouvez
                utiliser le bouton test manuel sur la page Alertes.
              </Text>
            </Box>
          </Tabs.Content> */}
        </Tabs.Root>
      </Container>
    </Box>
  );
}
