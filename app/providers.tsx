"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Box } from "@chakra-ui/react";
import { Provider } from "@/components/ui/provider";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n";

interface GlobalContextType {
  config: { streamAsset: boolean };
  setConfig: React.Dispatch<React.SetStateAction<{ streamAsset: boolean }>>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobal must be used within a Providers");
  }
  return context;
};

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStreamAsset =
    pathname?.includes("/twitch-chat-overlay") ||
    pathname?.includes("/spotify-stream") ||
    pathname?.includes("/alerts-overlay");

  const [config, setConfig] = useState({ streamAsset: !!isStreamAsset });

  // Update config if pathname changes (navigation)
  useEffect(() => {
    const isOverlay =
      pathname?.includes("/twitch-chat-overlay") ||
      pathname?.includes("/spotify-stream") ||
      pathname?.includes("/alerts-overlay");
    setConfig((prev) => ({ ...prev, streamAsset: !!isOverlay }));
  }, [pathname]);

  // Handle global background transparency for OBS
  useEffect(() => {
    if (config.streamAsset) {
      document.documentElement.style.setProperty(
        "background",
        "transparent",
        "important",
      );
      document.body.style.setProperty("background", "transparent", "important");
    } else {
      document.documentElement.style.removeProperty("background");
      document.body.style.removeProperty("background");
    }
  }, [config.streamAsset]);

  return (
    <GlobalContext.Provider value={{ config, setConfig }}>
      <Provider>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <Box
            minH="100vh"
            bg={config.streamAsset ? "transparent" : "white"}
            color="gray.900"
            _dark={{
              bg: config.streamAsset ? "transparent" : "gray.900",
              color: "white",
            }}
          >
            <I18nProvider>{children}</I18nProvider>
          </Box>
        </ThemeProvider>
      </Provider>
    </GlobalContext.Provider>
  );
}
