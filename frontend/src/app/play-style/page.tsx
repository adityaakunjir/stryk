"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Edit3,
  Gauge,
  Info,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlayer, PlayStyleType } from "@/components/player-context";
import { cn } from "@/lib/utils";

const styles = [
  {
    title: "Speedster" as PlayStyleType,
    copy: "Explosive pace and agility.",
    icon: Gauge,
    tone: "from-sky-300/20",
  },
  {
    title: "Playmaker" as PlayStyleType,
    copy: "Creates chances. Controls the game.",
    icon: Sparkles,
    tone: "from-lime-300/28",
  },
  {
    title: "Poacher" as PlayStyleType,
    copy: "Always in the right place. Finishes cold.",
    icon: Crosshair,
    tone: "from-violet-400/30",
  },
  {
    title: "Box-to-Box" as PlayStyleType,
    copy: "Covers ground. Impacts everywhere.",
    icon: Zap,
    tone: "from-amber-300/20",
  },
];

function StepProgress() {
  return (
    <div className="flex items-center gap-2" aria-label="Step 3 of 3">
      {[1, 2].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-full bg-[#C6FF00] text-black shadow-[0_0_24px_rgba(198,255,0,0.34)]">
            <Check className="size-5 stroke-[3]" />
          </div>
          <div className="h-px w-10 bg-[#C6FF00] sm:w-16" />
        </div>
      ))}
      <div className="grid size-10 place-items-center rounded-full bg-[#C6FF00] text-sm font-display tracking-wider text-black shadow-[0_0_26px_rgba(198,255,0,0.45)]">
        3
      </div>
    </div>
  );
}

function FootballerArt({ active = false }: { active?: boolean }) {
  return (
    <div className="absolute inset-x-5 top-7 h-44 pointer-events-none">
      <div
        className={cn(
          "absolute left-1/2 top-1 size-16 -translate-x-1/2 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-700 to-black",
          active && "shadow-[0_0_0_5px_rgba(198,255,0,0.15)]",
        )}
      />
      <div className="absolute left-1/2 top-14 h-24 w-20 -translate-x-1/2 -rotate-6 rounded-t-[2.5rem] bg-gradient-to-br from-zinc-950 via-[#151f20] to-[#C6FF00]/10 shadow-[inset_0_0_0_1px_rgba(198,255,0,0.1)]" />
      <div className="absolute left-[18%] top-24 h-4 w-28 -rotate-[28deg] rounded-full bg-[#C6FF00]/45" />
      <div className="absolute right-[17%] top-16 h-4 w-28 rotate-[24deg] rounded-full bg-[#C6FF00]/35" />
      <div className="absolute bottom-2 left-[27%] h-20 w-5 rotate-[20deg] rounded-full bg-zinc-900" />
      <div className="absolute bottom-0 right-[31%] h-24 w-5 -rotate-[18deg] rounded-full bg-zinc-900" />
      <div className="absolute bottom-3 left-[16%] size-12 rounded-full border-4 border-white/20 bg-black shadow-[0_0_24px_rgba(198,255,0,0.16)]" />
    </div>
  );
}

function StyleCard({
  title,
  copy,
  active = false,
  tone,
  icon: Icon,
  onClick,
}: (typeof styles)[number] & { active: boolean; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      className={cn(
        "relative h-[25rem] min-w-[16.5rem] overflow-hidden rounded-[1.7rem] border bg-[#0B1020]/40 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.55)] transition duration-300 cursor-pointer select-none",
        active
          ? "border-[#C6FF00] shadow-[0_0_34px_rgba(198,255,0,0.32),0_24px_70px_rgba(0,0,0,0.55)]"
          : "border-white/12 opacity-50 hover:opacity-80",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,var(--tw-gradient-from),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))]",
          tone,
        )}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0_28%,rgba(198,255,0,0.11)_28%_29%,transparent_29%_100%)] pointer-events-none" />
      {active ? (
        <div className="absolute left-5 top-5 grid size-9 place-items-center rounded-full bg-[#C6FF00] text-black shadow-[0_0_18px_rgba(198,255,0,0.45)] z-20">
          <Check className="size-5 stroke-[3]" />
        </div>
      ) : null}
      <FootballerArt active={active} />
      <div className="absolute bottom-0 left-0 right-0 p-5 text-center z-10">
        <div
          className={cn(
            "mx-auto mb-4 grid size-16 place-items-center rounded-[1.2rem] border transition duration-300",
            active
              ? "border-[#C6FF00] bg-[#C6FF00]/10 text-[#C6FF00]"
              : "border-white/14 bg-white/[0.04] text-zinc-450",
          )}
        >
          <Icon className="size-8" />
        </div>
        <h2
          className={cn(
            "text-2xl font-display uppercase italic",
            active ? "text-[#C6FF00]" : "text-white",
          )}
        >
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-[12rem] text-xs font-semibold leading-relaxed text-white/60">
          {copy}
        </p>
      </div>
    </article>
  );
}

export default function PlayStylePage() {
  const router = useRouter();
  const { playerData, updatePlayerData } = usePlayer();

  const [selectedStyle, setSelectedStyle] = useState<PlayStyleType>("Playmaker");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (playerData) {
      queueMicrotask(() => {
        setSelectedStyle(playerData.playStyle || "Playmaker");
        setBio(playerData.bio || "");
      });
    }
  }, [playerData]);

  const handlePrevStyle = () => {
    const currentIndex = styles.findIndex((s) => s.title === selectedStyle);
    const prevIndex = (currentIndex - 1 + styles.length) % styles.length;
    setSelectedStyle(styles[prevIndex].title);
  };

  const handleNextStyle = () => {
    const currentIndex = styles.findIndex((s) => s.title === selectedStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setSelectedStyle(styles[nextIndex].title);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlayerData({
      playStyle: selectedStyle,
      bio: bio.trim(),
    });
    router.push("/home");
  };

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_18%,rgba(198,255,0,0.14),transparent_25%),radial-gradient(circle_at_22%_58%,rgba(91,140,255,0.06),transparent_28%),linear-gradient(180deg,#05070B_0%,#0B1020_48%,#05070B_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[50%] bg-[linear-gradient(180deg,transparent,rgba(11,16,32,0.72)),repeating-linear-gradient(96deg,rgba(198,255,0,0.07)_0_1px,transparent_1px_52px)] opacity-75 pointer-events-none" />
      <div className="absolute right-[-4rem] top-20 hidden h-[26rem] w-[24rem] opacity-40 md:block pointer-events-none">
        <FootballerArt active />
        <div className="absolute bottom-10 left-12 size-16 rounded-full border-4 border-white/20 bg-black" />
        <Zap className="absolute right-8 top-28 size-10 rotate-12 text-[#C6FF00]/45" />
      </div>

      <section data-scroll-panel className="relative mx-auto flex h-full w-full max-w-5xl flex-col px-5 pb-8 pt-6 sm:px-8 lg:px-10 z-10 overflow-y-auto min-h-0">
        <header className="grid grid-cols-[3rem_1fr_3rem] items-center gap-4">
          <Button asChild variant="ghost" size="icon" aria-label="Back to position" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
            <Link href="/position">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#C6FF00] text-black flex items-center justify-center font-display text-base">S</div>
              <div className="font-display tracking-[0.35em] text-base">STRYK</div>
            </div>
          </div>
          <div />
        </header>

        <div className="mx-auto mt-6 flex w-full max-w-[56rem] flex-1 flex-col items-center min-h-0">
          <StepProgress />

          <div className="mt-8 text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#C6FF00] font-bold">Pick your style</p>
            <h2 className="font-display text-4xl sm:text-6xl uppercase italic leading-none tracking-wide text-white">
              DEFINE YOUR PLAY STYLE
            </h2>
            <p className="mt-3 text-sm font-semibold text-white/60">
              This shapes your identity on the pitch.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 w-full flex-1 space-y-5 pr-0.5 sm:flex-none">
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-7 w-px bg-white/25" />
                <h1 className="text-xl font-display uppercase tracking-wider">
                  Choose Your Play Style
                </h1>
                <Info className="size-4 text-white/40" />
              </div>

              <div className="relative">
                <button
                  onClick={handlePrevStyle}
                  className="absolute left-0 top-1/2 z-20 hidden size-14 -translate-y-1/2 place-items-center rounded-full border border-white/18 bg-black/35 text-white backdrop-blur-xl transition hover:border-[#C6FF00]/45 hover:text-[#C6FF00] sm:grid cursor-pointer"
                  type="button"
                  aria-label="Previous play style"
                >
                  <ChevronLeft className="size-7" />
                </button>
                <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-16">
                  {styles.map((style) => (
                    <StyleCard 
                      key={style.title} 
                      {...style} 
                      active={style.title === selectedStyle}
                      onClick={() => setSelectedStyle(style.title)}
                    />
                  ))}
                </div>
                <button
                  onClick={handleNextStyle}
                  className="absolute right-0 top-1/2 z-20 hidden size-14 -translate-y-1/2 place-items-center rounded-full border border-white/18 bg-black/35 text-white backdrop-blur-xl transition hover:border-[#C6FF00]/45 hover:text-[#C6FF00] sm:grid cursor-pointer"
                  type="button"
                  aria-label="Next play style"
                >
                  <ChevronRight className="size-7" />
                </button>
              </div>

              <div className="mt-4 flex justify-center gap-2">
                {styles.map((style) => (
                  <span
                    key={style.title}
                    className={cn(
                      "size-1.5 rounded-full transition-all duration-300",
                      style.title === selectedStyle ? "bg-[#C6FF00] w-4" : "bg-white/20",
                    )}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/8 bg-[#0B1020]/40 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-display uppercase tracking-wider">Bio</h2>
                  <p className="mt-0.5 text-xs text-white/50">
                    Write something for the back of your card...
                  </p>
                </div>
                <span className="text-xs font-bold text-white/40">{bio.length}/120</span>
              </div>
              <label className="relative mt-4 block">
                <textarea
                  className="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 pr-12 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition placeholder:text-white/30 focus:border-[#C6FF00]/50 focus:ring-1 focus:ring-[#C6FF00]/20"
                  maxLength={120}
                  placeholder="Tell your teammates who you are..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <Edit3 className="pointer-events-none absolute bottom-4 right-4 size-4 text-white/30" />
              </label>
            </section>

            <button className="h-14 w-full rounded-2xl bg-[#C6FF00] text-black font-display tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600]" type="submit">
              CREATE MY CARD <ArrowRight className="ml-auto" strokeWidth={3} size={16} />
            </button>

            <Button
              asChild
              variant="ghost"
              className="mx-auto flex h-10 w-fit px-4 text-white/50 hover:text-lime-200 cursor-pointer"
            >
              <Link href="/position">
                <ArrowLeft className="size-4" />
                Back to previous step
              </Link>
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              <BadgeCheck className="size-4 text-[#C6FF00]" />
              Ready to generate
              <Shield className="size-4 text-[#C6FF00]" />
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
