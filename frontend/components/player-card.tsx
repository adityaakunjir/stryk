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
      className={`group relative shrink-0 overflow-hidden text-left transition-transform duration-300 focus:outline-none cursor-pointer hover:scale-[1.025] ${size === 'sm' ? 'w-44' : size === 'lg' ? 'w-72' : 'w-60'}`}
      style={{
        transformPerspective: 1000,
        aspectRatio: '1417/1878'
      }}
    >
      {/* Main Card Container */}
      
      {/* 1. Card Base (Crystal Texture) - Bottom Layer */}
      <img 
        src="/player_card.webp" 
        alt="Card Base" 
        className="absolute inset-0 z-10 h-full w-full object-contain pointer-events-none" 
      />

      {/* PLAYER IMAGE */}
      <div className="absolute inset-0 z-20 flex justify-center overflow-hidden pointer-events-none">
        
        {/* Soft glow behind player */}
        <div className="absolute top-[18%] w-[55%] h-[55%] rounded-full bg-[#E5B95C]/20 blur-3xl z-10" />

        {/* Blurred duplicate for depth */}
        <img
          src={avatar || "/avatar.png"}
          alt=""
          className="absolute z-10 w-[60%] h-[58%] object-cover object-top top-[17%] blur-2xl opacity-20 scale-125"
        />

        {/* Main player (Masked to full frame size) */}
        <div 
          className="absolute inset-0 z-20 flex justify-center pointer-events-none -translate-y-[3.8%]"
          style={{
            WebkitMaskImage: "url('/avatar_mask.webp')",
            WebkitMaskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskImage: "url('/avatar_mask.webp')",
            maskSize: "100% 100%",
            maskRepeat: "no-repeat",
            maskPosition: "center",
          }}
        >
          <img
            src={avatar || "/avatar.png"}
            alt="Player"
            className="absolute z-20 w-[58%] h-[62%] object-cover object-top top-[16%] scale-110"
          />
        </div>
      </div>



      {/* 5. Frame (Border Shell) */}
      <img 
        src="/player_card_frame.webp" 
        alt="Card Frame" 
        className="absolute inset-0 z-30 h-full w-full object-contain pointer-events-none translate-y-[0.8px] scale-[1.0]"
      />
      
      {/* 6. Text + Stats (Top Layer) */}
      <div className="absolute inset-0 z-[40] pointer-events-none">
        
        {/* ========================================= */}
        {/* LEFT SIDE (Rating, Position, Flag) */}
        {/* ========================================= */}
        <div className="absolute top-[15%] left-[13%] flex flex-col items-center gap-1">
          <div className="font-display text-[clamp(24px,12vw,60px)] text-[#B08332] leading-[0.82] tracking-normal drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">
            {!disableAnimation ? <AnimatedCounter value={ovr} duration={2.5} /> : ovr}
          </div>
          <div className="font-display text-[clamp(12px,5vw,26px)] text-black leading-none font-bold drop-shadow-sm">{position || "POS"}</div>
          <img src={`https://flagcdn.com/w40/${nation.toLowerCase() === 'ind' ? 'in' : nation.toLowerCase()}.png`} alt={nation} className="mt-1 h-[10px] sm:h-[16px] w-auto object-cover shadow-sm border border-black/10" />
        </div>

        {/* ========================================= */}
        {/* CENTER NAME PLAQUE */}
        {/* ========================================= */}
        <div className="absolute top-[61.4%] bottom-[38%] left-[15%] right-[15%] flex items-center justify-center">
          <div className="font-display text-[clamp(12px,4.5vw,22px)] text-[#2A1B0A] leading-none tracking-widest uppercase font-bold drop-shadow-sm truncate">
            {name || "PLAYER"}
          </div>
        </div>

        {/* ========================================= */}
        {/* PLAYSTYLE TAG */}
        {/* ========================================= */}
        <div className="absolute top-[65.8%] left-0 right-0 flex justify-center">
          <div className="font-display text-[clamp(7px,2vw,12px)] text-[#C89B3C] tracking-[0.2em] uppercase font-bold truncate px-6">
            {style || "STYLE"}
          </div>
        </div>

        {/* ========================================= */}
        {/* STATS GRID */}
        {/* ========================================= */}
        {size !== "sm" && statsToDisplay.length >= 6 && (
          <div className="absolute top-[75%] left-[12%] right-[12%] flex flex-col gap-[clamp(2px,1vw,8px)]">
            {/* Top Row */}
            <div className="flex justify-between px-1">
              {statsToDisplay.slice(0,3).map(({ label, value }) => (
                <div key={label} className="flex gap-1 items-baseline w-[32%] justify-center">
                  <span className="font-display font-bold text-[clamp(10px,4vw,22px)] text-[#E8D196] leading-none">
                    {!disableAnimation ? <AnimatedCounter value={value} duration={1.5} /> : value}
                  </span>
                  <span className="font-display text-[clamp(7px,2.5vw,14px)] text-[#E8D196]/80 leading-none">{label}</span>
                </div>
              ))}
            </div>
            {/* Bottom Row */}
            <div className="flex justify-between px-1 mt-1">
              {statsToDisplay.slice(3,6).map(({ label, value }) => (
                <div key={label} className="flex gap-1 items-baseline w-[32%] justify-center">
                  <span className="font-display font-bold text-[clamp(10px,4vw,22px)] text-[#E8D196] leading-none">
                    {!disableAnimation ? <AnimatedCounter value={value} duration={1.5} /> : value}
                  </span>
                  <span className="font-display text-[clamp(7px,2.5vw,14px)] text-[#E8D196]/80 leading-none">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}
