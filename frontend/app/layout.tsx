import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { PlayerProvider } from "@/components/player-context";
import { RealtimeProvider } from "@/components/realtime-provider";
import { DraftProvider } from "@/lib/draft-context";
import { AiCopilotFab } from "@/components/ai-copilot-fab";

export const viewport: Viewport = {
  themeColor: "#151515",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <PlayerProvider>
            <DraftProvider>
              {children}
              <RealtimeProvider />
              <AiCopilotFab />
              <Toaster theme="dark" position="top-center" richColors />
            </DraftProvider>
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
