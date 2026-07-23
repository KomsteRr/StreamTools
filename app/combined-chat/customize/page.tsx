"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Card,
  Field,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { FiMessageSquare, FiCopy, FiSave } from "react-icons/fi";
import { CombinedChatConfig } from "@/lib/combined-chat-config";
import { renderEmotedText } from "@/lib/emoteParser";

export default function CombinedChatCustomizePage() {
  const [config, setConfig] = useState<CombinedChatConfig>({
    fontSize: 14,
    maxMessages: 30,
    showAvatars: true,
    showBadges: true,
    backgroundColor: "rgba(15, 15, 20, 0.8)",
    textColor: "#ffffff",
    chatWidth: 450,
  });

  const [sevenTvEmotes, setSevenTvEmotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [overlayToken, setOverlayToken] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);

    fetch("/api/chat/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.fontSize) setConfig(data);
      });

    fetch("/api/twitch/7tv-emotes")
      .then((res) => res.json())
      .then((data) => {
        setSevenTvEmotes(data);
      })
      .catch(() => {});

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.system?.overlayToken) {
          setOverlayToken(data.system.overlayToken);
        }
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/chat/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      toaster.create({ title: "Configuration du chat sauvegardee !", type: "success" });
    } catch {
      toaster.create({ title: "Erreur lors de la sauvegarde", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const realObsUrl = `${origin}/combined-chat-overlay${overlayToken ? `?token=${overlayToken}` : ""}`;

  const copyObsUrl = () => {
    navigator.clipboard.writeText(realObsUrl);
    toaster.create({ title: "Lien OBS du Chat copie !", type: "success" });
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }} color="gray.900">
      <Container maxW="container.lg" py={8}>
        <VStack align="stretch" gap={6}>
          <Heading size="xl" display="flex" alignItems="center" gap={3}>
            <FiMessageSquare color="#9146FF" /> Chat Multi-plateforme (Twitch + YouTube + Discord)
          </Heading>
          <Text color="gray.400">
            Regroupez les messages en direct de Twitch, YouTube et Discord dans un seul et meme chat transparent pour OBS.
          </Text>

          {/* OBS Link Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(145, 70, 255, 0.3)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={3}>
              <Heading size="md" color="#9146FF">URL Source Navigateur OBS</Heading>
              <Text fontSize="sm" color="gray.300">
                Copiez ce lien personnalise et ajoutez-le comme Source Navigateur dans OBS Studio (Taille recommandee: 500x700).
              </Text>
              <HStack>
                <Input value={realObsUrl} readOnly bg="#1F2330" border="none" color="white" />
                <Button colorPalette="purple" onClick={copyObsUrl}><FiCopy /> Copier</Button>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Live Preview */}
          <Card.Root bg="#12141D" p={6} borderRadius="xl">
            <VStack align="stretch" gap={3}>
              <Text fontWeight="bold" color="white">Apercu du Chat :</Text>
              <Box
                w={`${config.chatWidth}px`}
                maxW="100%"
                p={4}
                borderRadius="14px"
                bg={config.backgroundColor}
                border="1px solid rgba(255,255,255,0.1)"
              >
                <HStack gap={3} align="flex-start">
                  {config.showAvatars && (
                    <Box w="24px" h="24px" borderRadius="full" bg="#9146FF" display="flex" alignItems="center" justifyContent="center" fontSize="10px" color="white" fontWeight="bold">
                      TW
                    </Box>
                  )}
                  <Box>
                    <HStack gap={2}>
                      <Text fontWeight="bold" fontSize={`${config.fontSize}px`} color="#9146FF">
                        StreamerFan
                      </Text>
                      {config.showBadges && <Text fontSize="10px" bg="#9146FF" px={1.5} py={0.5} borderRadius="md" color="white">Twitch</Text>}
                    </HStack>
                    <Text fontSize={`${config.fontSize}px`} color={config.textColor}>
                      {renderEmotedText("Super live ! Trop cool les nouveaux overlays KEKW 🔥", sevenTvEmotes)}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </VStack>
          </Card.Root>

          {/* Settings Form */}
          <Card.Root bg="#12141D" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <Heading size="md" color="white">Options d&apos;Affichage du Chat</Heading>

              <HStack gap={4}>
                <Field.Root flex={1}>
                  <Field.Label>Taille du Texte (px)</Field.Label>
                  <Input type="number" value={config.fontSize} onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) })} bg="#1F2330" color="white" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Largeur Max du Chat (px)</Field.Label>
                  <Input type="number" value={config.chatWidth} onChange={(e) => setConfig({ ...config, chatWidth: Number(e.target.value) })} bg="#1F2330" color="white" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Messages Max Affiches</Field.Label>
                  <Input type="number" value={config.maxMessages} onChange={(e) => setConfig({ ...config, maxMessages: Number(e.target.value) })} bg="#1F2330" color="white" />
                </Field.Root>
              </HStack>

              <HStack gap={4}>
                <Field.Root flex={1}>
                  <Field.Label>Couleur du Texte</Field.Label>
                  <Input type="color" value={config.textColor} onChange={(e) => setConfig({ ...config, textColor: e.target.value })} bg="#1F2330" h="40px" />
                </Field.Root>
              </HStack>

              <HStack gap={4} pt={2}>
                <Button
                  variant={config.showAvatars ? "solid" : "outline"}
                  colorPalette={config.showAvatars ? "purple" : "gray"}
                  onClick={() => setConfig({ ...config, showAvatars: !config.showAvatars })}
                >
                  {config.showAvatars ? "Afficher Avatars: Oui" : "Afficher Avatars: Non"}
                </Button>
                <Button
                  variant={config.showBadges ? "solid" : "outline"}
                  colorPalette={config.showBadges ? "green" : "gray"}
                  onClick={() => setConfig({ ...config, showBadges: !config.showBadges })}
                >
                  {config.showBadges ? "Afficher Badges Plateforme: Oui" : "Afficher Badges: Non"}
                </Button>
              </HStack>

              <Button colorPalette="purple" size="lg" loading={loading} onClick={handleSave} mt={4}>
                <FiSave /> Sauvegarder les Parametres
              </Button>
            </VStack>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
}
