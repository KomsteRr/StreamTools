"use client";

import { useActionState, useState, useEffect, useSyncExternalStore } from "react";
import { submitSetup } from "@/app/actions/setup";
import { getDbEnvVar } from "@/app/actions/env";
import {
  Box,
  Container,
  Heading,
  Stack,
  Text,
  Input,
  Flex,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { 
  FaDatabase, 
  FaServer, 
  FaTwitch, 
  FaYoutube, 
  FaSpotify, 
  FaRobot, 
  FaCheckCircle, 
  FaArrowRight, 
  FaArrowLeft 
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from '@/lib/i18n'

const emptySubscribe = () => () => {};

export default function AdminSetupPage() {
  const { t } = useTranslation()
  const [state, formAction, isPending] = useActionState(submitSetup, null);
  const [step, setStep] = useState(1);
  const [dbType, setDbType] = useState("sqlite");
  const [twitchBotActive, setTwitchBotActive] = useState(false);
  const origin = useSyncExternalStore(emptySubscribe, () => window.location.origin, () => "");
  const [envDbUrl, setEnvDbUrl] = useState("");
  
  useEffect(() => {
    // Fetch env db url if it exists
    getDbEnvVar().then((url) => {
      if (url) setEnvDbUrl(url);
    });
  }, []);

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }} py={12}>
      <Container maxW="3xl">
        <Stack gap={8}>
          <Box textAlign="center">
            <Heading size="2xl" mb={4}>
              {t('admin.setup.welcomeTitle')}
            </Heading>
            <Text color="gray.500">
              {t('admin.setup.welcomeDesc')}
            </Text>
          </Box>

          {/* Progress Indicator */}
          <Flex justify="center" gap={4} mb={6}>
            {[1, 2, 3].map((num) => (
              <Flex key={num} align="center" gap={2}>
                <Flex
                  w="10"
                  h="10"
                  borderRadius="full"
                  bg={step >= num ? "blue.500" : "gray.200"}
                  _dark={{ bg: step >= num ? "blue.600" : "gray.700" }}
                  color={step >= num ? "white" : "gray.500"}
                  align="center"
                  justify="center"
                  fontWeight="bold"
                  transition="all 0.2s"
                >
                  {step > num ? <FaCheckCircle /> : num}
                </Flex>
                {num < 3 && (
                  <Box w="12" h="1" bg={step > num ? "blue.500" : "gray.200"} _dark={{ bg: step > num ? "blue.600" : "gray.700" }} />
                )}
              </Flex>
            ))}
          </Flex>

          <Box bg="white" _dark={{ bg: "gray.800" }} p={8} borderRadius="2xl" shadow="md">
            <form action={formAction}>
              {/* Hidden input to store dbType */}
              <input type="hidden" name="db_type" value={dbType} />

              {/* Step 1: Base de données */}
              <Box display={step === 1 ? "block" : "none"}>
                <Heading size="lg" mb={6} textAlign="center">
                  {t('admin.setup.step1Title')}
                </Heading>
                <Stack gap={6} direction={{ base: "column", md: "row" }}>
                  <Box
                    flex={1}
                    p={6}
                    borderWidth="2px"
                    borderColor={dbType === "sqlite" ? "blue.500" : "gray.200"}
                    borderRadius="xl"
                    cursor="pointer"
                    onClick={() => setDbType("sqlite")}
                    bg={dbType === "sqlite" ? "blue.50" : "transparent"}
                    _dark={{ 
                      borderColor: dbType === "sqlite" ? "blue.500" : "gray.700",
                      bg: dbType === "sqlite" ? "blue.900/30" : "transparent"
                    }}
                    transition="all 0.2s"
                    _hover={{ borderColor: "blue.300", transform: "translateY(-2px)", shadow: "sm" }}
                  >
                    <VStack gap={4} align="center" textAlign="center">
                      <Box color={dbType === "sqlite" ? "blue.500" : "gray.400"}>
                        <FaDatabase size={40} />
                      </Box>
                      <Heading size="md">{t('admin.setup.sqliteTitle')}</Heading>
                      <Text fontSize="sm" color="gray.500">
                        {t('admin.setup.sqliteDesc')}
                      </Text>
                      {dbType === "sqlite" && (
                        <Flex align="center" color="blue.500" gap={2} fontSize="sm" fontWeight="bold">
                          <FaCheckCircle /> {t('admin.setup.selected')}
                        </Flex>
                      )}
                    </VStack>
                  </Box>

                  <Box
                    flex={1}
                    p={6}
                    borderWidth="2px"
                    borderColor={dbType === "postgres" ? "blue.500" : "gray.200"}
                    borderRadius="xl"
                    cursor="pointer"
                    onClick={() => setDbType("postgres")}
                    bg={dbType === "postgres" ? "blue.50" : "transparent"}
                    _dark={{ 
                      borderColor: dbType === "postgres" ? "blue.500" : "gray.700",
                      bg: dbType === "postgres" ? "blue.900/30" : "transparent"
                    }}
                    transition="all 0.2s"
                    _hover={{ borderColor: "blue.300", transform: "translateY(-2px)", shadow: "sm" }}
                  >
                    <VStack gap={4} align="center" textAlign="center">
                      <Box color={dbType === "postgres" ? "blue.500" : "gray.400"}>
                        <FaServer size={40} />
                      </Box>
                      <Heading size="md">{t('admin.setup.postgresTitle')}</Heading>
                      <Text fontSize="sm" color="gray.500">
                        {t('admin.setup.postgresDesc')}
                      </Text>
                      {dbType === "postgres" && (
                        <Flex align="center" color="blue.500" gap={2} fontSize="sm" fontWeight="bold">
                          <FaCheckCircle /> {t('admin.setup.selected')}
                        </Flex>
                      )}
                    </VStack>
                  </Box>
                </Stack>

                <AnimatePresence>
                  {dbType === "postgres" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <Box mt={6} p={5} bg="blue.50" _dark={{ bg: "blue.900/10", borderWidth: "1px", borderColor: "blue.900/30" }} borderRadius="xl">
                        <Heading size="sm" mb={4}>{t('admin.setup.postgresConfig')}</Heading>
                        <Field label={t('admin.setup.dbUrl')} helperText={t('admin.setup.dbUrlHelper')}>
                          <Input 
                            name="database_url" 
                            defaultValue={envDbUrl}
                            placeholder="postgresql://user:password@localhost:5432/mydb" 
                            bg="white" 
                            _dark={{ bg: "gray.900" }} 
                          />
                        </Field>
                      </Box>
                      <Box mt={4} p={4} bg="orange.50" _dark={{ bg: "orange.900/10", borderWidth: "1px", borderColor: "orange.900/30" }} borderRadius="xl">
                        <Text fontWeight="bold" color="orange.600" _dark={{ color: "orange.300" }} mb={2}>{t('admin.setup.migrationWarning')}</Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                          {t('admin.setup.migrationDesc1')}
                        </Text>
                        <Box mt={2} p={3} bg="gray.900" borderRadius="md" fontFamily="mono" fontSize="sm" color="green.300">
                          npm run migrate
                        </Box>
                        <Text fontSize="xs" color="gray.500" mt={2}>
                          {t('admin.setup.migrationDesc2')}
                        </Text>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Flex justify="flex-end" mt={8}>
                  <Button type="button" onClick={nextStep} colorPalette="blue" size="lg">
                    {t('admin.setup.continueBtn')} <FaArrowRight />
                  </Button>
                </Flex>
              </Box>

              {/* Step 2: Fonctionnalités */}
              <Box display={step === 2 ? "block" : "none"}>
                <Heading size="lg" mb={6} textAlign="center">
                  {t('admin.setup.step2Title')}
                </Heading>
                <Stack gap={6}>
                  <Box p={5} borderWidth="1px" borderRadius="xl" shadow="sm" transition="all 0.2s" _hover={{ shadow: "md" }}>
                    <Stack direction="row" justify="space-between" align="center">
                      <HStack gap={4}>
                        <Flex p={3} bg="purple.100" _dark={{ bg: "purple.900/30" }} borderRadius="lg">
                          <FaTwitch color="#8B5CF6" size={24} />
                        </Flex>
                        <Box>
                          <Text fontWeight="bold" fontSize="lg">{t('admin.setup.twitchTitle')}</Text>
                          <Text fontSize="sm" color="gray.500">{t('admin.setup.twitchDesc')}</Text>
                        </Box>
                      </HStack>
                      <Switch name="twitch_active" defaultChecked value="true" size="lg" />
                    </Stack>
                  </Box>

                  <Box p={5} borderWidth="1px" borderRadius="xl" shadow="sm" transition="all 0.2s" _hover={{ shadow: "md" }}>
                    <Stack direction="row" justify="space-between" align="center">
                      <HStack gap={4}>
                        <Flex p={3} bg="red.100" _dark={{ bg: "red.900/30" }} borderRadius="lg">
                          <FaYoutube color="#EF4444" size={24} />
                        </Flex>
                        <Box>
                          <Text fontWeight="bold" fontSize="lg">{t('admin.setup.youtubeTitle')}</Text>
                          <Text fontSize="sm" color="gray.500">{t('admin.setup.youtubeDesc')}</Text>
                        </Box>
                      </HStack>
                      <Switch name="youtube_active" defaultChecked value="true" size="lg" />
                    </Stack>
                  </Box>

                  <Box p={5} borderWidth="1px" borderRadius="xl" shadow="sm" transition="all 0.2s" _hover={{ shadow: "md" }}>
                    <Stack direction="row" justify="space-between" align="center">
                      <HStack gap={4}>
                        <Flex p={3} bg="green.100" _dark={{ bg: "green.900/30" }} borderRadius="lg">
                          <FaSpotify color="#10B981" size={24} />
                        </Flex>
                        <Box>
                          <Text fontWeight="bold" fontSize="lg">{t('admin.setup.spotifyTitle')}</Text>
                          <Text fontSize="sm" color="gray.500">{t('admin.setup.spotifyDesc')}</Text>
                        </Box>
                      </HStack>
                      <Switch name="spotify_active" defaultChecked value="true" size="lg" />
                    </Stack>
                  </Box>
                </Stack>
                <Flex justify="space-between" mt={8}>
                  <Button type="button" variant="outline" onClick={prevStep} size="lg">
                    <FaArrowLeft /> {t('admin.setup.backBtn')}
                  </Button>
                  <Button type="button" onClick={nextStep} colorPalette="blue" size="lg">
                    {t('admin.setup.continueBtn')} <FaArrowRight />
                  </Button>
                </Flex>
              </Box>

              {/* Step 3: Configuration Globale */}
              <Box display={step === 3 ? "block" : "none"}>
                <Heading size="lg" mb={6} textAlign="center">
                  {t('admin.setup.step3Title')}
                </Heading>
                <Stack gap={8}>
                  <Box>
                    <HStack mb={4} gap={3}>
                      <FaSpotify color="#10B981" size={20} />
                      <Heading size="md">{t('admin.setup.spotifyAppTitle')}</Heading>
                    </HStack>
                    <Stack gap={4} p={5} bg="gray.50" _dark={{ bg: "gray.800", borderWidth: "1px", borderColor: "gray.700" }} borderRadius="xl">
                      <Field label={t('admin.setup.redirectUri')} helperText={t('admin.setup.redirectUriHelper')}>
                        <Input name="spotify_redirect_uri" defaultValue={origin ? `${origin}/api/spotify/callback` : ""} placeholder="https://votre-domaine.com/api/spotify/callback" bg="white" _dark={{ bg: "gray.900" }} />
                      </Field>
                    </Stack>
                  </Box>

                  <Box>
                    <HStack mb={4} gap={3}>
                      <FaRobot color="#8B5CF6" size={20} />
                      <Heading size="md">{t('admin.setup.botGlobalTitle')}</Heading>
                    </HStack>
                    <Stack gap={4} p={5} bg="purple.50" _dark={{ bg: "purple.900/10", borderWidth: "1px", borderColor: "purple.900/30" }} borderRadius="xl">
                      <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }} mb={2}>
                        {t('admin.setup.botGlobalDesc')}
                      </Text>
                      <Stack direction="row" justify="space-between" align="center" mb={2}>
                        <Text fontWeight="bold">{t('admin.setup.botActive')}</Text>
                        <Switch name="twitch_bot_active" value="true" checked={twitchBotActive} onCheckedChange={(e) => setTwitchBotActive(!!e.checked)} />
                      </Stack>
                      <AnimatePresence>
                        {twitchBotActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                          >
                            <Stack gap={4} mt={2}>
                              <Field label={t('admin.setup.botUsername')}>
                                <Input name="twitch_bot_username" placeholder="ex: mon_bot_cool" bg="white" _dark={{ bg: "gray.900" }} />
                              </Field>
                              <Field label="Token OAuth du Bot" helperText={<>{t('admin.setup.botTokenHelperPart1')} <a href="https://twitchtokengenerator.com/" target="_blank" rel="noreferrer" style={{color: "var(--chakra-colors-blue-500)", textDecoration: "underline"}}>twitchtokengenerator.com</a> {t('admin.setup.botTokenHelperPart2')}</>}>
                                <Input name="twitch_bot_token" type="password" placeholder="oauth:..." bg="white" _dark={{ bg: "gray.900" }} />
                              </Field>
                            </Stack>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Stack>
                  </Box>

                  {state?.error && (
                    <Box p={4} bg="red.50" _dark={{ bg: "red.900/20" }} color="red.500" borderRadius="md" textAlign="center">
                      <Text fontWeight="bold">{state.error}</Text>
                    </Box>
                  )}
                  {state?.success && (
                    <Box p={4} bg="green.50" _dark={{ bg: "green.900/20" }} color="green.500" borderRadius="md" textAlign="center">
                      <Text fontWeight="bold">{state.success}</Text>
                    </Box>
                  )}

                  <Flex justify="space-between" mt={8}>
                    <Button type="button" variant="outline" onClick={prevStep} size="lg">
                      <FaArrowLeft /> {t('admin.setup.backBtn')}
                    </Button>
                    <Button type="submit" colorPalette="green" size="lg" loading={isPending}>
                      {t('admin.setup.finishSetup')} <FaCheckCircle />
                    </Button>
                  </Flex>
                </Stack>
              </Box>
            </form>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

