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
import { FaDiscord, FaCopy, FaPlay } from "react-icons/fa";

export default function DiscordCustomizePage() {
  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [alertDuration, setAlertDuration] = useState(8);
  const [maxMediaHeight, setMaxMediaHeight] = useState(350);
  const [borderColor, setBorderColor] = useState("#5865F2");

  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overlayToken, setOverlayToken] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);

    fetch("/api/discord/config")
      .then((res) => res.json())
      .then((data) => {
        setBotToken(data.botToken || "");
        setChannelId(data.channelId || "");
        if (data.alertDuration) setAlertDuration(Number(data.alertDuration));
        if (data.maxMediaHeight) setMaxMediaHeight(Number(data.maxMediaHeight));
        if (data.borderColor) setBorderColor(data.borderColor);
      });

    fetch("/api/discord/connect")
      .then((res) => res.json())
      .then((data) => setIsConnected(data.connected));

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.system?.overlayToken) {
          setOverlayToken(data.system.overlayToken);
        }
      });
  }, []);

  const handleSaveAndConnect = async () => {
    setLoading(true);
    try {
      await fetch("/api/discord/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, channelId, alertDuration, maxMediaHeight, borderColor }),
      });

      const res = await fetch("/api/discord/connect", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsConnected(true);
        toaster.create({ title: "Bot Discord sauvegarde et connecte ! 🎉", type: "success" });
      } else {
        toaster.create({ title: data.error || "Erreur de connexion Discord", type: "error" });
      }
    } catch {
      toaster.create({ title: "Erreur lors de la sauvegarde", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch("/api/discord/connect", { method: "DELETE" });
    setIsConnected(false);
    toaster.create({ title: "Bot Discord deconnecte", type: "info" });
  };

  const obsUrl = `${origin}/discord-overlay${overlayToken ? `?token=${overlayToken}` : ""}`;

  const copyObsUrl = () => {
    navigator.clipboard.writeText(obsUrl);
    toaster.create({ title: "Lien OBS copie dans le presse-papier !", type: "success" });
  };

  return (
    <Box minH="100vh" bg="#0B0C10" color="#FFFFFF">
      <Container maxW="container.lg" py={8}>
        <VStack align="stretch" gap={6}>
          <Heading size="xl" display="flex" alignItems="center" gap={3}>
            <FaDiscord color="#5865F2" /> Configuration Bot & Overlay Media Discord
          </Heading>
          <Text color="gray.400">
            Associez votre Bot Discord et specifiez l&apos;ID du canal. Lorsqu&apos;un membre y postera un texte, une image, un GIF, une video ou un son, une alerte animee apparaitra sur OBS !
          </Text>

          {/* OBS Source Link Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(88, 101, 242, 0.3)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={3}>
              <Heading size="md" color="#5865F2">
                URL Source Navigateur OBS
              </Heading>
              <Text fontSize="sm" color="gray.300">
                Copiez ce lien unique pour votre compte et ajoutez-le comme Source Navigateur dans OBS Studio (Taille recommandee: 800x600).
              </Text>
              <HStack>
                <Input value={obsUrl} readOnly bg="#1F2330" border="none" color="white" />
                <Button colorPalette="purple" onClick={copyObsUrl}>
                  <FaCopy /> Copier
                </Button>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Display Customization Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(255,255,255,0.1)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <Heading size="md">🎨 Personnalisation Visuelle de l&apos;Alerte</Heading>

              <HStack gap={4}>
                <Field.Root flex={1}>
                  <Field.Label>Duree d&apos;Affichage (secondes)</Field.Label>
                  <Input type="number" value={alertDuration} onChange={(e) => setAlertDuration(Number(e.target.value))} bg="#1F2330" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Hauteur Max Media (px)</Field.Label>
                  <Input type="number" value={maxMediaHeight} onChange={(e) => setMaxMediaHeight(Number(e.target.value))} bg="#1F2330" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Couleur Bordure Alerte</Field.Label>
                  <Input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} bg="#1F2330" h="40px" />
                </Field.Root>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Credentials Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(255,255,255,0.1)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <Heading size="md">🔑 Identifiants du Bot Discord</Heading>

              <Field.Root>
                <Field.Label>Token du Bot Discord</Field.Label>
                <Input
                  type="password"
                  placeholder="MTA5ODc2NTQzMjEwOTg3NjU0My..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  bg="#1F2330"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>ID du Canal Discord (Exemple: 1234567890123456789)</Field.Label>
                <Input
                  placeholder="1234567890123456789"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  bg="#1F2330"
                />
              </Field.Root>

              <HStack gap={4} pt={2}>
                <Button colorPalette="blue" loading={loading} onClick={handleSaveAndConnect}>
                  <FaPlay /> Enregistrer & Connecter le Bot
                </Button>
                {isConnected && (
                  <Button variant="outline" colorPalette="red" onClick={handleDisconnect}>
                    Deconnecter
                  </Button>
                )}
              </HStack>
            </VStack>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
}
