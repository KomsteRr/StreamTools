"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  Badge,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import {
  FaDiscord,
  FaTrash,
  FaYoutube,
  FaVideo,
  FaImage,
  FaVolumeUp,
  FaFileAlt,
  FaSync,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toaster, Toaster } from "@/components/ui/toaster";

interface DiscordMediaAlert {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaType: "image" | "gif" | "video" | "audio" | "youtube" | "text";
  mediaUrl?: string;
  timestamp: number;
}

const emptySubscribe = () => () => {};

export default function DiscordQueuePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [queue, setQueue] = useState<DiscordMediaAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const fetchQueue = useCallback(async () => {
    try {
      const url = token ? `/api/discord/queue?token=${token}` : `/api/discord/queue`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue || []);
      }
    } catch {
      console.error("Error fetching queue");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!mounted) return;
    fetchQueue();
  }, [mounted, fetchQueue]);

  // Real-time SSE subscription
  useEffect(() => {
    if (!mounted) return;
    const streamUrl = token ? `/api/discord/stream?token=${token}` : `/api/discord/stream`;
    const es = new EventSource(streamUrl);

    es.addEventListener("media-alert", (event) => {
      try {
        const alert: DiscordMediaAlert = JSON.parse(event.data);
        setQueue((prev) => [alert, ...prev.filter((i) => i.id !== alert.id)]);
      } catch {}
    });

    es.addEventListener("queue-update", (event) => {
      try {
        const updatedQueue: DiscordMediaAlert[] = JSON.parse(event.data);
        setQueue(updatedQueue);
      } catch {}
    });

    es.addEventListener("media-delete", (event) => {
      try {
        const { id } = JSON.parse(event.data);
        setQueue((prev) => prev.filter((item) => item.id !== id));
      } catch {}
    });

    return () => {
      es.close();
    };
  }, [mounted, token]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const url = token ? `/api/discord/queue?token=${token}&id=${id}` : `/api/discord/queue?id=${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setQueue((prev) => prev.filter((item) => item.id !== id));
        toaster.create({ title: "Élément supprimé de la file !", type: "success" });
      } else {
        toaster.create({ title: "Erreur lors de la suppression", type: "error" });
      }
    } catch {
      toaster.create({ title: "Erreur lors de la suppression", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const url = token ? `/api/discord/queue?token=${token}&clear=true` : `/api/discord/queue?clear=true`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setQueue([]);
        toaster.create({ title: "File d'attente vidée !", type: "success" });
      }
    } catch {
      toaster.create({ title: "Erreur lors du vidage de la file", type: "error" });
    } finally {
      setClearing(false);
    }
  };

  const getMediaBadge = (type: string) => {
    switch (type) {
      case "youtube":
        return <Badge colorPalette="red" display="flex" alignItems="center" gap={1} px={2} py={1}><FaYoutube /> YouTube</Badge>;
      case "video":
        return <Badge colorPalette="purple" display="flex" alignItems="center" gap={1} px={2} py={1}><FaVideo /> Vidéo</Badge>;
      case "gif":
        return <Badge colorPalette="pink" display="flex" alignItems="center" gap={1} px={2} py={1}><FaImage /> GIF</Badge>;
      case "image":
        return <Badge colorPalette="blue" display="flex" alignItems="center" gap={1} px={2} py={1}><FaImage /> Image</Badge>;
      case "audio":
        return <Badge colorPalette="orange" display="flex" alignItems="center" gap={1} px={2} py={1}><FaVolumeUp /> Audio</Badge>;
      default:
        return <Badge colorPalette="gray" display="flex" alignItems="center" gap={1} px={2} py={1}><FaFileAlt /> Texte</Badge>;
    }
  };

  if (!mounted) return null;

  return (
    <Box minH="100vh" bg="#0B0C10" color="#FFFFFF" py={8} px={4}>
      <Toaster />
      <Container maxW="container.md">
        <VStack align="stretch" gap={6}>
          {/* Header */}
          <Card.Root bg="#12141D" border="1px solid rgba(88, 101, 242, 0.3)" p={6} borderRadius="xl">
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack gap={3}>
                <Box p={3} borderRadius="lg" bg="rgba(88, 101, 242, 0.15)">
                  <FaDiscord size={28} color="#5865F2" />
                </Box>
                <Box>
                  <Heading size="lg" color="white">Modération File Discord</Heading>
                  <Text fontSize="xs" color="gray.400">
                    Écoutez, prévisualisez et gérez les médias en temps réel ({queue.length} en attente)
                  </Text>
                </Box>
              </HStack>

              <HStack gap={2}>
                <Button size="sm" variant="outline" colorPalette="blue" onClick={fetchQueue}>
                  <FaSync /> Actualiser
                </Button>
                {queue.length > 0 && (
                  <Button size="sm" colorPalette="red" loading={clearing} onClick={handleClearAll}>
                    <FaTrash /> Vider Tout
                  </Button>
                )}
              </HStack>
            </Flex>
          </Card.Root>

          {/* Loading */}
          {loading && (
            <Flex justify="center" py={12}>
              <Spinner size="xl" color="#5865F2" />
            </Flex>
          )}

          {/* Empty State */}
          {!loading && queue.length === 0 && (
            <Card.Root bg="#12141D" border="1px solid rgba(255,255,255,0.08)" p={10} borderRadius="xl" textAlign="center">
              <VStack gap={3} align="center">
                <FaExclamationTriangle size={36} color="#5865F2" />
                <Heading size="md" color="white">Aucun média en attente</Heading>
                <Text fontSize="sm" color="gray.400" maxW="400px">
                  Dès qu&apos;un membre postera une vidéo, un GIF ou une image dans le canal Discord configuré, il apparaîtra immédiatement ici !
                </Text>
              </VStack>
            </Card.Root>
          )}

          {/* Queue Items */}
          {!loading && queue.map((item) => (
            <Card.Root key={item.id} bg="#12141D" border="1px solid rgba(255,255,255,0.1)" p={5} borderRadius="xl">
              <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "stretch", sm: "flex-start" }} gap={4}>
                {/* Left Section: Author info & media detail */}
                <HStack gap={4} align="flex-start" flex={1}>
                  {item.authorAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.authorAvatar}
                      alt={item.authorName}
                      style={{ width: "42px", height: "42px", borderRadius: "50%", border: "2px solid #5865F2", flexShrink: 0 }}
                    />
                  ) : (
                    <Box w="42px" h="42px" borderRadius="full" bg="#5865F2" display="flex" alignItems="center" justifyContent="center" fontWeight="bold" flexShrink={0}>
                      {item.authorName.charAt(0)}
                    </Box>
                  )}

                  <VStack align="stretch" gap={2} flex={1}>
                    <HStack gap={2} wrap="wrap">
                      <Text fontWeight="bold" color="white" fontSize="md">{item.authorName}</Text>
                      {getMediaBadge(item.mediaType)}
                      <Text fontSize="xs" color="gray.500">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </HStack>

                    {item.content && (
                      <Text fontSize="sm" color="gray.200" wordBreak="break-word" fontWeight="500">
                        {item.content}
                      </Text>
                    )}

                    {/* Interactive Video & Audio Preview Player for Moderators */}
                    {item.mediaType === "youtube" && item.mediaUrl && (
                      <Box mt={2} borderRadius="lg" overflow="hidden" maxW="100%" w="360px">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${item.mediaUrl}?controls=1&autoplay=0`}
                          title="Preview YouTube Video"
                          style={{ width: "100%", height: "200px", border: "none", borderRadius: "8px" }}
                          allow="autoplay; encrypted-media; fullscreen"
                        />
                      </Box>
                    )}

                    {item.mediaType === "video" && item.mediaUrl && (
                      <Box mt={2} borderRadius="lg" overflow="hidden" maxW="100%" w="360px">
                        <video
                          src={item.mediaUrl}
                          controls
                          playsInline
                          style={{ width: "100%", maxHeight: "240px", borderRadius: "8px", background: "#000" }}
                        />
                      </Box>
                    )}

                    {item.mediaType === "audio" && item.mediaUrl && (
                      <Box mt={2} maxW="100%" w="360px">
                        <audio
                          src={item.mediaUrl}
                          controls
                          style={{ width: "100%" }}
                        />
                      </Box>
                    )}

                    {(item.mediaType === "image" || item.mediaType === "gif") && item.mediaUrl && (
                      <Box mt={2} borderRadius="lg" overflow="hidden" maxW="300px">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.mediaUrl}
                          alt="Media Preview"
                          style={{ width: "100%", maxHeight: "180px", objectFit: "contain", borderRadius: "8px", background: "rgba(0,0,0,0.3)" }}
                        />
                      </Box>
                    )}
                  </VStack>
                </HStack>

                {/* Right Section: Delete Button */}
                <Button
                  colorPalette="red"
                  variant="subtle"
                  loading={deletingId === item.id}
                  onClick={() => handleDelete(item.id)}
                  alignSelf={{ base: "stretch", sm: "flex-start" }}
                >
                  <FaTrash /> Supprimer
                </Button>
              </Flex>
            </Card.Root>
          ))}
        </VStack>
      </Container>
    </Box>
  );
}
