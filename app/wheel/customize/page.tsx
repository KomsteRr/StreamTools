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
import { useTranslation } from "@/lib/i18n";

export default function WheelCustomizePage() {
  const { t } = useTranslation();
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
      toaster.create({ title: t("wheel.saveSuccess"), type: "success" });
    } catch {
      toaster.create({ title: t("wheel.saveError"), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSpinTest = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      await fetch("/api/wheel/spin", { method: "POST" });
    } catch {
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
      toaster.create({ title: t("wheel.minSegmentsWarning"), type: "warning" });
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
    toaster.create({ title: t("common.copied"), type: "success" });
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }} color="gray.900">
      <Container maxW="container.lg" py={8}>
        <VStack align="stretch" gap={6}>
          <HStack justify="space-between">
            <Heading size="xl" display="flex" alignItems="center" gap={3}>
              <FaSyncAlt color="#FFD000" /> {t("wheel.title")}
            </Heading>
            <Button colorPalette="yellow" size="lg" loading={spinning} onClick={handleSpinTest}>
              <FaPlay /> {t("wheel.spinBtn")}
            </Button>
          </HStack>

          {/* OBS Link Card */}
          <Card.Root bg="#12141D" border="1px solid rgba(255, 215, 0, 0.3)" p={6} borderRadius="xl">
            <VStack align="stretch" gap={3}>
              <Heading size="md" color="#FFD000">{t("wheel.obsUrlTitle")}</Heading>
              <Text fontSize="sm" color="gray.300">
                {t("wheel.obsUrlDesc")}
              </Text>
              <HStack>
                <Input value={realObsUrl} readOnly bg="#1F2330" border="none" color="white" />
                <Button colorPalette="purple" onClick={copyObsUrl}><FiCopy /> {t("common.copyBtn")}</Button>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Wheel Visual Customization */}
          <Card.Root bg="#12141D" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <Heading size="md" color="white">{t("wheel.optionsTitle")}</Heading>

              <HStack gap={4}>
                <Field.Root flex={1}>
                  <Field.Label>{t("wheel.wheelSize")}</Field.Label>
                  <Input type="number" value={config.wheelSize} onChange={(e) => setConfig({ ...config, wheelSize: Number(e.target.value) })} bg="#1F2330" color="white" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>{t("wheel.spinDuration")}</Field.Label>
                  <Input type="number" step="0.5" value={config.spinDuration} onChange={(e) => setConfig({ ...config, spinDuration: Number(e.target.value) })} bg="#1F2330" color="white" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>{t("wheel.winnerDuration")}</Field.Label>
                  <Input type="number" value={config.winnerDisplayDuration} onChange={(e) => setConfig({ ...config, winnerDisplayDuration: Number(e.target.value) })} bg="#1F2330" color="white" />
                </Field.Root>
              </HStack>

              <HStack gap={4}>
                <Field.Root flex={1}>
                  <Field.Label>{t("wheel.pointerColor")}</Field.Label>
                  <Input type="color" value={config.pointerColor} onChange={(e) => setConfig({ ...config, pointerColor: e.target.value })} bg="#1F2330" h="40px" />
                </Field.Root>
                <Field.Root flex={1}>
                  <Field.Label>{t("wheel.centerColor")}</Field.Label>
                  <Input type="color" value={config.centerColor} onChange={(e) => setConfig({ ...config, centerColor: e.target.value })} bg="#1F2330" h="40px" />
                </Field.Root>
              </HStack>

              <HStack gap={4} pt={2}>
                <Button
                  variant={config.confettiOnWin ? "solid" : "outline"}
                  colorPalette={config.confettiOnWin ? "yellow" : "gray"}
                  onClick={() => setConfig({ ...config, confettiOnWin: !config.confettiOnWin })}
                >
                  {t("wheel.confettiOnWin")} {config.confettiOnWin ? t("goal.yes") : t("goal.no")}
                </Button>
              </HStack>
            </VStack>
          </Card.Root>

          {/* Segments Config */}
          <Card.Root bg="#12141D" p={6} borderRadius="xl">
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <Heading size="md" color="white">{t("wheel.segmentsTitle")}</Heading>
                <Button size="sm" colorPalette="green" onClick={addSegment}><FaPlus /> {t("wheel.addSegment")}</Button>
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
                <FiSave /> {t("wheel.saveBtn")}
              </Button>
            </VStack>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
}
