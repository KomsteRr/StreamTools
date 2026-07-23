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
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import { FaDiscord, FaCopy, FaPlay, FaSync } from "react-icons/fa";

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

  const handleRegenToken = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir régénérer votre token de sécurité ? Tous vos anciens liens OBS et de modération cesseront de fonctionner et devront être mis à jour.")) {
      return;
    }
    try {
      const res = await fetch("/api/settings/token", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setOverlayToken(data.overlayToken);
        toaster.create({ title: "Nouveau Token de sécurité généré avec succès !", type: "success" });
      }
    } catch {
      toaster.create({ title: "Erreur lors de la régénération du token", type: "error" });
    }
  };

  return (
    <Box minH="100vh" bg="#0B0C10" color="#FFFFFF">
      <Container maxW="container.lg" py={8}>
        <VStack align="stretch" gap={6}>
          <Heading size="xl" display="flex" alignItems="center" gap={3}>
            <FaDiscord color="#5865F2" /> Configuration du Live Chat
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

          {/* Queue Moderation Link Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(16, 185, 129, 0.3)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={3}>
              <HStack justify="space-between">
                <Heading size="md" color="#10B981">
                  📋 Lien de Modération de la File d&apos;Attente (Modérateurs)
                </Heading>
                <Button size="xs" variant="outline" colorPalette="red" onClick={handleRegenToken}>
                  <FaSync /> Régénérer Token
                </Button>
              </HStack>
              <Text fontSize="sm" color="gray.300">
                Transmettez ce lien à vos modérateurs pour qu&apos;ils puissent visualiser la file et supprimer des vidéos ou médias en direct sans avoir besoin d&apos;un compte administrateur.
              </Text>
              <HStack>
                <Input value={`${origin}/discord-queue${overlayToken ? `?token=${overlayToken}` : ""}`} readOnly bg="#1F2330" border="none" color="white" />
                <Button colorPalette="green" onClick={() => {
                  navigator.clipboard.writeText(`${origin}/discord-queue${overlayToken ? `?token=${overlayToken}` : ""}`);
                  toaster.create({ title: "Lien de modération copié !", type: "success" });
                }}>
                  <FaCopy /> Copier Lien
                </Button>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Display Customization Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(255,255,255,0.1)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <Heading size="md">🎨 Personnalisation Visuelle de l&apos;Alerte</Heading>

              <HStack gap={4}>
                <Field label="Duree d'Affichage (secondes)" flex={1}>
                  <Input type="number" value={alertDuration} onChange={(e) => setAlertDuration(Number(e.target.value))} bg="#1F2330" />
                </Field>
                <Field label="Hauteur Max Media (px)" flex={1}>
                  <Input type="number" value={maxMediaHeight} onChange={(e) => setMaxMediaHeight(Number(e.target.value))} bg="#1F2330" />
                </Field>
                <Field label="Couleur Bordure Alerte" flex={1}>
                  <Input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} bg="#1F2330" h="40px" />
                </Field>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Credentials Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(255,255,255,0.1)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between" align="center">
                <Heading size="md">🔑 Identifiants du Bot Discord</Heading>
                <HStack gap={2}>
                  <Box
                    w={3}
                    h={3}
                    borderRadius="full"
                    bg={isConnected ? "green.400" : "red.400"}
                  />
                  <Text fontSize="sm" fontWeight="bold" color={isConnected ? "green.400" : "red.400"}>
                    {isConnected ? "Bot Connecté" : "Non Connecté"}
                  </Text>
                </HStack>
              </HStack>

              <Field
                label="Token du Bot Discord"
                helperText="Retrouvez ce token dans le Discord Developer Portal > Bot > Reset Token"
              >
                <Input
                  type="password"
                  placeholder="MTA5ODc2NTQzMjEwOTg3NjU0My..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  bg="#1F2330"
                />
              </Field>

              <Field
                label="ID du Canal Discord (Exemple: 1234567890123456789)"
                helperText="Activer le mode développeur sur Discord (Paramètres > Avancés), puis faites Clic Droit sur le salon > Copier l'identifiant du salon"
              >
                <Input
                  placeholder="1234567890123456789"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  bg="#1F2330"
                />
              </Field>

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

          {/* Guide Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(88, 101, 242, 0.2)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <Heading size="md" color="#5865F2">
                📘 Guide étape par étape : Comment créer & configurer votre Bot Discord
              </Heading>

              <VStack align="stretch" gap={3} fontSize="sm" color="gray.300">
                <Box p={3} bg="#1F2330" borderRadius="lg">
                  <Text fontWeight="bold" color="white" mb={1}>
                    1. Créer l&apos;application sur Discord
                  </Text>
                  <Text>
                    Rendez-vous sur le{" "}
                    <a
                      href="https://discord.com/developers/applications"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#5865F2", textDecoration: "underline" }}
                    >
                      Discord Developer Portal
                    </a>{" "}
                    et cliquez sur <strong>&quot;New Application&quot;</strong>. Donnez-lui un nom (ex: <i>Stream Bot</i>).
                  </Text>
                </Box>

                <Box p={3} bg="#1F2330" borderRadius="lg">
                  <Text fontWeight="bold" color="white" mb={1}>
                    2. Générer le Token du Bot
                  </Text>
                  <Text>
                    Allez dans l&apos;onglet <strong>Bot</strong> dans le menu de gauche, puis cliquez sur <strong>&quot;Reset Token&quot;</strong>. Copiez ce token secret et collez-le dans le champ &quot;Token du Bot Discord&quot; ci-dessus.
                  </Text>
                </Box>

                <Box p={3} bg="#1F2330" borderRadius="lg" borderLeft="4px solid #F59E0B">
                  <Text fontWeight="bold" color="orange.400" mb={1}>
                    3. Activer l&apos;Intention &quot;Message Content Intent&quot; ⚠️ (Indispensable)
                  </Text>
                  <Text>
                    Toujours dans l&apos;onglet <strong>Bot</strong>, faites défiler vers le bas jusqu&apos;à la section <strong>Privileged Gateway Intents</strong> et **activez l&apos;interrupteur &quot;Message Content Intent&quot;**. Sans cela, le bot ne pourra pas lire le texte ou les médias postés dans le salon.
                  </Text>
                </Box>

                <Box p={3} bg="#1F2330" borderRadius="lg">
                  <Text fontWeight="bold" color="white" mb={1}>
                    4. Inviter le Bot sur votre serveur Discord
                  </Text>
                  <Text mb={2}>
                    Allez dans <strong>OAuth2 &gt; URL Generator</strong>. Dans la section <strong>Scopes</strong>, cochez <code>bot</code>.
                  </Text>
                  <Text>
                    Dans <strong>Bot Permissions</strong>, cochez : <i>Read Messages/View Channels</i>, <i>Send Messages</i>, <i>Read Message History</i> et <strong><i>Manage Messages (Gérer les messages)</i></strong> (nécessaire pour la suppression automatique des messages postés). Copiez l&apos;URL générée en bas et ouvrez-la dans votre navigateur pour ajouter le bot à votre serveur.
                  </Text>
                </Box>

                <Box p={3} bg="#1F2330" borderRadius="lg">
                  <Text fontWeight="bold" color="white" mb={1}>
                    5. Obtenir l&apos;ID du Salon Discord
                  </Text>
                  <Text>
                    Sur votre application Discord, allez dans <strong>Paramètres utilisateur &gt; Avancés</strong> et activez le <strong>Mode Développeur</strong>. Ensuite, faites un clic droit sur le salon textuel dédié à vos alertes et cliquez sur <strong>&quot;Copier l&apos;identifiant du salon&quot;</strong>.
                  </Text>
                </Box>
              </VStack>
            </VStack>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
}
