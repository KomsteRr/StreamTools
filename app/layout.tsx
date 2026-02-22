import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";

import { Providers } from "./providers";
import { DashboardHeader } from "./components/dashboard/dashboard-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Streaming all in one tools",
  description: "Streaming all in one tools",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasSession = !!cookieStore.get("session");

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <DashboardHeader hasSession={hasSession} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
