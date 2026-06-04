import type { Metadata } from "next";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { PlayerProvider } from "@/components/player-context";
import { StrykLogo } from "@/components/stryk-logo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STRYK | Your Football Identity",
  description:
    "Build your football identity with real matches, real stats, and premium player cards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <AuthProvider>
            <PlayerProvider>
              <header className="fixed left-0 right-0 top-0 z-50 hidden border-b border-white/10 bg-black/45 px-4 py-3 text-white backdrop-blur-xl md:block">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                  <div className="scale-90">
                    <StrykLogo />
                  </div>
                  <nav className="flex items-center gap-2">
                    <Show when="signed-out">
                      <SignInButton mode="modal">
                        <button className="rounded-full border border-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:border-lime-300/50 hover:bg-white/10">
                          Sign in
                        </button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button className="rounded-full bg-[#C6FF00] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-[#b0e600]">
                          Sign up
                        </button>
                      </SignUpButton>
                    </Show>
                    <Show when="signed-in">
                      <UserButton />
                    </Show>
                  </nav>
                </div>
              </header>
              {children}
            </PlayerProvider>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
