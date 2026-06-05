"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  SignInButton,
  SignUpButton,
  useAuth,
} from "@clerk/nextjs";

import { StrykLogo } from "@/components/stryk-logo";
import { usePlayer } from "@/components/player-context";

export default function Home() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isLoaded } = usePlayer();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isSignedIn && isLoaded) {
      const hasProfile = localStorage.getItem("stryk_player_data");
      if (hasProfile) {
        router.replace("/home");
      } else {
        router.replace("/identity");
      }
    }
  }, [mounted, isSignedIn, isLoaded, router]);

  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-[#05070B] text-white flex flex-col items-center justify-center">
      {/* Ambient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(198,255,0,0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(91,140,255,0.08) 0%, transparent 55%), #05070B",
        }}
      />

      {/* Content */}
      <section className="relative z-10 flex flex-col items-center justify-center gap-12 h-full px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <StrykLogo compact centered />
          <p className="text-[11px] leading-relaxed text-white/45 font-medium text-center max-w-[220px]">
            One profile. Every match.
          </p>
        </div>

        {/* Auth buttons */}
        <div className="w-full max-w-xs flex flex-col gap-3">
          <SignInButton mode="modal" forceRedirectUrl="/home" fallbackRedirectUrl="/home">
            <button
              className="w-full h-[52px] rounded-2xl border border-white/10 bg-white/[0.04] text-[13px] font-display tracking-[0.22em] uppercase text-white/90 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98] cursor-pointer backdrop-blur-sm"
              type="button"
            >
              LOG IN
            </button>
          </SignInButton>

          <SignUpButton mode="modal" forceRedirectUrl="/identity" fallbackRedirectUrl="/identity">
            <button
              className="w-full h-[52px] rounded-2xl bg-[#C6FF00] text-[13px] font-display tracking-[0.22em] uppercase text-black font-bold transition-all duration-200 hover:bg-[#d4ff33] active:scale-[0.98] cursor-pointer"
              style={{ boxShadow: "0 16px 40px -8px rgba(198,255,0,0.45)" }}
              type="button"
            >
              JOIN STRYK
            </button>
          </SignUpButton>

          <p className="text-center text-[9px] text-white/30 font-medium tracking-wide mt-1">
            Free to join · No credit card required
          </p>
        </div>
      </section>
    </main>
  );
}
