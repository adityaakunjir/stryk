"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  SignInButton,
  SignUpButton,
  useAuth,
} from "@clerk/nextjs";
import {
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";

import { StrykLogo } from "@/components/stryk-logo";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player-context";
import { PhoneFrame } from "@/components/phone-frame";

// Import page components for desktop gallery preview
import PositionPage from "./position/page";
import HomeLobbyPage from "./home/page";
import CardPage from "./card/page";
import LobbiesPage from "./lobbies/page";
import TeamBuilderPage from "./team-builder/page";
import SubmitPage from "./submit/page";
import VerifyPage from "./verify/page";

/* ─── Mobile Landing ─── */
function MobileLanding() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If already signed in, go straight to home
  useEffect(() => {
    if (mounted && isSignedIn) {
      const hasProfile = localStorage.getItem("stryk_player_data");
      if (hasProfile) {
        router.replace("/home");
      } else {
        router.replace("/identity");
      }
    }
  }, [mounted, isSignedIn, router]);

  return (
    <main className="stryk-mobile-shell relative min-h-screen overflow-hidden bg-[#05070B] text-white">
      {/* Ambient background layers */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(198,255,0,0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(91,140,255,0.08) 0%, transparent 55%), #05070B",
        }}
      />
      {/* Perspective grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-52 opacity-[0.10] pointer-events-none"
        style={{
          background:
            "linear-gradient(transparent, rgba(198,255,0,0.5)), repeating-linear-gradient(90deg, transparent 0 28px, rgba(255,255,255,0.4) 28px 29px)",
          transform: "perspective(400px) rotateX(70deg)",
          transformOrigin: "bottom",
        }}
      />
      {/* Floating orbs */}
      <div className="absolute top-[18%] left-[12%] w-32 h-32 rounded-full bg-[#C6FF00]/[0.04] blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-[22%] right-[8%] w-40 h-40 rounded-full bg-[#5B8CFF]/[0.04] blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "1.5s" }} />

      {/* Content */}
      <section className="relative z-10 flex flex-col items-center justify-between h-full px-6 py-8">
        {/* Top — Status pill */}
        <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C6FF00] animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50">Season 1 — Live</span>
        </div>

        {/* Center — Brand block */}
        <div className="flex flex-col items-center text-center -mt-4">
          {/* Logo */}
          <div className="mb-8">
            <StrykLogo compact centered />
          </div>

          {/* Tagline */}
          <h1 className="font-display text-[2.6rem] leading-[0.92] uppercase italic tracking-wide text-white">
            YOUR FOOTBALL<br />
            <span
              className="text-[#C6FF00]"
              style={{ textShadow: "0 0 30px rgba(198,255,0,0.3)" }}
            >
              IDENTITY.
            </span>
          </h1>

          <p className="mt-4 max-w-[260px] text-[11px] leading-relaxed text-white/45 font-medium">
            One profile. Every match. Verified stats, growing reputation, a card that evolves with you.
          </p>

          {/* Feature pills */}
          <div className="mt-6 flex items-center gap-3">
            {[
              { icon: <Zap size={10} />, label: "Real Stats" },
              { icon: <Sparkles size={10} />, label: "Player Card" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/50"
              >
                <span className="text-[#C6FF00]">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Auth buttons */}
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

/* ─── Desktop Gallery ─── */
function DesktopGallery() {
  const { resetPlayerData } = usePlayer();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#05070B] text-white flex flex-col">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,255,0,0.06),transparent_50%),radial-gradient(circle_at_0%_100%,rgba(91,140,255,0.03),transparent_40%),linear-gradient(180deg,#05070B_0%,#080C16_50%,#05070B_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-60" />

      {/* Premium Top Bar */}
      <header className="relative z-30 h-18 border-b border-white/5 bg-[#05070B]/85 backdrop-blur-md px-8 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <StrykLogo />
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.3em] font-display text-white/50 uppercase">SPECIFICATION</span>
            <span className="rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/20 px-2.5 py-0.5 text-[9px] font-bold text-[#C6FF00] tracking-wider uppercase">8 SCREENS</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isSignedIn ? (
            <>
              <Button
                onClick={() => {
                  resetPlayerData();
                  window.location.reload();
                }}
                variant="ghost"
                className="h-10 text-xs font-semibold text-zinc-400 hover:text-white border border-white/5 hover:bg-white/5 cursor-pointer"
              >
                <RotateCcw className="size-3.5 mr-2" /> Reset Profile
              </Button>
              <Button
                onClick={() => router.push("/home")}
                className="h-10 text-xs font-semibold bg-[#C6FF00] hover:bg-[#b0e600] text-black font-display tracking-widest px-5 cursor-pointer"
              >
                Enter Dashboard
              </Button>
            </>
          ) : (
            <>
              <SignInButton mode="modal" forceRedirectUrl="/home" fallbackRedirectUrl="/home">
                <Button
                  variant="ghost"
                  className="h-10 text-xs font-semibold text-zinc-400 hover:text-white border border-white/5 hover:bg-white/5 cursor-pointer"
                >
                  LOG IN
                </Button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/identity" fallbackRedirectUrl="/identity">
                <Button
                  className="h-10 text-xs font-semibold bg-[#C6FF00] hover:bg-[#b0e600] text-black font-display tracking-widest px-5 cursor-pointer"
                >
                  JOIN STRYK
                </Button>
              </SignUpButton>
            </>
          )}
        </div>
      </header>

      {/* Main Canvas Area */}
      <section className="relative z-20 flex-1 flex flex-col justify-center py-6">
        <div className="max-w-4xl px-12 mb-6 shrink-0">
          <div className="flex items-center gap-2 text-[#C6FF00] font-bold uppercase text-[10px] tracking-[0.25em]">
            <Sparkles size={12} className="fill-[#C6FF00] stroke-[1]" />
            interactive wireframe spec
          </div>
          <h1 className="font-display tracking-normal uppercase italic leading-none mt-2 text-4xl sm:text-5xl lg:text-[4rem]">
            YOUR FOOTBALL IDENTITY, <span className="text-[#C6FF00]" style={{ textShadow: "0 0 35px rgba(198,255,0,0.25)" }}>UNLOCKED.</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-2xl font-semibold leading-relaxed">
            Real interactions, high-fidelity mockups, and fully responsive layouts. Any actions in one frame sync state globally through our shared player context.
          </p>
        </div>

        {/* Horizontal Scroll Row */}
        <div className="w-full overflow-x-auto flex gap-8 px-12 pb-10 pt-2 [scrollbar-width:thin] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <PhoneFrame index="01" label="Sign In">
            <MobileLanding />
          </PhoneFrame>

          <PhoneFrame index="02" label="Profile - Position">
            <PositionPage />
          </PhoneFrame>

          <PhoneFrame index="03" label="Home Lobby">
            <HomeLobbyPage />
          </PhoneFrame>

          <PhoneFrame index="04" label="Player Card">
            <CardPage />
          </PhoneFrame>

          <PhoneFrame index="05" label="Match Lobbies">
            <LobbiesPage />
          </PhoneFrame>

          <PhoneFrame index="06" label="Team Builder">
            <TeamBuilderPage />
          </PhoneFrame>

          <PhoneFrame index="07" label="Submit Stats">
            <SubmitPage />
          </PhoneFrame>

          <PhoneFrame index="08" label="Verify">
            <VerifyPage />
          </PhoneFrame>
        </div>
      </section>
    </main>
  );
}

/* ─── Root Page ─── */
export default function Home() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Prevent hydration flash
  if (isDesktop === null || !isDesktop) {
    return <MobileLanding />;
  }

  return <DesktopGallery />;
}
