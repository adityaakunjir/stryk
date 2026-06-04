import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Share2, Trophy, TrendingUp, ShieldCheck, Flame } from "lucide-react";
import { PlayerCard, type Player } from "./player-card";

type Props = {
  player: Player;
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
          "radial-gradient(60% 50% at 50% 30%, rgba(198,255,0,0.12) 0%, transparent 60%), #05070B",
      }}
    >
      <div className="flex items-center justify-between px-6 pt-6">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-[10px] tracking-[0.35em] uppercase text-white/50">
          Player Card
        </div>
        <button className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white">
          <Share2 size={18} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="relative" style={{ perspective: "1500px" }}>
          <motion.div
            className="relative"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: "preserve-3d" }}
            onClick={() => setFlipped((f) => !f)}
          >
            <div style={{ backfaceVisibility: "hidden" }}>
              <PlayerCard player={player} size="lg" />
            </div>
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <CardBack player={player} />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 pb-8 text-center">
        <button
          onClick={() => setFlipped((f) => !f)}
          className="text-[11px] tracking-[0.3em] uppercase text-white/50 hover:text-[var(--stryk-lime)] transition-colors"
        >
          {flipped ? "View Front" : "Tap card to flip"}
        </button>
      </div>
    </motion.div>
  );
}

function CardBack({ player }: { player: Player }) {
  const badges = [
    { icon: Flame, label: "Hat-Trick Hero" },
    { icon: Trophy, label: "10x MVP" },
    { icon: ShieldCheck, label: "Verified Pro" },
    { icon: TrendingUp, label: "Rising Star" },
  ];
  return (
    <div
      className="w-72 h-[26rem] rounded-[28px] p-6 flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, #1A2540 0%, #0B1020 45%, #05070B 100%)",
        boxShadow:
          "0 0 0 1px rgba(198,255,0,0.25), 0 30px 60px -20px rgba(198,255,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <div className="text-[10px] tracking-[0.35em] uppercase text-[var(--stryk-lime)]">
        Career Dossier
      </div>
      <div className="font-display text-white mt-1" style={{ fontSize: "1.5rem" }}>
        {player.name.toUpperCase()}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Mini label="Matches" value={player.matches.toString()} />
        <Mini label="Trust" value="98%" />
        <Mini label="Goals" value="47" />
        <Mini label="Assists" value="29" />
      </div>

      <div className="mt-5 text-[10px] tracking-[0.25em] uppercase text-white/45">
        Badges
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {badges.map((b) => (
          <div
            key={b.label}
            className="flex items-center gap-2 rounded-xl px-2.5 py-2 bg-white/[0.04] border border-white/10"
          >
            <b.icon size={14} className="text-[var(--stryk-lime)]" />
            <span className="text-[11px] text-white/80 truncate">{b.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <div className="text-[10px] tracking-[0.25em] uppercase text-white/45">
          Form (last 5)
        </div>
        <div className="mt-2 flex gap-1.5">
          {[1, 1, 0.6, 1, 0.8].map((v, i) => (
            <div
              key={i}
              className="flex-1 h-10 rounded-md"
              style={{
                background: `linear-gradient(to top, var(--stryk-lime) ${
                  v * 100
                }%, rgba(255,255,255,0.06) ${v * 100}%)`,
              }}
            />
          ))}
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
      <div className="font-display text-white mt-0.5" style={{ fontSize: "1.5rem" }}>
        {value}
      </div>
    </div>
  );
}
