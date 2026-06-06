"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Footprints,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player-context";
import { cn } from "@/lib/utils";

const positions = [
  { code: "GK", name: "Goalkeeper", x: 50, y: 90 },
  { code: "LB", name: "Left Back", x: 18, y: 74 },
  { code: "CB", name: "Center Back", x: 38, y: 78 },
  { code: "CB_R", name: "Center Back", codeDisplay: "CB", x: 62, y: 78 },
  { code: "RB", name: "Right Back", x: 82, y: 74 },
  { code: "CDM", name: "Defensive Midfielder", x: 50, y: 60 },
  { code: "LM", name: "Left Midfielder", x: 20, y: 46 },
  { code: "CM", name: "Center Midfielder", x: 38, y: 47 },
  { code: "CM_R", name: "Center Midfielder", codeDisplay: "CM", x: 62, y: 47 },
  { code: "RM", name: "Right Midfielder", x: 80, y: 46 },
  { code: "CAM", name: "Attacking Midfielder", x: 50, y: 32 },
  { code: "LW", name: "Left Winger", x: 22, y: 18 },
  { code: "ST", name: "Striker", x: 50, y: 14 },
  { code: "RW", name: "Right Winger", x: 78, y: 18 },
];

function StepProgress() {
  return (
    <div className="flex items-center gap-2" aria-label="Step 2 of 3">
      <div className="grid size-9 place-items-center rounded-full bg-[#C6FF00] text-black shadow-[0_0_24px_rgba(198,255,0,0.34)]">
        <Check className="size-5 stroke-[3]" />
      </div>
      <div className="h-px w-10 bg-[#C6FF00] sm:w-16" />
      <div className="grid size-10 place-items-center rounded-full bg-[#C6FF00] text-sm font-display tracking-wider text-black shadow-[0_0_26px_rgba(198,255,0,0.45)]">
        2
      </div>
      <div className="h-px w-10 bg-white/10 sm:w-16" />
      <div className="grid size-9 place-items-center rounded-full border border-white/12 bg-white/5 text-white/55 text-sm font-display">
        3
      </div>
    </div>
  );
}

export default function PositionPage() {
  const router = useRouter();
  const { playerData, updatePlayerData } = usePlayer();

  const [selectedPosition, setSelectedPosition] = useState("CAM");
  const [secondaryPosition, setSecondaryPosition] = useState("");
  const [strongFoot, setStrongFoot] = useState<"Left" | "Right">("Left");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (playerData) {
      queueMicrotask(() => {
        setSelectedPosition(playerData.position || "CAM");
        setSecondaryPosition(playerData.secondaryPosition || "");
        setStrongFoot(playerData.strongFoot || "Left");
      });
    }
  }, [playerData]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlayerData({
      position: selectedPosition,
      secondaryPosition: secondaryPosition,
      strongFoot: strongFoot,
    });
    router.push("/play-style");
  };

  const handleSelectPosition = (code: string) => {
    const cleanCode = code.split("_")[0]; // GK, CB, CM, etc.
    setSelectedPosition(cleanCode);
    if (secondaryPosition === cleanCode) {
      setSecondaryPosition("");
    }
  };

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_18%,rgba(198,255,0,0.12),transparent_25%),radial-gradient(circle_at_22%_64%,rgba(91,140,255,0.06),transparent_28%),linear-gradient(180deg,#05070B_0%,#0B1020_48%,#05070B_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[50%] bg-[linear-gradient(180deg,transparent,rgba(11,16,32,0.72)),repeating-linear-gradient(96deg,rgba(198,255,0,0.04)_0_1px,transparent_1px_52px)] opacity-75 pointer-events-none" />

      <section data-scroll-panel className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col px-5 pb-4 pt-6 sm:max-w-5xl sm:px-8 lg:px-10 overflow-y-auto min-h-0">
        <header className="grid grid-cols-[3rem_1fr_3rem] items-center gap-4">
          <Button asChild variant="ghost" size="icon" aria-label="Back to identity" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
            <Link href="/identity">
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

        <div className="mx-auto mt-2 flex w-full max-w-[56rem] flex-1 flex-col items-center sm:mt-6 min-h-0">
          <div className="hidden sm:block"><StepProgress /></div>

          <div className="mt-3 w-full text-left sm:mt-8 sm:text-center">
            <div className="mb-3 hidden h-1 overflow-hidden rounded-full bg-white/10 sm:block">
              <div className="h-full w-2/3 bg-[#C6FF00]" />
            </div>
            <div className="mb-3 flex items-center justify-center gap-12 text-[9px] font-black uppercase tracking-[0.28em] text-white/35 sm:hidden">
              <span>Step 2 / 3</span>
              <span>Skip</span>
            </div>
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/10 sm:hidden">
              <div className="h-full w-2/3 bg-[#C6FF00]" />
            </div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#C6FF00] font-bold">Pick your role</p>
            <h2 className="font-display text-3xl uppercase italic leading-none tracking-wide text-white sm:text-6xl">
              WHERE DO YOU PLAY?
            </h2>
            <p className="mt-3 hidden text-sm font-semibold text-white/60 sm:block">
              Tell us where you dominate the pitch.
            </p>
          </div>

          <form onSubmit={handleNext} className="mt-4 w-full space-y-2.5 sm:mt-8 sm:space-y-4">
            {/* Tactical Pitch Selector */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:rounded-[2.2rem] sm:border-white/8 sm:bg-[#0B1020]/50 sm:p-7">
              <div className="hidden flex-wrap items-start justify-between gap-3 sm:flex">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-display uppercase tracking-wider">
                      Preferred Position
                    </h1>
                    <Info className="size-4 text-white/40" />
                  </div>
                  <p className="mt-0.5 text-xs text-white/50">
                    Your primary position on the field
                  </p>
                </div>
                <div className="rounded-full border border-[#C6FF00]/22 bg-[#C6FF00]/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C6FF00]">
                  {selectedPosition} Selected
                </div>
              </div>

              {/* Pitch layout */}
              <div className="relative aspect-[1.44] min-h-[148px] overflow-hidden rounded-xl border border-white/10 sm:mt-6 sm:aspect-[1.18] sm:min-h-[400px] sm:rounded-2xl"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(198,255,0,0.06), rgba(91,140,255,0.06)), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 24px, transparent 24px 48px)",
                }}>
                <div className="absolute inset-3 border border-white/15 rounded" />
                <div className="absolute left-3 right-3 top-1/2 h-px bg-white/15" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/15" />

                {positions.map((p, i) => {
                  const displayCode = p.codeDisplay || p.code.split("_")[0];
                  const isActive = selectedPosition === displayCode;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectPosition(p.code)}
                      className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-[9px] tracking-wider transition duration-300 cursor-pointer sm:h-9 sm:w-9 sm:text-xs"
                      type="button"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        background: isActive ? "#C6FF00" : "rgba(255,255,255,0.06)",
                        color: isActive ? "#05070B" : "rgba(255,255,255,0.7)",
                        border: isActive ? "none" : "1px solid rgba(255,255,255,0.12)",
                        boxShadow: isActive ? "0 10px 24px -6px rgba(198,255,0,0.6)" : "none",
                      }}
                      title={p.name}
                    >
                      {displayCode}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Secondary Position */}
            <section className="grid grid-cols-2 gap-2 sm:gap-4 sm:rounded-3xl sm:border sm:border-white/8 sm:bg-[#0B1020]/40 sm:p-5 sm:shadow-[0_18px_70px_rgba(0,0,0,0.42)] sm:backdrop-blur-xl md:grid-cols-[1fr_0.9fr] md:items-center md:p-6">
              <div className="rounded-2xl border border-[#C6FF00]/45 bg-[#C6FF00]/8 px-3 py-2.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/40">Primary</div>
                <div className="font-display text-xl leading-none text-[#C6FF00]">{selectedPosition}</div>
                <p className="mobile-compact-hidden mt-0.5 text-xs text-white/50">
                  Your primary position on the field
                </p>
              </div>

              <div className="relative">
                <div className="sm:hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/40">Secondary</div>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="mt-1 flex w-full items-center justify-between text-left font-display text-xl leading-none text-white/80 cursor-pointer"
                    type="button"
                  >
                    {secondaryPosition || "CM"}
                    <ChevronDown className="size-4 text-white/50" />
                  </button>
                </div>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="hidden h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 text-left text-xs font-semibold text-white/80 transition hover:border-[#C6FF00]/45 hover:text-white sm:flex cursor-pointer"
                  type="button"
                >
                  {secondaryPosition ? positions.find(p => p.code.split("_")[0] === secondaryPosition)?.name || secondaryPosition : "Select position"}
                  <ChevronDown className="size-5 text-white/50" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 top-[110%] z-50 max-h-48 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0B1020] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
                    <button
                      onClick={() => { setSecondaryPosition(""); setIsDropdownOpen(false); }}
                      className="block w-full rounded-lg px-4 py-2 text-left text-xs font-semibold text-white/45 hover:bg-white/5 hover:text-white cursor-pointer"
                      type="button"
                    >
                      None (Optional)
                    </button>
                    {positions
                      .filter(p => p.code.split("_")[0] !== selectedPosition)
                      .reduce((acc, current) => {
                        // Unique filter
                        const code = current.code.split("_")[0];
                        const found = acc.find(item => item.code.split("_")[0] === code);
                        if (!found) acc.push(current);
                        return acc;
                      }, [] as typeof positions)
                      .map((p) => {
                        const displayCode = p.codeDisplay || p.code.split("_")[0];
                        return (
                          <button
                            key={p.code}
                            onClick={() => { setSecondaryPosition(displayCode); setIsDropdownOpen(false); }}
                            className="block w-full rounded-lg px-4 py-2 text-left text-xs font-semibold text-white/85 hover:bg-[#C6FF00]/10 hover:text-[#C6FF00] cursor-pointer"
                            type="button"
                          >
                            {displayCode} - {p.name}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </section>

            {/* Strong Foot */}
            <section className="grid gap-2 rounded-2xl border border-white/8 bg-[#0B1020]/40 p-3 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:grid-cols-[1fr_1.1fr] sm:items-center sm:gap-4 sm:rounded-3xl sm:p-6">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.22em] text-white/45 sm:text-lg sm:font-display sm:tracking-wider sm:text-white">
                  Strong Foot
                </h2>
                <p className="mobile-compact-hidden mt-0.5 text-xs text-white/50">
                  Which foot do you trust the most?
                </p>
              </div>
              <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
                <button
                  onClick={() => setStrongFoot("Left")}
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-lg text-xs font-display tracking-wider transition cursor-pointer",
                    strongFoot === "Left"
                      ? "border border-[#C6FF00]/40 bg-[#C6FF00]/10 text-[#C6FF00] shadow-[0_0_16px_rgba(198,255,0,0.15)]"
                      : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                  )}
                  type="button"
                >
                  <Footprints className="size-4" />
                  LEFT FOOT
                </button>
                <button
                  onClick={() => setStrongFoot("Right")}
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-lg text-xs font-display tracking-wider transition cursor-pointer",
                    strongFoot === "Right"
                      ? "border border-[#C6FF00]/40 bg-[#C6FF00]/10 text-[#C6FF00] shadow-[0_0_16px_rgba(198,255,0,0.15)]"
                      : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                  )}
                  type="button"
                >
                  <Footprints className="size-4 opacity-70" />
                  RIGHT FOOT
                </button>
              </div>
            </section>

            <button className="h-12 w-full rounded-2xl bg-[#C6FF00] text-black font-display tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600] sm:h-14" type="submit">
              CONTINUE <ArrowRight className="ml-auto" strokeWidth={3} size={16} />
            </button>

            <Button
              asChild
              variant="ghost"
              className="mobile-compact-hidden mx-auto flex h-10 w-fit px-4 text-white/50 hover:text-lime-200 cursor-pointer"
            >
              <Link href="/identity">
                <ArrowLeft className="size-4" />
                Back to previous step
              </Link>
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
