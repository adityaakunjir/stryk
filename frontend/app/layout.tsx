import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { PlayerProvider } from "@/components/player-context";
import { RealtimeProvider } from "@/components/realtime-provider";
import { DraftProvider } from "@/lib/draft-context";
import { AuroraBackground } from "@/components/aurora-background";
import { PwaRegister } from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--stryk-font-inter" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", display: "swap", variable: "--stryk-font-bebas" });

export const viewport: Viewport = {
  themeColor: "#151515",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://stryk.games"),
  applicationName: "STRYK",
  appleWebApp: { capable: true, title: "STRYK", statusBarStyle: "default" },
  title: "STRYK | Your Football Identity",
  description:
    "Build your football identity with real matches, real stats, and premium player cards.",
  openGraph: {
    title: "STRYK | Your Football Identity",
    description: "Build your football identity with real matches, real stats, and premium player cards.",
    siteName: "STRYK",
    type: "website"},
  twitter: {
    card: "summary_large_image",
    title: "STRYK | Your Football Identity",
    description: "Build your football identity with real matches, real stats, and premium player cards."}};

import { Toaster } from "sonner";

export default function RootLayout({
  children}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${bebas.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <AuthProvider>
          <PlayerProvider>
            <DraftProvider>
              <AuroraBackground />
              {children}
              <RealtimeProvider />
              <Toaster theme="dark" position="top-center" richColors />
            </DraftProvider>
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
