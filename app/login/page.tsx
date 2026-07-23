"use client";

import { useTranslation } from "@/lib/i18n";

import { useActionState } from "react";
import { login } from "../actions/auth";
import { Box, Container, Heading, Stack, Text, Input } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";

import { PasswordInput } from "@/components/ui/password-input";

import { LoginBackground } from "../components/login-background";
import { LanguageSwitcher } from "@/app/components/language-switcher";

export default function LoginPage() {
  const { t } = useTranslation();
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <>
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        pos="relative"
      >
        <Box pos="absolute" top={4} right={4} zIndex={10}>
          <LanguageSwitcher />
        </Box>
        <LoginBackground />
        <Container
          maxW="sm"
          p={8}
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderRadius="lg"
          boxShadow="lg"
          zIndex="1"
          pos="relative"
        >
          <Stack gap={6} align="center">
            <Heading as="h1" size="xl">
              {t("login.title")}
            </Heading>
            <form action={formAction} style={{ width: "100%" }}>
              <Stack gap={4}>
                <Field label={t("common.username")}>
                  <Input
                    name="username"
                    required
                    placeholder={t("login.usernamePlaceholder")}
                    autoComplete="username"
                  />
                </Field>

                <Field label={t("common.password")}>
                  <PasswordInput
                    name="password"
                    required
                    placeholder={t("login.passwordPlaceholder")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                </Field>

                <Checkbox name="rememberMe" size="sm">
                  {t("common.rememberMe")}
                </Checkbox>

                {state?.error && (
                  <Text color="red.500" fontSize="sm">
                    {state.error}
                  </Text>
                )}

                <Button type="submit" colorPalette="blue" width="full" loading={isPending} loadingText={t("common.loading")}>
                  {t("login.submit")}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
