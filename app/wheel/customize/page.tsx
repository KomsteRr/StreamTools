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
import { FiCopy, FiSave } from "react-icons/fi";
import { FaSyncAlt, FaPlus, FaTrash, FaPlay } from "react-icons/fa";
import { WheelConfig, WheelSegment } from "@/lib/wheel-config";

export default function WheelCustomizePage() {
  const [config, setConfig] = useState<WheelConfig>({
    title: "Roue des Defis Stream",
    segments: [
      { id: "1", label: "10 Pompes", color: "#FF5733" },
      { id: "2", label: "Imitation Bot", color: "#33FF57" },
      { id: "3", label: "Verre d'eau", color: "#3357FF" },
      { id: "4", label: "GG 50 Subs !", color: "#F333FF" },
      { id: "5", label: "Gagne 1 VIP", color: "#FFD700" },
      { id: "6", label: "Rejouer", color: "#00FFFF" },
    ],
    soundEnabled: true,
    wheelSize: 500,
    spinDuration: 4.5,
    pointerColor: "#FFD700",
    centerColor: "#1a1a2e",
    winnerDisplayDuration: 8,
    confettiOnWin: true,
  });

  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [overlayToken, setOverlayToken] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/wheel/config")
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
      await fetch("/api/wheel/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      toaster.create({ title: "Roue sauvegardee avec succes !", type: "success" });
    } catch (e) {
      toaster.create({ title: "Erreur lors de la sauvegarde", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSpinTest = async () => {
    setSpinning(true);
    try {
      const res = await fetch("/api/wheel/spin", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toaster.create({ title: `Roue lancee ! Resultat : ${data.segment.label}`, type: "success" });
      }
    } catch (e) {
      toaster.create({ title: "Erreur lors du lancer de la roue", type: "error" });
    } finally {
      setTimeout(() => setSpinning(false), (config.spinDuration || 4.5) * 1000);
    }
  };

  const addSegment = () => {
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FFD700", "#00FFFF"];
    const randomColor = colors[config.segments.length % colors.length];
    const newSeg: WheelSegment = {
      id: String(Date.now()),
      label: `Defi ${config.segments.length + 1}`,
      color: randomColor,
    };
    setConfig({ ...config, segments: [...config.segments, newSeg] });
  };

  const removeSegment = (id: string) => {
    if (config.segments.length <= 2) {
      toaster.create({ title: "Au moins 2 segments sont requis pour la roue !", type: "warning" });
      return;
    }
    setConfig({ ...config, segments: config.segments.filter((s) => s.id !== id) });
  };

  const updateSegment = (id: string, field: "label" | "color", val: string) => {
    setConfig({
      ...config,
      segments: config.segments.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
    });
  };

  const realObsUrl = `${origin}/wheel-overlay${overlayToken ? `?token=${overlayToken}` : ""}`;

  const copyObsUrl = () => {
    navigator.clipboard.writeText(realObsUrl);
    toaster.create({ title: "Lien OBS de la Roue copie !", type: "success" });
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }} color="gray.900">
      <Container maxW="container.lg" py={8}>
        <VStack align="stretch" gap={6}>
          <HStack justify="space-between">
            <Heading size="xl" display="flex" alignItems="center" gap={3}>
              <FaSyncAlt color="#FFD000" /> Roue de la Fortune Interactive
            </Heading>
            <Button colorPalette="yellow" size="lg" loading={spinning} onClick={handleSpinTest}>
              <FaPlay /> Lancer la Roue !
            </Button>
          </HStack>

          {/* OBS Link Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(255, 215, 0, 0.3)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={3}>
              <Heading size="md" color="#FFD000">URL Source Navigateur OBS</Heading>
              <Text fontSize="sm" color="gray.300">
                Copiez ce lien unique et ajoutez-le dans OBS Studio (Taille recommandee: 600x600).
              </Text>
              <HStack>
                <Input value={realObsUrl} readOnly bg="#1F2330" border="none" color="white" />
                <Button colorPalette="purple" onClick={copyObsUrl}><FiCopy /> Copier</Button>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Wheel Visual Customization */}
          <Card.Root bg="#12141D" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <Heading size="md" color="white">Options d'Animation & Apparence</Heading>

              <HStack gap={4}>
                <Field.Root flex={1}>
                  <Field.Label>Diametre de la Roue (px)</Field.Label>
                  <Input type="number" value={config.wheelSize} onChange={(e) => setConfig({ ...config, wheelSize: Number(e.target.value) })} bg="#1F2330" color="white" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Duree de Rotation (secondes)</Field.Label>
                  <Input type="number" step="0.5" value={config.spinDuration} onChange={(e) => setConfig({ ...config, spinDuration: Number(e.target.value) })} bg="#1F2330" color="white" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Duree Affichage Gagnant (sec)</Field.Label>
                  <Input type="number" value={config.winnerDisplayDuration} onChange={(e) => setConfig({ ...config, winnerDisplayDuration: Number(e.target.value) })} bg="#1F2330" color="white" />
                </Field.Root>
              </HStack>

              <HStack gap={4}>
                <Field.Root flex={1}>
                  <Field.Label>Couleur de la Fleche Pointeur</Field.Label>
                  <Input type="color" value={config.pointerColor} onChange={(e) => setConfig({ ...config, pointerColor: e.target.value })} bg="#1F2330" h="40px" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>Couleur du Centre</Field.Label>
                  <Input type="color" value={config.centerColor} onChange={(e) => setConfig({ ...config, centerColor: e.target.value })} bg="#1F2330" h="40px" />
                </Field.Root>
              </HStack>

              <HStack gap={4} pt={2}>
                <Button
                  variant={config.confettiOnWin ? "solid" : "outline"}
                  colorPalette={config.confettiOnWin ? "yellow" : "gray"}
                  onClick={() => setConfig({ ...config, confettiOnWin: !config.confettiOnWin })}
                >
                  {config.confettiOnWin ? "Confettis au Tirage: Oui" : "Confettis au Tirage: Non"}
                </Button>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Segments Config */}
          <Card.Root bg="#12141D" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <Heading size="md" color="white">Segments & Defis</Heading>
                <Button size="sm" colorPalette="green" onClick={addSegment}><FaPlus /> Ajouter un Defi</Button>
              </HStack>

              {config.segments.map((seg, idx) => (
                <HStack key={seg.id || idx} gap={3}>
                  <Input
                    type="color"
                    value={seg.color}
                    onChange={(e) => updateSegment(seg.id, "color", e.target.value)}
                    w="50px"
                    h="40px"
                    p={1}
                    bg="#1F2330"
                  />
                  <Input
                    value={seg.label}
                    onChange={(e) => updateSegment(seg.id, "label", e.target.value)}
                    bg="#1F2330"
                    color="white"
                    placeholder={`Defi ${idx + 1}`}
                  />
                  <Button colorPalette="red" variant="ghost" onClick={() => removeSegment(seg.id)}>
                    <FaTrash />
                  </Button>
                </HStack>
              ))}

              <Button colorPalette="yellow" size="lg" loading={loading} onClick={handleSave} mt={4}>
                <FiSave /> Sauvegarder la Roue
              </Button>
            </VStack>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
}
