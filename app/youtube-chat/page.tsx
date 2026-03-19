"use client";

import {
  Container,
  Heading,
  Card,
  VStack,
  Text,
  HStack,
  Icon,
  Box,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FiSettings, FiYoutube, FiLayout, FiCheckCircle } from "react-icons/fi";
import { useTranslation } from '@/lib/i18n'

export default function YouTubeChatPage() {
  const { t } = useTranslation()
  return (
    <Container maxW="full" centerContent py={10}>
      <VStack gap={8} width="full" maxW="3xl" align="stretch">
        <HStack justify="space-between">
          <Heading size="xl">{t("youtube.title")}</Heading>
          <Link href="/youtube-chat/customize">
            <Button colorPalette="red">
              <FiSettings /> {t("youtube.customizeBtn")}
            </Button>
          </Link>
        </HStack>

        <Card.Root width="full">
          <Card.Header>
            <HStack>
              <Icon as={FiYoutube} color="red.500" boxSize={6} />
              <Heading size="md">{t('youtube.obsInstall')}</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <VStack align="stretch" gap={6}>
              <Text>
                {t("youtube.instructionDesc")}
              </Text>

              <VStack
                align="stretch"
                gap={4}
                p={5}
                bg="gray.50"
                _dark={{ bg: "gray.800" }}
                borderRadius="lg"
                borderWidth="1px"
              >
                <HStack align="flex-start" gap={4}>
                  <Box
                    bg="red.100"
                    color="red.600"
                    _dark={{ bg: "red.500/20", color: "red.400" }}
                    p={2}
                    borderRadius="full"
                  >
                    <Text fontWeight="bold" w="24px" textAlign="center">
                      1
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>
                      {t("youtube.step1Title")}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {t("youtube.step1Desc")}
                    </Text>
                  </Box>
                </HStack>

                <HStack align="flex-start" gap={4}>
                  <Box
                    bg="red.100"
                    color="red.600"
                    _dark={{ bg: "red.500/20", color: "red.400" }}
                    p={2}
                    borderRadius="full"
                  >
                    <Text fontWeight="bold" w="24px" textAlign="center">
                      2
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>
                      {t("youtube.step2Title")}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                      mb={3}
                    >
                      {t("youtube.step2Desc")}
                    </Text>
                    <Link href="/youtube-chat/customize">
                      <Button size="sm" variant="outline" colorPalette="red">
                        <FiLayout /> {t("youtube.openGeneratorBtn")}
                      </Button>
                    </Link>
                  </Box>
                </HStack>

                <HStack align="flex-start" gap={4}>
                  <Box
                    bg="green.100"
                    color="green.600"
                    _dark={{ bg: "green.500/20", color: "green.400" }}
                    p={2}
                    borderRadius="full"
                  >
                    <FiCheckCircle size={24} />
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>
                      {t("youtube.step3Title")}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                    >
                      {t("youtube.step3Desc")}
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}
