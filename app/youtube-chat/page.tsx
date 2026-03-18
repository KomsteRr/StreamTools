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
          <Heading size="xl">YouTube Chat Overlay</Heading>
          <Link href="/youtube-chat/customize">
            <Button colorPalette="red">
              <FiSettings /> Personnaliser l'apparence
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
                Pour YouTube, l'intégration se fait directement via l'URL
                officielle du chat en direct. Vos quotas d'API sont ainsi
                préservés et le chat reste parfaitement synchronisé.
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
                      Créer une Source Navigateur sur OBS
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                    >
                      Dans le champ "URL", collez l'URL standard du chat pop-out
                      de votre live YouTube.
                      <br />
                      Exemple :{" "}
                      <Text as="strong">
                        https://www.youtube.com/live_chat?is_popout=1&v=VOTRE_ID_VIDEO
                      </Text>
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
                      Injecter le Custom CSS
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                      mb={3}
                    >
                      Rendez-vous dans la section "Personnaliser" pour ajuster
                      les couleurs, polices et bordures. Copiez ensuite le code
                      "CSS OBS" généré et collez-le dans le champ "CSS
                      personnalisé" de votre source navigateur.
                    </Text>
                    <Link href="/youtube-chat/customize">
                      <Button size="sm" variant="outline" colorPalette="red">
                        <FiLayout /> Ouvrir le générateur de CSS
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
                      C'est prêt !
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                    >
                      Le chat deviendra instantanément transparent et prendra
                      vos couleurs personnalisées.
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
