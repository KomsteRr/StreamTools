"use client";

import { useActionState } from "react";
import { login } from "../actions/auth";
import { Box, Container, Heading, Stack, Text, Input } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";

import { PasswordInput } from "@/components/ui/password-input";

import { LoginBackground } from "../components/login-background";

export default function LoginPage() {
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
              Streaming All In One Tools
            </Heading>
            <form action={formAction} style={{ width: "100%" }}>
              <Stack gap={4}>
                <Field label="Nom d'utilisateur">
                  <Input
                    name="username"
                    required
                    placeholder="Entrez votre nom d'utilisateur"
                    autoComplete="username"
                  />
                </Field>

                <Field label="Mot de passe">
                  <PasswordInput
                    name="password"
                    required
                    placeholder="Entrez votre mot de passe"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                </Field>

                <Checkbox name="rememberMe" size="sm">
                  Se souvenir de moi
                </Checkbox>

                {state?.error && (
                  <Text color="red.500" fontSize="sm">
                    {state.error}
                  </Text>
                )}

                <Button type="submit" colorPalette="blue" width="full" loading={isPending} loadingText="Initialisation du système...">
                  Connexion
                </Button>
              </Stack>
            </form>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
