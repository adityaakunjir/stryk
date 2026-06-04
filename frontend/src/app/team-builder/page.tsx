"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shuffle, Check, Loader2 } from "lucide-react";
import { usePlayer } from "@/components/player-context";

const BENCH_FRIENDS = [
  { name: "Vikram", pos: "ST", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Rohan", pos: "CM", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Kabir", pos: "GK", avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Dev", pos: "CB", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
];

export default function TeamBuilderPage() {
  const router = useRouter();
  const { playerData, isLoaded } = usePlayer();
  const [activeTeamTab, setActiveTeamTab] = useState("alpha");

  if (!isLoaded) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white flex items-center justify-center">
        <Loader2 className="size-10 text-[#C6FF00] animate-spin" />
      </main>
    );
  }

  const userFirstName = (playerData.fullName || "Player").split(" ")[0];
  const userPosition = playerData.position || "CAM";
  const userOVR = playerData.rating || 82;

  // Render player layout dynamically
  const teamA = [
    { name: userFirstName, pos: userPosition, ovr: userOVR, x: 50, y: 55, isUser: true },
    { name: "Kabir", pos: "GK", ovr: 84, x: 50, y: 90 },
    { name: "Dev", pos: "CB", ovr: 76, x: 30, y: 72 },
    { name: "Yash", pos: "RB", ovr: 74, x: 75, y: 70 },
    { name: "Ishaan", pos: "LW", ovr: 81, x: 22, y: 35 },
  ];

  return (
    <main className="relative min-h-screen text-white overflow-hidden bg-[#05070B]">
      <div className="relative min-h-screen flex flex-col px-5 pt-6 pb-4 max-w-md mx-auto z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Btn onClick={() => router.push("/lobbies")}><ArrowLeft size={16} /></Btn>
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/45 font-bold">Team Builder</div>
            <div className="font-display tracking-wide text-sm uppercase">FRIDAY LEAGUE</div>
          </div>
          <Btn><Shuffle size={16} /></Btn>
        </div>

        {/* Team Chips */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <TeamChip 
            color="#C6FF00" 
            name="TEAM ALPHA" 
            avg={80} 
            count={5} 
            active={activeTeamTab === "alpha"} 
            onClick={() => setActiveTeamTab("alpha")}
          />
          <TeamChip 
            color="#5B8CFF" 
            name="TEAM BRAVO" 
            avg={77} 
            count={4} 
            active={activeTeamTab === "bravo"}
            onClick={() => setActiveTeamTab("bravo")}
          />
        </div>

        {/* Pitch Display */}
        <div className="mt-4 relative flex-1 rounded-2xl overflow-hidden border border-white/10 min-h-[320px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(198,255,0,0.06), rgba(91,140,255,0.06)), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 28px, transparent 28px 56px)",
          }}>
          {/* Markings */}
          <div className="absolute inset-3 border border-white/15 rounded-md pointer-events-none" />
          <div className="absolute left-1/2 top-3 bottom-3 w-px bg-white/15 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 pointer-events-none" />
          {/* Penalty box */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 w-32 h-12 border border-white/15 border-b-0 pointer-events-none" />
          <div className="absolute left-1/2 -translate-x-1/2 top-3 w-32 h-12 border border-white/15 border-t-0 pointer-events-none" />

          {/* Players overlay */}
          {activeTeamTab === "alpha" ? (
            teamA.map((p) => (
              <div
                key={p.name}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-display text-xs border"
                  style={{
                    background: p.isUser ? "#C6FF00" : "rgba(255,255,255,0.1)",
                    color: p.isUser ? "#05070B" : "#FFFFFF",
                    borderColor: p.isUser ? "none" : "rgba(255,255,255,0.2)",
                    boxShadow: p.isUser ? "0 8px 18px -6px rgba(198,255,0,0.7)" : "none",
                  }}
                >
                  {p.ovr}
                </div>
                <div className="mt-0.5 px-1.5 py-0.5 rounded text-[8px] bg-black/60 backdrop-blur tracking-[0.15em] uppercase font-bold text-white/80">
                  {p.pos}
                </div>
                <div className={`text-[9px] mt-0.5 font-bold ${p.isUser ? "text-[#C6FF00]" : "text-white/85"}`}>
                  {p.name.toUpperCase()}
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Bravo Team Pitch Preview */}
              <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: "50%", top: "25%" }}>
                <div className="w-9 h-9 rounded-full bg-[#5B8CFF] text-[#05070B] flex items-center justify-center font-display text-xs">82</div>
                <div className="mt-0.5 px-1.5 py-0.5 rounded text-[8px] bg-black/60 tracking-wider uppercase font-bold">ST</div>
                <div className="text-[9px] mt-0.5 font-bold">VIKRAM</div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: "30%", top: "50%" }}>
                <div className="w-9 h-9 rounded-full bg-[#5B8CFF] text-[#05070B] flex items-center justify-center font-display text-xs">79</div>
                <div className="mt-0.5 px-1.5 py-0.5 rounded text-[8px] bg-black/60 tracking-wider uppercase font-bold">CM</div>
                <div className="text-[9px] mt-0.5 font-bold">ROHAN</div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: "70%", top: "50%" }}>
                <div className="w-9 h-9 rounded-full bg-[#5B8CFF] text-[#05070B] flex items-center justify-center font-display text-xs">81</div>
                <div className="mt-0.5 px-1.5 py-0.5 rounded text-[8px] bg-black/60 tracking-wider uppercase font-bold">LW</div>
                <div className="text-[9px] mt-0.5 font-bold">ISHAAN</div>
              </div>
              <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: "50%", top: "90%" }}>
                <div className="w-9 h-9 rounded-full bg-white/10 text-white/75 border border-white/20 flex items-center justify-center font-display text-xs">75</div>
                <div className="mt-0.5 px-1.5 py-0.5 rounded text-[8px] bg-black/60 tracking-wider uppercase font-bold">GK</div>
                <div className="text-[9px] mt-0.5 font-bold">GUEST</div>
              </div>
            </>
          )}

          {/* Empty slot on pitch (Team Alpha) */}
          {activeTeamTab === "alpha" && (
            <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: "78%", top: "35%" }}>
              <div className="w-9 h-9 rounded-full border border-dashed border-white/30 flex items-center justify-center text-white/40 text-xs hover:border-white/50 cursor-pointer">+</div>
              <div className="mt-0.5 px-1.5 py-0.5 rounded text-[8px] bg-black/40 tracking-[0.15em] uppercase text-white/45 font-bold">RW</div>
            </div>
          )}
        </div>

        {/* Bench Row */}
        <div className="mt-4">
          <div className="text-[10px] tracking-[0.25em] uppercase text-white/45 mb-2 font-bold">Bench · Drag to assign</div>
          <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BENCH_FRIENDS.map((f) => (
              <div key={f.name} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
                <div className="relative">
                  <img src={f.avatar} alt={f.name} className="w-10 h-10 rounded-full object-cover border border-white/10 transition group-hover:border-[#C6FF00]/40" />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[7px] bg-black/80 tracking-wider uppercase font-bold border border-white/10 text-white/80">{f.pos}</span>
                </div>
                <span className="text-[10px] text-white/60">{f.name}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => router.push("/home")}
          className="mt-4 w-full rounded-2xl py-3.5 bg-[#C6FF00] text-black font-display tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600]"
          style={{ fontSize: "0.875rem" }}
        >
          <Check size={14} strokeWidth={3} /> LOCK TEAMS
        </button>
      </div>
    </main>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10">
      {children}
    </button>
  );
}

function TeamChip({ color, name, avg, count, active, onClick }: { color: string; name: string; avg: number; count: number; active?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl px-3.5 py-2.5 border flex items-center justify-between cursor-pointer select-none transition duration-200"
      style={{
        borderColor: active ? color : "rgba(255,255,255,0.08)",
        background: active ? `linear-gradient(135deg, ${color}22, transparent)` : "rgba(255,255,255,0.03)",
      }}
    >
      <div>
        <div className="font-display tracking-wide text-sm" style={{ color }}>{name}</div>
        <div className="text-[10px] text-white/55 mt-0.5">{count} Players</div>
      </div>
      <div className="text-right">
        <div className="text-[9px] tracking-[0.2em] uppercase text-white/45 font-bold">AVG</div>
        <div className="font-display text-lg" style={{ color }}>{avg}</div>
      </div>
    </div>
  );
}
