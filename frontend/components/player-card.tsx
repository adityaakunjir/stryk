"use client";

import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PlayerData } from "./player-context";
import { calculateStats } from "@/lib/stat-utils";

export type PlayerStats = {
  PAC: number;
  SHO: number;
  PAS: number;
  DRI: number;
  DEF: number;
  PHY: number;
};

export type PlayerMockType = {
  name: string;
  username: string;
  position: string;
  ovr: number;
  style: string;
  foot: "L" | "R";
  nation: string;
  matches: number;
  stats: PlayerStats;
  avatarUrl: string;
};

type Props = {
  player: PlayerData | PlayerMockType;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  customStats?: { label: string; value: number }[];
};

function getStatsHelper(position: string, playStyle: string) {
  return calculateStats({ position, playStyle });
}

export function PlayerCard({ player, size = "md", onClick, customStats }: Props) {
  // Normalize fields across PlayerData (Context) and PlayerMockType (Figma)
  const isMock = "stats" in player && "ovr" in player;
  
  const name = isMock ? player.name : player.fullName;
  const username = player.username;
  const position = player.position;
  const ovr = isMock ? player.ovr : player.rating;
  const style = isMock ? player.style : player.playStyle;
  const foot = isMock ? player.foot : player.strongFoot === "Left" ? "L" : "R";
  const nation = isMock ? player.nation : "IND";
  const matches = isMock ? player.matches : (player.matchesPlayed ?? 0);
  const playerId = isMock ? player.matches : (("id" in player && player.id) ? player.id : 1);
  const avatar = isMock ? player.avatarUrl : player.avatar;

  const dims = {
    sm: "w-44 h-64",
    md: "w-60 h-[22rem]",
    lg: "w-72 h-[26rem]",
  }[size];

  // Resolve stats to display
  let statsToDisplay: { label: string; value: number }[] = [];
  if (customStats) {
    statsToDisplay = customStats;
  } else if (isMock && player.stats) {
    statsToDisplay = Object.entries(player.stats).map(([k, v]) => ({ label: k, value: v }));
  } else if (isMock) {
    statsToDisplay = getStatsHelper(position, style);
  } else {
    statsToDisplay = calculateStats(player);
  }

  return (
    <button
      onClick={onClick}
      className={`group relative ${dims} shrink-0 rounded-[28px] overflow-hidden text-left transition-transform duration-300 stryk-card-interactive focus:outline-none`}
      style={{
        background: "linear-gradient(160deg, #1A2540 0%, #0B1020 45%, #05070B 100%)",
        boxShadow: "0 0 0 1px rgba(198,255,0,0.25), 0 30px 60px -20px rgba(198,255,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Holographic shimmer */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 mix-blend-screen pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -10%, rgba(198,255,0,0.35) 0%, transparent 55%), radial-gradient(80% 50% at 110% 110%, rgba(91,140,255,0.25) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -inset-x-10 -top-10 h-40 rotate-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        }}
      />

      {/* Top row */}
      <div className="absolute inset-x-0 top-0 px-5 pt-4 flex items-start justify-between z-10">
        <div className="flex flex-col items-center">
          <div className="font-display text-[var(--stryk-lime)] leading-none" style={{ fontSize: size === "lg" ? "3rem" : size === "md" ? "2.5rem" : "2rem" }}>
            {ovr}
          </div>
          <div className="font-display text-white/90 -mt-1" style={{ fontSize: size === "sm" ? "0.875rem" : "1.125rem" }}>
            {position}
          </div>
          <div className="mt-1 w-7 h-[2px] bg-[var(--stryk-lime)]/60 rounded-full" />
          <div className="mt-2 text-[10px] tracking-widest text-white/60 uppercase">
            {nation}
          </div>
          <div className="mt-2 text-[10px] tracking-wider text-white/60 uppercase">
            {foot} • {style.slice(0, 3).toUpperCase()}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] tracking-[0.25em] text-white/40 uppercase">STRYK</div>
          <div className="font-display text-white/80" style={{ fontSize: "0.875rem" }}>
            ID · {playerId.toString().padStart(3, "0")}
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="absolute inset-x-0 top-6 bottom-[42%] flex items-center justify-center z-0">
        <div
          className="relative w-full h-full"
          style={{
            maskImage: "radial-gradient(60% 70% at 50% 50%, #000 60%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(60% 70% at 50% 50%, #000 60%, transparent 100%)",
          }}
        >
          {avatar ? (
            <ImageWithFallback
              src={avatar}
              alt={name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-950 to-black">
              <div className="absolute left-1/2 top-[18%] h-[28%] w-[28%] -translate-x-1/2 rounded-full bg-gradient-to-br from-zinc-300 via-zinc-700 to-black shadow-[0_0_24px_rgba(255,255,255,0.12)]" />
              <div className="absolute left-1/2 top-[41%] h-[46%] w-[58%] -translate-x-1/2 rounded-t-[42%] bg-gradient-to-br from-zinc-100 via-zinc-800 to-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" />
              <div className="absolute left-[17%] top-[55%] h-[27%] w-[34%] -rotate-12 rounded-[45%] bg-gradient-to-br from-white/85 to-zinc-400/60" />
              <div className="absolute right-[17%] top-[55%] h-[27%] w-[34%] rotate-12 rounded-[45%] bg-gradient-to-bl from-white/85 to-zinc-400/60" />
              <div className="absolute left-1/2 top-[50%] h-[32%] w-[22%] -translate-x-1/2 rounded-b-[35%] bg-gradient-to-b from-zinc-950/95 to-black/70" />
              <div className="absolute left-1/2 top-[49%] h-[8%] w-[38%] -translate-x-1/2 rounded-full bg-white/75" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#05070B] to-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom block */}
      <div className="absolute inset-x-0 bottom-0 p-5 z-10">
        <div
          className="font-display text-white tracking-wide truncate"
          style={{ fontSize: size === "lg" ? "1.75rem" : "1.375rem" }}
        >
          {name ? name.toUpperCase() : "PLAYER NAME"}
        </div>
        <div className="text-[11px] tracking-wider text-[var(--stryk-lime)]/80 uppercase mb-3">
          @{username || "username"} · {style}
        </div>

        {size !== "sm" && (
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 pt-3 border-t border-white/10">
            {statsToDisplay.map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="font-display text-white" style={{ fontSize: "1.125rem" }}>
                  {value}
                </span>
                <span className="text-[10px] tracking-[0.15em] text-white/55 uppercase">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
