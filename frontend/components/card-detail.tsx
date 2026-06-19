import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Trophy, TrendingUp, ShieldCheck, Flame } from "lucide-react";
import { PlayerCard, type PlayerMockType } from "./player-card";
import { PlayerData } from "./player-context";

type Props = {
  player: PlayerData | PlayerMockType;
  onClose: () => void;
};

export function CardDetail({ player, onClose }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          "radial-gradient(60% 50% at 50% 30%, rgba(212,248,41,0.08) 0%, transparent 60%), #05070B"}}
    >
      <div className="flex items-center justify-between px-6 pt-6">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-[10px] tracking-[0.35em] uppercase text-white/50">
          Player Card
        </div>
        <button className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer">
          <Share2 size={18} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="relative" style={{ perspective: "1500px" }}>
          <motion.div
            className="relative w-72 h-[26rem] cursor-pointer"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" }}
            onClick={() => setFlipped((f) => !f)}
          >
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ 
                backfaceVisibility: "hidden", 
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(0deg)",
                WebkitTransform: "rotateY(0deg)",
                zIndex: flipped ? 0 : 1}}
            >
              <PlayerCard player={player} size="lg" />
            </div>
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                WebkitTransform: "rotateY(180deg)",
                zIndex: flipped ? 1 : 0}}
            >
              <CardBack player={player} />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 pb-8 text-center">
        <button
          onClick={() => setFlipped((f) => !f)}
          className="text-[11px] tracking-[0.3em] uppercase text-white/50 hover:text-[#D4F829] transition-colors cursor-pointer"
        >
          {flipped ? "View Front" : "Tap card to flip"}
        </button>
      </div>
    </motion.div>
  );
}

function CardBack({ player }: { player: PlayerData | PlayerMockType }) {
  const isMock = "stats" in player && "ovr" in player;
  const name = isMock ? player.name : player.fullName;
  const matches = isMock ? player.matches : (player.matchesPlayed ?? 0);
  const goals = isMock ? "47" : (player.goals ?? 0).toString();
  const assists = isMock ? "29" : (player.assists ?? 0).toString();

  const badges = [
    { icon: Flame, label: "Hat-Trick Hero", unlocked: isMock ? true : (player.goals ?? 0) >= 3 },
    { icon: Trophy, label: "10x MVP", unlocked: isMock ? true : (player.matchesPlayed ?? 0) >= 10 },
    { icon: ShieldCheck, label: "Verified Pro", unlocked: isMock ? true : (player.matchesPlayed ?? 0) > 0 },
    { icon: TrendingUp, label: "Rising Star", unlocked: isMock ? true : (player.matchesPlayed ?? 0) >= 3 },
  ];

  const unlockedBadges = badges.filter((b) => b.unlocked);
  
  return (
    <div
      className="w-72 h-[26rem] rounded-[28px] p-6 flex flex-col"
      style={{
        background: "#151515",
        boxShadow:
          "0 0 0 1px rgba(212,248,41,0.15), 0 30px 60px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)"}}
    >
      <div className="text-[10px] tracking-[0.35em] uppercase text-[#A28B52]">
        Career Dossier
      </div>
      <div className="font-display text-white mt-1 text-2xl truncate">
        {name ? name.toUpperCase() : "PLAYER NAME"}
      </div>
      
      {player.bio && (
        <div className="mt-2 text-[11px] leading-relaxed text-[#808080] italic">
          "{player.bio}"
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Mini label="Matches" value={matches.toString()} />
        <Mini label="Trust" value="98%" />
        <Mini label="Goals" value={goals} />
        <Mini label="Assists" value={assists} />
      </div>

      <div className="mt-5 text-[10px] tracking-[0.25em] uppercase text-white/45">
        Badges
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {unlockedBadges.map((b) => (
          <div
            key={b.label}
            className="flex items-center gap-2 rounded-xl px-2.5 py-2 bg-white/[0.04] border border-white/5"
          >
            <b.icon size={14} className="text-[#D4F829] shrink-0" />
            <span className="text-[11px] text-white/80 truncate">{b.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <div className="text-[10px] tracking-[0.25em] uppercase text-white/45">
          Form (last 5)
        </div>
        <div className="mt-2 flex gap-1.5">
          {matches === 0 ? (
            <div className="w-full text-center py-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
              No recent matches
            </div>
          ) : (
            Array.from({ length: 5 }).map((_, i) => {
              const isActive = i < matches;
              const v = isActive ? 0.5 + ((i + 1) * 0.09) % 0.5 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 h-10 rounded-md transition-all duration-300"
                  style={{
                    background: isActive
                      ? `linear-gradient(to top, rgba(212,248,41,0.8) ${v * 100}%, rgba(255,255,255,0.04) ${v * 100}%)`
                      : "rgba(255,255,255,0.02)"}}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3 bg-white/[0.04] border border-white/10">
      <div className="text-[10px] tracking-[0.2em] uppercase text-white/50">
        {label}
      </div>
      <div className="font-display text-white mt-0.5 text-2xl leading-none">
        {value}
      </div>
    </div>
  );
}
