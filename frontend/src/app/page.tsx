"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  BarChart3,
  CirclePlay,
  ShieldCheck,
  Trophy,
  UserRound,
  UsersRound,
  Zap,
  RotateCcw,
  LayoutDashboard,
  Sparkles
} from "lucide-react";

import { StrykLogo } from "@/components/stryk-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/components/player-context";
import { PlayerCard } from "@/components/player-card";
import { PhoneFrame } from "@/components/phone-frame";

// Import page components for desktop gallery preview
import LoginPage from "./login/page";
import PositionPage from "./position/page";
import HomeLobbyPage from "./home/page";
import CardPage from "./card/page";
import LobbiesPage from "./lobbies/page";
import TeamBuilderPage from "./team-builder/page";
import SubmitPage from "./submit/page";
import VerifyPage from "./verify/page";

const features = [
  {
    title: "Player Cards",
    copy: "Your football identity",
    icon: UserRound,
  },
  {
    title: "Match Lobbies",
    copy: "Play with your squad",
    icon: UsersRound,
  },
  {
    title: "Real Stats",
    copy: "Verify. Trust. Level up.",
    icon: ShieldCheck,
  },
  {
    title: "Grow & Earn",
    copy: "Badges. Titles. Respect.",
    icon: BarChart3,
  },
];

const mockRahul = {
  name: "Rahul",
  username: "rahul.9",
  position: "ST",
  ovr: 79,
  style: "Poacher",
  foot: "R" as const,
  nation: "IND",
  matches: 84,
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  stats: { PAC: 82, SHO: 85, PAS: 71, DRI: 78, DEF: 38, PHY: 74 }
};

const mockAditya = {
  name: "Aditya",
  username: "aditya10",
  position: "CAM",
  ovr: 84,
  style: "Playmaker",
  foot: "L" as const,
  nation: "IND",
  matches: 142,
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  stats: { PAC: 80, SHO: 79, PAS: 87, DRI: 85, DEF: 52, PHY: 71 }
};

const mockOm = {
  name: "Om",
  username: "om.cb",
  position: "CB",
  ovr: 81,
  style: "Box-to-Box",
  foot: "R" as const,
  nation: "IND",
  matches: 98,
  avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  stats: { PAC: 74, SHO: 55, PAS: 70, DRI: 72, DEF: 82, PHY: 81 }
};

export default function Home() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const { updatePlayerData, resetPlayerData } = usePlayer();
  const router = useRouter();

  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const handleExploreDemo = () => {
    updatePlayerData({
      fullName: "Aditya Akunjir",
      username: "aditya10",
      avatar: "",
      position: "CAM",
      secondaryPosition: "ST",
      strongFoot: "Left",
      playStyle: "Playmaker",
      bio: "Midfield wizard who loves unlocking defenses with key passes.",
    });
    router.push("/home");
  };

  const handleJoinStryk = () => {
    resetPlayerData();
    router.push("/identity");
  };

  // Prevent hydration flash: default to mobile-like landing page view during SSR
  if (isDesktop === null || !isDesktop) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(198,255,0,0.06),transparent_32%),radial-gradient(circle_at_18%_75%,rgba(91,140,255,0.04),transparent_28%),linear-gradient(180deg,#05070B_0%,#0B1020_44%,#05070B_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[44%] bg-[linear-gradient(180deg,transparent,rgba(11,16,32,0.72)),repeating-linear-gradient(92deg,rgba(198,255,0,0.04)_0_1px,transparent_1px_42px)] opacity-70" />
        <div className="absolute inset-x-[-10%] bottom-[-12%] h-[34%] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(198,255,0,0.1),rgba(5,7,11,0.72)_55%,transparent_72%)] blur-sm" />
        <div className="absolute left-[8%] top-[42%] h-72 w-1 rounded-full bg-white/70 blur-[2px] opacity-20" />
        <div className="absolute right-[7%] top-[39%] h-80 w-1 rounded-full bg-white/70 blur-[2px] opacity-20" />

        <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-8 pt-7 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between">
            <StrykLogo />
            <Button asChild variant="outline" className="h-12 px-6 normal-case tracking-normal border-white/10 bg-white/5 hover:bg-white/10">
              <Link href="/login">Log in</Link>
            </Button>
          </header>

          <div className="mx-auto mt-12 flex w-full max-w-5xl flex-1 flex-col items-center text-center">
            <p className="mb-4 max-w-full text-center text-xs font-black uppercase tracking-[0.22em] text-[var(--stryk-lime)] sm:text-base sm:tracking-[0.28em]">
              YOUR FOOTBALL IDENTITY
            </p>
            <h1 className="font-display max-w-4xl text-balance text-center text-[3.5rem] leading-[0.92] tracking-wide text-white sm:text-8xl lg:text-[7rem]">
              BUILT. PLAYED.<br />
              <span className="text-[#C6FF00]" style={{ textShadow: "0 0 40px rgba(198,255,0,0.3)" }}>
                REMEMBERED.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg font-semibold leading-7 text-zinc-300 sm:text-xl">
              Real matches. Real stats. Real you. This is your{" "}
              <span className="font-display text-[#C6FF00] tracking-wider">STRYK</span>.
            </p>

            <div className="relative mt-10 flex w-full items-center justify-center overflow-visible min-h-[22rem]">
              <div className="absolute left-[2%] hidden lg:block opacity-45 scale-90 blur-[0.5px]">
                <PlayerCard player={mockRahul} />
              </div>
              <div className="z-20 relative">
                <div
                  aria-hidden
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-56 h-8 rounded-[50%] blur-2xl pointer-events-none"
                  style={{ background: "rgba(198,255,0,0.35)" }}
                />
                <PlayerCard player={mockAditya} />
              </div>
              <div className="absolute right-[2%] hidden lg:block opacity-45 scale-90 blur-[0.5px]">
                <PlayerCard player={mockOm} />
              </div>
            </div>

            <div className="mt-8 grid w-full grid-cols-2 overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl md:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={cn(
                    "flex min-h-36 flex-col items-center justify-center px-4 py-6 text-center",
                    index % 2 === 1 && "border-l border-white/10",
                    index > 1 && "border-t border-white/10 md:border-t-0",
                    index > 0 && "md:border-l md:border-white/10",
                  )}
                >
                  <feature.icon className="mb-4 size-10 text-[#C6FF00]" />
                  <p className="text-sm font-black uppercase text-white sm:text-base">
                    {feature.title}
                  </p>
                  <p className="mt-1 max-w-32 text-sm leading-5 text-zinc-400">
                    {feature.copy}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid w-full gap-4 sm:grid-cols-[1fr_0.8fr]">
              <Button size="lg" className="h-16 px-6 text-base sm:text-lg cursor-pointer bg-[#C6FF00] hover:bg-[#b0e600] text-black font-display tracking-[0.2em]" onClick={handleJoinStryk}>
                JOIN STRYK
                <ArrowRight className="ml-auto" strokeWidth={3} />
              </Button>
              <Button variant="outline" size="lg" className="h-16 px-6 text-base sm:text-lg cursor-pointer border-white/10 bg-white/5 hover:bg-white/10 font-display tracking-[0.2em]" onClick={handleExploreDemo}>
                EXPLORE DEMO
                <CirclePlay className="ml-auto" />
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 pb-3 text-zinc-400">
              <div className="flex -space-x-3">
                {["from-amber-300", "from-sky-300", "from-lime-300", "from-fuchsia-300"].map(
                  (color, index) => (
                    <div
                      key={color}
                      className={cn(
                        "grid size-10 place-items-center rounded-full border-2 border-[#05070B] bg-gradient-to-br to-zinc-950 text-xs font-black text-black",
                        color,
                      )}
                    >
                      {index + 1}
                    </div>
                  ),
                )}
              </div>
              <p className="text-base sm:text-lg">
                <span className="font-black text-[#C6FF00]">10K+</span> players already building their legacy
              </p>
              <div className="hidden items-center gap-2 text-lime-200 md:flex">
                <Trophy className="size-5" />
                <span className="text-sm font-bold uppercase tracking-[0.18em]">
                  Season Zero
                </span>
              </div>
            </div>
          </div>
        </section>

        <Zap className="absolute bottom-[19%] left-[9%] size-5 rotate-12 text-[#C6FF00]/50" />
        <Zap className="absolute right-[13%] top-[31%] size-4 -rotate-12 text-blue-300/40" />
      </main>
    );
  }

  // Desktop Gallery view (width >= 1024px)
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#05070B] text-white flex flex-col">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,255,0,0.06),transparent_50%),radial-gradient(circle_at_0%_100%,rgba(91,140,255,0.03),transparent_40%),linear-gradient(180deg,#05070B_0%,#080C16_50%,#05070B_100%)] pointer-events-none" />

      {/* Grid line overlay */}
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

        <div className="flex items-center gap-6">
          <div className="hidden xl:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
            <div className="w-2 h-2 rounded-full bg-[#C6FF00] animate-pulse" />
            Active Player Context Sync: <span className="text-[#C6FF00]">Active</span>
          </div>

          <div className="flex items-center gap-2.5">
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
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <section className="relative z-20 flex-1 flex flex-col justify-center py-6">
        {/* Canvas Header */}
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
            <LoginPage />
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
