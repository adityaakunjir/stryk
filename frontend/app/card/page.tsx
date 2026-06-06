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
      <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white flex items-center justify-center">
        <Loader2 className="size-10 text-[#C6FF00] animate-spin" />
      </main>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${playerData.fullName}'s STRYK Card`,
        text: `Check out my football identity card on STRYK!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const badges = [
    { icon: Flame, label: "Hat-Trick" },
    { icon: Trophy, label: "10× MVP" },
    { icon: ShieldCheck, label: "Verified" },
    { icon: TrendingUp, label: "Rising" },
  ];

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B]">
      {/* Figma Ambient bg */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 25%, rgba(198,255,0,0.18) 0%, transparent 60%), #05070B",
        }}
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
            <div className="absolute top-18 left-1/2 -translate-x-1/2 bg-[#0B1020]/90 border border-white/10 px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-[#C6FF00] shadow-lg backdrop-blur-md">
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
            <div key={i} className="rounded-xl px-2 py-3 border border-white/5 bg-white/[0.02] flex flex-col items-center gap-1.5 transition hover:border-[#C6FF00]/30">
              <span className="text-[#C6FF00] shrink-0"><b.icon size={13} /></span>
              <span className="text-[9px] text-white/70 tracking-wider uppercase font-bold text-center leading-tight">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Recent Form Block */}
        <div className="mt-3.5 rounded-2xl p-4 border border-white/5 bg-white/[0.02] transition hover:border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/45 font-bold">Recent Form</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#C6FF00] font-bold">+3 OVR</div>
          </div>
          <div className="mt-3 flex items-end gap-2 h-10">
            {[0.5, 0.65, 0.55, 0.8, 0.7, 0.95, 1, 0.85].map((v, i) => (
              <div key={i} className="flex-1 rounded-sm"
                style={{
                  height: `${v * 100}%`,
                  background: i >= 5 ? "linear-gradient(to top, #C6FF00, rgba(198,255,0,0.4))" : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
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
    <button onClick={onClick} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition">
      {children}
    </button>
  );
}
