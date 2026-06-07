"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Crown, Target, Zap, Shield, Hand, Footprints, Loader2, Check } from "lucide-react";
import { usePlayer } from "@/components/player-context";

export default function SubmitPage() {
  const router = useRouter();
  const { playerData, updatePlayerData, isLoaded } = usePlayer();
  
  const [stats, setStats] = useState({
    Goals: 2,
    Assists: 1,
    Tackles: 4,
    Saves: 0,
    Intercepts: 3,
  });

  const [submitted, setSubmitted] = useState(false);

  if (!isLoaded) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white flex items-center justify-center">
        <Loader2 className="size-10 text-[#C6FF00] animate-spin" />
      </main>
    );
  }

  const statIcons = {
    Goals: Target,
    Assists: Zap,
    Tackles: Footprints,
    Saves: Hand,
    Intercepts: Shield,
  };

  const handleIncrement = (key: keyof typeof stats) => {
    setStats((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const handleDecrement = (key: keyof typeof stats) => {
    setStats((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    
    updatePlayerData({
      matchesPlayed: (playerData.matchesPlayed ?? 25) + 1,
      wins: (playerData.wins ?? 17) + 1,
      draws: playerData.draws ?? 6,
      losses: playerData.losses ?? 2,
      goals: (playerData.goals ?? 12) + stats.Goals,
      assists: (playerData.assists ?? 14) + stats.Assists,
      tackles: (playerData.tackles ?? 18) + stats.Tackles,
      saves: (playerData.saves ?? 0) + stats.Saves,
      intercepts: (playerData.intercepts ?? 15) + stats.Intercepts,
    });

    setTimeout(() => {
      router.push("/home");
    }, 1500);
  };

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B]">
      <div data-scroll-panel className="relative h-full flex flex-col px-5 pt-6 pb-4 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Btn onClick={() => router.push("/home")}><ArrowLeft size={16} /></Btn>
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/45 font-bold">Post-Match</div>
            <div className="font-display tracking-wide text-sm uppercase">SUBMIT STATS</div>
          </div>
          <div className="w-9 h-9" />
        </div>

        {/* Match Header */}
        <div className="mt-4 rounded-2xl p-4 border border-white/10 bg-white/[0.03] flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-white/45 font-bold">Friday League</div>
            <div className="font-display tracking-wide text-lg">ALPHA 4 — 3 BRAVO</div>
            <div className="text-[10px] text-white/45 mt-1 font-semibold">Turf Yard · Today</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.22em] uppercase text-[#C6FF00] font-bold">Win</div>
            <div className="font-display text-2xl text-[#C6FF00]">W</div>
          </div>
        </div>

        {/* Stats Steppers */}
        <div className="mt-4 space-y-2 flex-1 pr-0.5">
          {Object.entries(stats).map(([key, value]) => {
            const Icon = statIcons[key as keyof typeof stats];
            return (
              <div key={key} className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-white/8 bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#C6FF00]">
                  <Icon size={14} />
                </div>
                <div className="flex-1 text-sm font-semibold text-white/80">{key}</div>
                <div className="flex items-center gap-3">
                  <StepBtn onClick={() => handleDecrement(key as keyof typeof stats)}><Minus size={12} /></StepBtn>
                  <div className="w-7 text-center font-display text-lg">{value}</div>
                  <StepBtn onClick={() => handleIncrement(key as keyof typeof stats)} accent><Plus size={12} /></StepBtn>
                </div>
              </div>
            );
          })}
        </div>

        {/* MVP Vote */}
        <div className="mt-4 rounded-2xl p-4 border border-[#C6FF00]/30"
          style={{ background: "linear-gradient(135deg, rgba(198,255,0,0.10), transparent)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Crown size={14} className="text-[#C6FF00]" />
            <div className="text-[10px] tracking-[0.25em] uppercase text-[#C6FF00] font-bold">MVP Vote</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full overflow-hidden border border-white/10 bg-zinc-800">
              {playerData.avatar ? (
                <img src={playerData.avatar} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-700 via-zinc-950 to-black opacity-80" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{playerData.fullName || "Player"}</div>
              <div className="text-[10px] text-white/50 truncate font-semibold">@{playerData.username || "username"} · {playerData.position || "CAM"}</div>
            </div>
            <button className="rounded-full px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase bg-white/5 border border-white/10 font-bold hover:bg-white/10 cursor-pointer">Change</button>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-4">
          <button 
            onClick={handleSubmit}
            disabled={submitted}
            className="w-full rounded-2xl py-3.5 bg-[#C6FF00] text-black font-display tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600] disabled:opacity-80" 
            style={{ fontSize: "0.875rem", boxShadow: "0 20px 40px -10px rgba(198,255,0,0.5)" }}
          >
            {submitted ? (
              <>
                <Check size={14} strokeWidth={3} /> STATS SUBMITTED!
              </>
            ) : (
              "SUBMIT FOR VERIFICATION"
            )}
          </button>
          <div className="text-center text-[10px] text-white/40 mt-2 font-semibold">3 of 7 teammates must approve</div>
        </div>
      </div>
    </main>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10">{children}</button>;
}

function StepBtn({ children, accent, onClick }: { children: React.ReactNode; accent?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition duration-150"
      style={{
        background: accent ? "#C6FF00" : "rgba(255,255,255,0.06)",
        color: accent ? "#05070B" : "#fff",
        border: accent ? "none" : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {children}
    </button>
  );
}
