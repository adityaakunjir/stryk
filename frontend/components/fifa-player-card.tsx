"use client";

import { useState, useEffect } from "react";
import { motion, animate } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";
import Image from "next/image";

export interface FIFAPlayerCardProps {
  player: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
    avatarUrl?: string;
    overall?: number;
    rating?: number;
    position?: string;
    playStyle?: string;
    level?: number;
    xp?: number;
    wins?: number;
    matches?: number;
    strongFoot?: string;
  };
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  draggable?: boolean;
  isSelected?: boolean;
}

// Animated counter for stats
function AnimatedNumber({ value, duration = 0.8 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setCount(Math.round(v)),
    });
    return controls.stop;
  }, [value, duration]);

  return <span>{count}</span>;
}

export function FIFAPlayerCard({ 
  player, 
  size = "md", 
  onClick, 
  draggable = false,
  isSelected = false 
}: FIFAPlayerCardProps) {
  const avatarUrl = player.avatar || player.avatarUrl;
  const overall = player.overall || player.rating || 70;
  const position = player.position || "ST";
  const winRate = player.matches ? Math.round((player.wins || 0) / player.matches * 100) : 0;

  const sizeConfig = {
    sm: { card: "w-28 h-40", badge: "w-10 h-10", text: "text-xs", ratingSize: "text-lg" },
    md: { card: "w-36 h-52", badge: "w-14 h-14", text: "text-sm", ratingSize: "text-xl" },
    lg: { card: "w-44 h-60", badge: "w-18 h-18", text: "text-base", ratingSize: "text-2xl" },
  };

  const config = sizeConfig[size];

  // Color gradient based on overall rating
  const getGradient = (ovr: number) => {
    if (ovr >= 85) return "from-yellow-400 to-yellow-600";
    if (ovr >= 80) return "from-blue-400 to-blue-600";
    if (ovr >= 75) return "from-green-400 to-green-600";
    if (ovr >= 70) return "from-purple-400 to-purple-600";
    return "from-gray-400 to-gray-600";
  };

  return (
    <motion.div
      layoutId={`player-card-${player.id}`}
      initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onClick={onClick}
      className={`relative ${config.card} rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected ? "ring-4 ring-[#C6FF00] shadow-lg shadow-[#C6FF00]/50" : ""
      }`}
      style={{ perspective: 1000 }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(overall)} opacity-20`} />

      {/* Player image */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#05070B] z-10" />
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={player.username}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100px, 200px"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-300">{player.username.slice(0, 2).toUpperCase()}</span>
        </div>
      )}

      {/* Overall rating badge (top-right) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className={`absolute top-1 right-1 z-20 ${config.badge} rounded-full bg-gradient-to-br ${getGradient(overall)} 
          shadow-lg shadow-[#C6FF00]/30 flex items-center justify-center border-2 border-white/30`}
      >
        <div className="text-center">
          <div className={`font-bold text-white ${config.ratingSize}`}>
            <AnimatedNumber value={overall} duration={0.8} />
          </div>
        </div>
      </motion.div>

      {/* Position badge (top-left) */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className={`absolute top-2 left-2 z-20 glass-panel rounded-lg px-2 py-1 border border-[#C6FF00]/50 ${config.text} font-bold text-[#C6FF00]`}
      >
        {position}
      </motion.div>

      {/* Stats section (bottom) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#05070B] via-[#05070B]/80 to-transparent p-1.5 space-y-0.5"
      >
        {/* Username */}
        <div className="text-xs font-bold text-white truncate leading-tight">
          {player.username}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between gap-1 text-[10px]">
          {/* Win rate */}
          {player.matches !== undefined && (
            <div className="flex items-center gap-0.5 text-green-400">
              <Trophy className="w-2.5 h-2.5" />
              <span><AnimatedNumber value={winRate} duration={0.8} />%</span>
            </div>
          )}

          {/* Level */}
          {player.level !== undefined && (
            <div className="flex items-center gap-0.5 text-yellow-400">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>Lv <AnimatedNumber value={player.level} duration={0.8} /></span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Selection indicator border */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-xl border-2 border-[#C6FF00] pointer-events-none"
        />
      )}

      {/* Hover glow effect */}
      <motion.div
        whileHover={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        className="absolute inset-0 rounded-xl shadow-lg shadow-[#C6FF00]/20 pointer-events-none"
      />
    </motion.div>
  );
}
