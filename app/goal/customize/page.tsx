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
  Badge,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { FaFlag, FaCopy, FaSave, FaTwitch, FaYoutube, FaEdit, FaLock, FaUnlock } from "react-icons/fa";
import { GoalConfig } from "@/lib/goal-config";

export default function GoalCustomizePage() {
  const [config, setConfig] = useState<GoalConfig>({
    title: "Objectif Followers Twitch",
    currentAmount: 75,
    targetAmount: 100,
    goalType: "followers_twitch",
    customUnit: "Followers",
    barColor: "#9146FF",
    gradientColor: "#FF007A",
    fontFamily: "Inter",
    showPercentage: true,
    barHeight: 28,
    borderRadius: 14,
    backgroundColor: "rgba(18, 18, 24, 0.85)",
    textColor: "#ffffff",
    fontSize: 16,
    pulseAnimation: true,
    confettiEnabled: true,
    confettiDuration: 5,
  });

  const [loading, setLoading] = useState(false);
  const [overlayToken, setOverlayToken] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/goal/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.title) setConfig(data);
      });

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
      await fetch("/api/goal/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      toaster.create({ title: "Objectif sauvegarde avec succes !", type: "success" });
    } catch (e) {
      toaster.create({ title: "Erreur lors de la sauvegarde", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (type: GoalConfig["goalType"]) => {
    if (type === "followers_twitch") {
      setConfig((prev) => ({
        ...prev,
        goalType: "followers_twitch",
        title: "Objectif Followers Twitch",
        customUnit: "Followers",
        barColor: "#9146FF",
        gradientColor: "#FF007A",
      }));
    } else if (type === "subs_twitch") {
      setConfig((prev) => ({
        ...prev,
        goalType: "subs_twitch",
        title: "Objectif Subs Twitch",
        customUnit: "Subs",
        barColor: "#6441A5",
        gradientColor: "#00FFFF",
      }));
    } else if (type === "followers_youtube") {
      setConfig((prev) => ({
        ...prev,
        goalType: "followers_youtube",
        title: "Objectif Abonnés YouTube",
        customUnit: "Abonnés",
        barColor: "#FF0000",
        gradientColor: "#FF6B6B",
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        goalType: "custom",
        title: "Mon Objectif Perso",
        customUnit: "pts",
      }));
    }
  };

  const obsUrl = `${origin}/goal-overlay${overlayToken ? `?token=${overlayToken}` : ""}`;

  const copyObsUrl = () => {
    navigator.clipboard.writeText(obsUrl);
    toaster.create({ title: "Lien OBS copie !", type: "success" });
  };

  const percentage = Math.min(
    100,
    Math.round((config.currentAmount / Math.max(1, config.targetAmount)) * 100)
  );

  const isAutoSynced = config.goalType !== "custom";
  const unitDisplay = config.customUnit ? ` ${config.customUnit}` : "";

  return (
    <Box minH="100vh" bg="#0B0C10" color="#FFFFFF">
      <Container maxW="container.lg" py={8}>
        <VStack align="stretch" gap={6}>
          <Heading size="xl" display="flex" alignItems="center" gap={3}>
            <FaFlag color="#9146FF" /> Personnalisation Goal Bar Overlay
          </Heading>

          {/* OBS Source Link Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(145, 70, 255, 0.3)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={3}>
              <Heading size="md" color="#9146FF">URL Source Navigateur OBS</Heading>
              <Text fontSize="sm" color="gray.300">
                Lien unique personnalise pour votre compte utilisateur (Recommande: 650x120px) :
              </Text>
              <HStack>
                <Input value={obsUrl} readOnly bg="#1F2330" border="none" color="white" />
                <Button colorPalette="purple" onClick={copyObsUrl}><FaCopy /> Copier</Button>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Preset Selection Buttons */}
          <Card.Root bg="#12141D" p={6} borderRadius="xl">
            <VStack align="stretch" gap={3}>
              <Heading size="md" color="white">🎯 Pré-réglages de la Source d'Objectif</Heading>
              <Text color="gray.400" fontSize="sm">
                Choisissez une source automatique (Twitch / YouTube) ou passez en mode Manuel pour editer librement le chiffre :
              </Text>
              <HStack gap={3} flexWrap="wrap">
                <Button
                  variant={config.goalType === "followers_twitch" ? "solid" : "outline"}
                  colorPalette={config.goalType === "followers_twitch" ? "purple" : "gray"}
                  onClick={() => handlePresetSelect("followers_twitch")}
                >
                  <FaTwitch /> Twitch Followers
                </Button>
                <Button
                  variant={config.goalType === "subs_twitch" ? "solid" : "outline"}
                  colorPalette={config.goalType === "subs_twitch" ? "purple" : "gray"}
                  onClick={() => handlePresetSelect("subs_twitch")}
                >
                  <FaTwitch /> Twitch Subs
                </Button>
                <Button
                  variant={config.goalType === "followers_youtube" ? "solid" : "outline"}
                  colorPalette={config.goalType === "followers_youtube" ? "red" : "gray"}
                  onClick={() => handlePresetSelect("followers_youtube")}
                >
                  <FaYoutube /> YouTube Abonnés
                </Button>
                <Button
                  variant={config.goalType === "custom" ? "solid" : "outline"}
                  colorPalette={config.goalType === "custom" ? "yellow" : "gray"}
                  onClick={() => handlePresetSelect("custom")}
                >
                  <FaEdit /> Manuel / Personnalisé
                </Button>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Live Preview Card */}
          <Card.Root bg="#12141D" p={6} borderRadius="xl">
            <VStack align="stretch" gap={3}>
              <Text fontWeight="bold">Apercu en direct :</Text>
              <Box
                bg={config.backgroundColor}
                p={5}
                borderRadius={`${config.borderRadius}px`}
                border="1px solid rgba(255,255,255,0.15)"
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="800" fontSize={`${config.fontSize}px`} color={config.textColor}>
                    {config.title}
                  </Text>
                  <Text fontWeight="700" fontSize={`${config.fontSize}px`} color={config.textColor}>
                    {config.currentAmount}{unitDisplay} / {config.targetAmount}{unitDisplay} {config.showPercentage && `(${percentage}%)`}
                  </Text>
                </HStack>
                <Box
                  w="100%"
                  h={`${config.barHeight}px`}
                  bg="rgba(255,255,255,0.1)"
                  borderRadius={`${config.borderRadius}px`}
                  overflow="hidden"
                >
                  <Box
                    w={`${percentage}%`}
                    h="100%"
                    bg={`linear-gradient(90deg, ${config.barColor}, ${config.gradientColor})`}
                    borderRadius={`${config.borderRadius}px`}
                    transition="width 0.5s ease"
                    boxShadow={config.pulseAnimation ? `0 0 15px ${config.gradientColor}` : "none"}
                  />
                </Box>
              </Box>
            </VStack>
          </Card.Root>

          {/* Form Settings */}
          <Card.Root bg="#12141D" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <HStack gap={4}>
                <Field.Root flex={2}>
                  <Field.Label>Titre de l'Objectif</Field.Label>
                  <Input value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} bg="#1F2330" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Unité / Symbole (ex: €, Subs, pts)</Field.Label>
                  <Input value={config.customUnit} onChange={(e) => setConfig({ ...config, customUnit: e.target.value })} bg="#1F2330" placeholder="ex: Subs" />
                </Field.Root>
              </HStack>

              <HStack gap={4}>
                <Field.Root flex={1}>
                  <Field.Label display="flex" alignItems="center" gap={2}>
                    Valeur Actuelle {isAutoSynced ? <FaLock color="#9146FF" /> : <FaUnlock color="#FFD700" />}
                  </Field.Label>
                  <Input
                    type="number"
                    value={config.currentAmount}
                    onChange={(e) => setConfig({ ...config, currentAmount: Number(e.target.value) })}
                    disabled={isAutoSynced}
                    bg={isAutoSynced ? "#141720" : "#1F2330"}
                    opacity={isAutoSynced ? 0.7 : 1}
                  />
                  {isAutoSynced ? (
                    <Badge colorPalette="purple" variant="subtle" mt={1}>
                      🔒 Synchro auto (sélectionnez Manuel/Perso pour débloquer)
                    </Badge>
                  ) : (
                    <Badge colorPalette="yellow" variant="subtle" mt={1}>
                      ✏️ Édition manuelle activée
                    </Badge>
                  )}
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Objectif Cible</Field.Label>
                  <Input type="number" value={config.targetAmount} onChange={(e) => setConfig({ ...config, targetAmount: Number(e.target.value) })} bg="#1F2330" />
                </Field.Root>
              </HStack>

              <HStack gap={4}>
                <Field.Root flex={1}>
                  <Field.Label>Couleur Début</Field.Label>
                  <Input type="color" value={config.barColor} onChange={(e) => setConfig({ ...config, barColor: e.target.value })} bg="#1F2330" h="40px" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Couleur Fin (Gradient)</Field.Label>
                  <Input type="color" value={config.gradientColor} onChange={(e) => setConfig({ ...config, gradientColor: e.target.value })} bg="#1F2330" h="40px" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Couleur Texte</Field.Label>
                  <Input type="color" value={config.textColor} onChange={(e) => setConfig({ ...config, textColor: e.target.value })} bg="#1F2330" h="40px" />
                </Field.Root>
              </HStack>

              <HStack gap={4}>
                <Field.Root flex={1}>
                  <Field.Label>Hauteur de la Barre (px)</Field.Label>
                  <Input type="number" value={config.barHeight} onChange={(e) => setConfig({ ...config, barHeight: Number(e.target.value) })} bg="#1F2330" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Taille Texte (px)</Field.Label>
                  <Input type="number" value={config.fontSize} onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) })} bg="#1F2330" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Arrondi des Bords (px)</Field.Label>
                  <Input type="number" value={config.borderRadius} onChange={(e) => setConfig({ ...config, borderRadius: Number(e.target.value) })} bg="#1F2330" />
                </Field.Root>
              </HStack>

              {/* Confetti Controls */}
              <HStack gap={4} align="flex-end">
                <Button
                  variant={config.confettiEnabled ? "solid" : "outline"}
                  colorPalette={config.confettiEnabled ? "yellow" : "gray"}
                  onClick={() => setConfig({ ...config, confettiEnabled: !config.confettiEnabled })}
                >
                  {config.confettiEnabled ? "Confettis 100%: Activé 🎉" : "Confettis 100%: Désactivé"}
                </Button>

                {config.confettiEnabled && (
                  <Field.Root flex={1}>
                    <Field.Label>Durée des Confettis (secondes)</Field.Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={config.confettiDuration}
                      onChange={(e) => setConfig({ ...config, confettiDuration: Number(e.target.value) })}
                      bg="#1F2330"
                    />
                  </Field.Root>
                )}
              </HStack>

              <HStack gap={4} pt={2}>
                <Button
                  variant={config.showPercentage ? "solid" : "outline"}
                  colorPalette={config.showPercentage ? "purple" : "gray"}
                  onClick={() => setConfig({ ...config, showPercentage: !config.showPercentage })}
                >
                  {config.showPercentage ? "Afficher Pourcentage: Oui" : "Afficher Pourcentage: Non"}
                </Button>
                <Button
                  variant={config.pulseAnimation ? "solid" : "outline"}
                  colorPalette={config.pulseAnimation ? "pink" : "gray"}
                  onClick={() => setConfig({ ...config, pulseAnimation: !config.pulseAnimation })}
                >
                  {config.pulseAnimation ? "Effet Lumineux: Oui" : "Effet Lumineux: Non"}
                </Button>
              </HStack>

              <Button colorPalette="purple" size="lg" loading={loading} onClick={handleSave} mt={4}>
                <FaSave /> Sauvegarder l'Objectif
              </Button>
            </VStack>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
}
