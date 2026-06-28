"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Trophy, ShieldCheck, Flame, TrendingUp, Loader2 } from "lucide-react";
import { usePlayer } from "@/components/player-context";
import { PlayerCard } from "@/components/player-card";
import { CardDetail } from "@/components/card-detail";
import { AnimatePresence } from "framer-motion";

export default function CardPage() {
  const router = useRouter();
  const { playerData, isLoaded } = usePlayer();
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isLoaded) {
    return (
      <main className="relative min-h-screen overflow-hidden glass-panel text-white flex items-center justify-center">
        <Loader2 className="size-10 text-[#C6FF00] animate-spin" />
      </main>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${playerData.fullName}'s STRYK Card`,
        text: `Check out my football identity card on STRYK!`,
        url: window.location.href}).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const badges = [
    { icon: Flame, label: "Hat-Trick", unlocked: (playerData.goals ?? 0) >= 3 },
    { icon: Trophy, label: "10× MVP", unlocked: (playerData.matchesPlayed ?? 0) >= 10 },
    { icon: ShieldCheck, label: "Verified", unlocked: (playerData.matchesPlayed ?? 0) > 0 },
    { icon: TrendingUp, label: "Rising", unlocked: (playerData.matchesPlayed ?? 0) >= 3 },
  ];

  const matchesCount = playerData.matchesPlayed ?? 0;
  const formOvrChange = matchesCount === 0 ? 0 : Math.min(5, Math.floor(matchesCount * 0.5));
  const formOvrText = formOvrChange >= 0 ? `+${formOvrChange} OVR` : `${formOvrChange} OVR`;

  const formBars = Array.from({ length: 8 }, (_, i) => {
    const isActive = i < matchesCount;
    const val = 0.5 + ((i + 1) * 0.09) % 0.5;
    return { isActive, val };
  });

  const wins = playerData.wins ?? 0;
  const draws = playerData.draws ?? 0;
  const losses = playerData.losses ?? 0;
  const totalMatches = wins + draws + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const winPercent = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const drawPercent = totalMatches > 0 ? (draws / totalMatches) * 100 : 0;
  const lossPercent = totalMatches > 0 ? (losses / totalMatches) * 100 : 0;

  return (
    <main className="stryk-mobile-shell text-white glass-panel">
      {/* Figma Ambient bg */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 25%, rgba(198,255,0,0.18) 0%, transparent 60%), #05070B"}}
      />

      <div data-scroll-panel className="relative h-full flex flex-col px-5 pt-6 pb-5 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Btn onClick={() => router.push("/home")}><ArrowLeft size={16} /></Btn>
          <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 font-bold">Player Card</div>
          <Btn onClick={handleShare}>
            <Share2 size={16} />
          </Btn>
        </div>

        {/* Share Toast */}
        <AnimatePresence>
          {copied && (
            <div className="absolute top-18 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-[#C6FF00] shadow-lg ">
              LINK COPIED!
            </div>
          )}
        </AnimatePresence>

        {/* Card Display Area */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="relative cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div
              aria-hidden
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-52 h-6 rounded-[50%] blur-2xl pointer-events-none"
              style={{ background: "rgba(198,255,0,0.4)" }}
            />
            <div className="scale-[0.92] sm:scale-100 transition-transform duration-500 hover:scale-[1.02]">
              <PlayerCard player={playerData} size="md" />
            </div>
          </div>
        </div>

        {/* Flip CTA */}
        <div className="text-center text-[10px] tracking-[0.35em] uppercase text-[#C6FF00]/80 font-bold mb-4">
          Tap card to view dossier details
        </div>

        {/* Badges strip */}
        <div className="grid grid-cols-4 gap-2">
          {badges.map((b, i) => (
            <div 
              key={i} 
              className={`rounded-xl px-2 py-3 border flex flex-col items-center gap-1.5 transition ${
                b.unlocked 
                  ? "border-white/5 bg-white/[0.02] hover:border-[#C6FF00]/30" 
                  : "border-white/5 bg-white/[0.01] opacity-25"
              }`}
            >
              <span className={b.unlocked ? "text-[#C6FF00] shrink-0" : "text-white/30 shrink-0"}>
                <b.icon size={13} />
              </span>
              <span className="text-[9px] text-white/70 tracking-wider uppercase font-bold text-center leading-tight">
                {b.unlocked ? b.label : "Locked"}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Form Block */}
        <div className="mt-3.5 rounded-2xl p-4 border border-white/5 bg-white/[0.02] transition hover:border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/45 font-bold">Recent Form</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#C6FF00] font-bold">
              {matchesCount === 0 ? "No matches" : formOvrText}
            </div>
          </div>
          {matchesCount === 0 ? (
            <div className="text-center py-4 text-[10px] text-white/35 font-bold uppercase tracking-wider">
              Play matches to generate form data
            </div>
          ) : (
            <div className="mt-3 flex items-end gap-2 h-10">
              {formBars.map((bar, i) => (
                <div 
                  key={i} 
                  className="flex-1 rounded-sm transition-all duration-300"
                  style={{
                    height: `${bar.val * 100}%`,
                    background: bar.isActive 
                      ? "linear-gradient(to top, #C6FF00, rgba(198,255,0,0.4))" 
                      : "rgba(255,255,255,0.04)"}}
                />
              ))}
            </div>
          )}
        </div>

        {/* Match History Block */}
        <div className="mt-3 rounded-2xl p-4 border border-white/5 bg-white/[0.02] transition hover:border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/45 font-bold">Match History</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#C6FF00] font-bold">
              {totalMatches} Matches
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                <span className="text-[#C6FF00]">{wins} Wins</span>
                <span className="text-white/60">{draws} Draws</span>
                <span className="text-red-400">{losses} Losses</span>
              </div>
              
              {/* Segmented record bar */}
              <div className="w-full h-2 rounded-full glass-panel overflow-hidden flex">
                <div 
                  style={{ width: `${winPercent}%` }} 
                  className="h-full bg-[#C6FF00] shadow-[0_0_8px_rgba(198,255,0,0.4)]" 
                />
                <div 
                  style={{ width: `${drawPercent}%` }} 
                  className="h-full bg-white/30" 
                />
                <div 
                  style={{ width: `${lossPercent}%` }} 
                  className="h-full bg-red-500/70" 
                />
              </div>
            </div>
            
            <div className="shrink-0 text-right bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-1.5 min-w-[5.5rem]">
              <div className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Win Rate</div>
              <div className="font-display text-sm text-white font-extrabold mt-0.5">
                {winRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card detail dossier flip overlay */}
      <AnimatePresence>
        {isFlipped && (
          <CardDetail player={playerData} onClose={() => setIsFlipped(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-9 h-9 rounded-full glass-panel text-white flex items-center justify-center cursor-pointer hover:glass-panel0 transition">
      {children}
    </button>
  );
}
