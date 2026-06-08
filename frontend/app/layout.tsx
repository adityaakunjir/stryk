import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { PlayerProvider } from "@/components/player-context";

export const viewport: Viewport = {
  themeColor: "#05070B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "STRYK | Your Football Identity",
  description:
    "Build your football identity with real matches, real stats, and premium player cards.",
  openGraph: {
    title: "STRYK | Your Football Identity",
    description: "Build your football identity with real matches, real stats, and premium player cards.",
    siteName: "STRYK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STRYK | Your Football Identity",
    description: "Build your football identity with real matches, real stats, and premium player cards.",
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
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
            {children}
            <Toaster theme="dark" position="top-center" richColors />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

