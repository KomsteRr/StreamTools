"use client";

import { logout } from "@/app/actions/auth";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { useGlobal } from "@/app/providers";
import { usePathname } from "next/navigation";
import { FiSettings, FiLogOut, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

export function DashboardHeader({ hasSession }: { hasSession: boolean }) {
  const { config } = useGlobal();
  const pathname = usePathname();

  // Never render on overlay pages or when logged out
  if (!hasSession || config.streamAsset) {
    return null;
  }

  const isOnDashboard = pathname === "/dashboard" || pathname === "/";

  return (
    <Box
      as="header"
      bg="white"
      _dark={{ bg: "gray.900", borderColor: "gray.700" }}
      borderBottom="1px solid"
      borderColor="gray.200"
      position="sticky"
      top={0}
      zIndex="sticky"
    >
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 6 }}>
        <Flex h={14} alignItems="center" justify="space-between">
          {/* ── Left: Logo + Back button ── */}
          <HStack gap={4}>
            <Link href="/dashboard">
              <Text
                fontWeight="bold"
                fontSize="lg"
                letterSpacing="tight"
                color="gray.800"
                _dark={{ color: "white" }}
                _hover={{ color: "purple.500" }}
                transition="color 0.15s"
              >
                StreamTools
              </Text>
            </Link>
          </HStack>

          {/* ── Right: Settings + Logout ── */}
          <HStack gap={2}>
            <Button asChild variant="ghost" size="sm">
              <Link href="/settings">
                <FiSettings />
                Paramètres
              </Link>
            </Button>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                colorPalette="red"
              >
                <FiLogOut />
                Logout
              </Button>
            </form>
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
}
