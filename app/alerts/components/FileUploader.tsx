"use client";

import { useRef, useState } from "react";
import { Box, Button, Text, HStack, VStack, Image } from "@chakra-ui/react";
import { FiUpload, FiX, FiVolume2 } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n";

interface FileUploaderProps {
  label: string;
  accept: string;
  currentUrl?: string | null;
  mediaType?: "image" | "gif" | "video" | "audio" | null;
  onUploaded: (url: string, mediaType: string) => void;
  onRemove: () => void;
}

export function FileUploader({
  label,
  accept,
  currentUrl,
  mediaType,
  onUploaded,
  onRemove,
}: FileUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/alerts/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.url) onUploaded(data.url, data.mediaType);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <VStack align="stretch" gap={2}>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="gray.600"
        _dark={{ color: "gray.400" }}
      >
        {label}
      </Text>

      {currentUrl && (
        <Box
          position="relative"
          borderRadius="md"
          overflow="hidden"
          border="1px solid"
          borderColor="gray.200"
          _dark={{ borderColor: "gray.700" }}
        >
          {(mediaType === "image" || mediaType === "gif") && (
            <Image
              src={currentUrl}
              alt="preview"
              maxH="120px"
              objectFit="cover"
              w="100%"
            />
          )}
          {mediaType === "video" && (
            <video
              src={currentUrl}
              style={{ maxHeight: 120, width: "100%", objectFit: "cover" }}
              muted
              loop
              autoPlay
            />
          )}
          {mediaType === "audio" && (
            <HStack p={3} bg="gray.100" _dark={{ bg: "gray.800" }}>
              <FiVolume2 />
              <Text fontSize="sm" flex={1} truncate>
                {currentUrl.split("/").pop()}
              </Text>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => audioRef.current?.play()}
              >
                ▶ Play
              </Button>
              <audio ref={audioRef} src={currentUrl} />
            </HStack>
          )}
          <Button
            size="xs"
            position="absolute"
            top={1}
            right={1}
            colorPalette="red"
            variant="solid"
            onClick={onRemove}
            minW="auto"
            p={1}
          >
            <FiX />
          </Button>
        </Box>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <Button
        size="sm"
        variant="outline"
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <FiUpload />
        {currentUrl ? t("alerts.replaceBtn") : t("alerts.chooseFileBtn")}
      </Button>
    </VStack>
  );
}
