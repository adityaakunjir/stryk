"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation, useMotionValue, useTransform, animate } from "framer-motion";
import { Gauge, Sparkles, Crosshair, Zap, Shield } from "lucide-react";
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
  disableAnimation?: boolean;
};

// Counter component for the "Pack Reveal" effect
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: duration,
      ease: "easeOut",
      onUpdate: (v) => setCount(Math.round(v)),
    });
    return controls.stop;
  }, [value, duration]);

  return <>{count}</>;
}

const getStyleConfig = (styleName: string) => {
  const s = styleName?.toLowerCase() || "";
  if (s.includes("speed")) return { color: "#00E5FF", icon: Gauge };
  if (s.includes("playmaker")) return { color: "#C6FF00", icon: Sparkles };
  if (s.includes("poach") || s.includes("finish")) return { color: "#A78BFA", icon: Crosshair };
  if (s.includes("box")) return { color: "#FCD34D", icon: Zap };
  return { color: "#3B82F6", icon: Shield };
};

export function PlayerCard({ player, size = "md", onClick, customStats, disableAnimation = false }: Props) {
  const isMock = "stats" in player && "ovr" in player;
  
  const name = isMock ? player.name : player.fullName;
  const username = player.username;
  const position = player.position;
  const ovr = isMock ? player.ovr : player.rating;
  const style = isMock ? player.style : player.playStyle;
  const foot = isMock ? player.foot : player.strongFoot === "Left" ? "L" : "R";
  const nation = isMock ? player.nation : "IND";
  const playerId = isMock ? player.matches : (("id" in player && player.id) ? player.id : 1);
  const avatar = isMock ? player.avatarUrl : player.avatar;

  const dims = {
    sm: "w-44 h-64",
    md: "w-60 h-[22rem]",
    lg: "w-72 h-[26rem]"
  }[size];

  const config = getStyleConfig(style);
  const Icon = config.icon;

  let statsToDisplay: { label: string; value: number }[] = [];
  if (customStats) {
    statsToDisplay = customStats;
  } else if (isMock && player.stats) {
    statsToDisplay = Object.entries(player.stats).map(([k, v]) => ({ label: k, value: v }));
  } else if (isMock) {
    statsToDisplay = calculateStats({ position, playStyle: style });
  } else {
    statsToDisplay = calculateStats(player);
  }

  // Idle Animation Engine
  const controls = useAnimation();
  
  useEffect(() => {
    if (disableAnimation) return;
    controls.start({
      rotateX: [0, 2, 0, -2, 0],
      rotateY: [0, -3, 0, 3, 0],
      y: [0, -4, 0, 4, 0],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
    });
  }, [controls, disableAnimation]);

  return (
    <motion.button
      onClick={onClick}
      animate={controls}
      className={`group relative ${dims} shrink-0 rounded-[28px] overflow-hidden text-left transition-transform duration-300 focus:outline-none cursor-pointer`}
      style={{
        background: `linear-gradient(160deg, #1A2540 0%, #0B1020 45%, #05070B 100%)`,
        boxShadow: `0 0 0 1px ${config.color}40, 0 30px 60px -20px ${config.color}40, inset 0 1px 0 rgba(255,255,255,0.08)`,
        transformPerspective: 1000
      }}
    >
      {/* Dynamic Aura */}
      <div
        className="absolute inset-0 opacity-80 mix-blend-screen pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(120% 60% at 50% -10%, ${config.color}40 0%, transparent 55%), radial-gradient(80% 50% at 110% 110%, ${config.color}20 0%, transparent 60%)`
        }}
      />
      
      {/* Light Sweep Animation */}
      {!disableAnimation && (
        <motion.div
          className="absolute -inset-x-10 -top-10 h-64 rotate-12 opacity-30 pointer-events-none mix-blend-overlay"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)" }}
          animate={{ x: ["-200%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
        />
      )}

      {/* Top row */}
      <div className="absolute inset-x-0 top-0 px-5 pt-4 flex items-start justify-between z-10">
        <div className="flex flex-col items-center">
          <div className="font-display leading-none" style={{ color: config.color, fontSize: size === "lg" ? "3rem" : size === "md" ? "2.5rem" : "2rem", textShadow: `0 0 20px ${config.color}80` }}>
            {!disableAnimation ? <AnimatedCounter value={ovr} duration={2.5} /> : ovr}
          </div>
          <div className="font-display text-white/90 -mt-1 tracking-wider" style={{ fontSize: size === "sm" ? "0.875rem" : "1.125rem" }}>
            {position}
          </div>
          
          {/* Archetype Badge */}
          <div className="mt-1 flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/10" style={{ borderColor: `${config.color}30` }}>
            <Icon size={8} style={{ color: config.color }} />
            <span className="text-[7px] font-bold uppercase tracking-widest text-white/80">{style.split('-')[0]}</span>
          </div>

          <div className="mt-2 text-[10px] tracking-widest text-white/60 uppercase">{nation}</div>
          <div className="mt-1 text-[10px] tracking-wider text-white/60 uppercase">{foot}</div>
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
            WebkitMaskImage: "radial-gradient(60% 70% at 50% 50%, #000 60%, transparent 100%)"
          }}
        >
          {avatar ? (
            <ImageWithFallback src={avatar} alt={name} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-950 to-black">
              <div className="absolute left-1/2 top-[18%] h-[28%] w-[28%] -translate-x-1/2 rounded-full bg-gradient-to-br from-zinc-300 via-zinc-700 to-black shadow-[0_0_24px_rgba(255,255,255,0.12)]" />
              <div className="absolute left-1/2 top-[41%] h-[46%] w-[58%] -translate-x-1/2 rounded-t-[42%] bg-gradient-to-br from-zinc-100 via-zinc-800 to-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#05070B] to-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom block */}
      <div className="absolute inset-x-0 bottom-0 p-5 z-10 bg-gradient-to-t from-[#05070B] via-[#05070B]/80 to-transparent pt-12">
        <div className="font-display text-white tracking-wide truncate" style={{ fontSize: size === "lg" ? "1.75rem" : "1.375rem" }}>
          {name ? name.toUpperCase() : "PLAYER NAME"}
        </div>
        <div className="text-[11px] font-bold tracking-wider uppercase mb-3" style={{ color: config.color }}>
          @{username || "username"}
        </div>

        {size !== "sm" && (
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 pt-3 border-t border-white/10">
            {statsToDisplay.map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="font-display text-white" style={{ fontSize: "1.125rem" }}>
                  {!disableAnimation ? <AnimatedCounter value={value} duration={1.5} /> : value}
                </span>
                <span className="text-[10px] font-bold tracking-[0.15em] text-white/40 uppercase">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
}
