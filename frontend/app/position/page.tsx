"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Footprints,
  Info,
  Target,
  Zap,
  Loader2,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player-context";
import { cn } from "@/lib/utils";

const positions = [
  { code: "GK", name: "Goalkeeper", x: 50, y: 90 },
  { code: "LB", name: "Left Back", x: 18, y: 74 },
  { code: "CB", name: "Center Back", x: 38, y: 78 },
  { code: "CB_R", name: "Center Back", codeDisplay: "CB", x: 62, y: 78 },
  { code: "RB", name: "Right Back", x: 82, y: 74 },
  { code: "CDM", name: "Defensive Midfielder", x: 50, y: 60 },
  { code: "LM", name: "Left Midfielder", x: 20, y: 46 },
  { code: "CM", name: "Center Midfielder", x: 38, y: 47 },
  { code: "CM_R", name: "Center Midfielder", codeDisplay: "CM", x: 62, y: 47 },
  { code: "RM", name: "Right Midfielder", x: 80, y: 46 },
  { code: "CAM", name: "Attacking Midfielder", x: 50, y: 32 },
  { code: "LW", name: "Left Winger", x: 22, y: 18 },
  { code: "ST", name: "Striker", x: 50, y: 14 },
  { code: "RW", name: "Right Winger", x: 78, y: 18 },
];

const positionRoles: Record<string, { role: string; desc: string }> = {
  "GK": { role: "Shot Stopper", desc: "Commands the box, last line of defense" },
  "LB": { role: "Wing Back", desc: "Defends the flank, overlaps attack" },
  "CB": { role: "Defensive Anchor", desc: "Wins aerial duels, organizes backline" },
  "RB": { role: "Wing Back", desc: "Defends the flank, overlaps attack" },
  "CDM": { role: "Holding Mid", desc: "Breaks up play, shields defense" },
  "LM": { role: "Wide Mid", desc: "Provides width, crosses the ball" },
  "CM": { role: "Box-to-Box", desc: "Controls possession, links play" },
  "RM": { role: "Wide Mid", desc: "Provides width, crosses the ball" },
  "CAM": { role: "Playmaker", desc: "Creates chances, operates between lines" },
  "LW": { role: "Wide Attacker", desc: "Fast, cuts inside to shoot" },
  "ST": { role: "Target Man", desc: "Scores goals, leads the line" },
  "RW": { role: "Wide Attacker", desc: "Fast, cuts inside to shoot" },
};

const smartSecondary: Record<string, string[]> = {
  "GK": [],
  "LB": ["LM", "CB", "CDM"],
  "CB": ["CDM", "RB", "LB"],
  "RB": ["RM", "CB", "CDM"],
  "CDM": ["CM", "CB"],
  "LM": ["LW", "LB", "CM"],
  "CM": ["CDM", "CAM", "LM", "RM"],
  "RM": ["RW", "RB", "CM"],
  "CAM": ["CM", "LW", "RW", "ST"],
  "LW": ["LM", "ST", "CAM"],
  "ST": ["LW", "RW", "CAM"],
  "RW": ["RM", "ST", "CAM"],
};

function Stepper() {
  return (
    <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-display tracking-[0.2em] uppercase text-[#1A1A1A]/60 font-medium">
      <div className="flex items-center gap-1.5 text-[#1A1A1A]/60">
        IDENTITY <Check size={12} className="text-[#1A1A1A]" />
      </div>
      <div className="w-4 sm:w-6 h-[1px] bg-black/20" />
      <div className="text-[#1A1A1A] font-bold flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#D4F829] shadow-[0_0_8px_rgba(212,248,41,0.8)]" />
        POSITION
      </div>
      <div className="w-4 sm:w-6 h-[1px] bg-black/20" />
      <div>STATS <div className="inline-block w-1.5 h-1.5 rounded-full border border-black/20 ml-1.5" /></div>
    </div>
  );
}

export default function PositionPage() {
  const router = useRouter();
  const { playerData, updatePlayerData } = usePlayer();

  const [selectedPosition, setSelectedPosition] = useState(playerData?.position || "CAM");
  const [secondaryPosition, setSecondaryPosition] = useState(playerData?.secondaryPosition || "");
  const [strongFoot, setStrongFoot] = useState<"Left" | "Right">(playerData?.strongFoot || "Left");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [showToast, setShowToast] = useState(true);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    // Auto-dismiss toast
    const timer = setTimeout(() => setShowToast(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (playerData) {
      queueMicrotask(() => {
        if (playerData.position && playerData.position !== selectedPosition) setSelectedPosition(playerData.position);
        if (playerData.secondaryPosition !== undefined && playerData.secondaryPosition !== secondaryPosition) setSecondaryPosition(playerData.secondaryPosition);
        if (playerData.strongFoot && playerData.strongFoot !== strongFoot) setStrongFoot(playerData.strongFoot);
      });
    }
  }, [playerData]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call and Analytics event
    console.log("Analytics: position_selected", selectedPosition);
    console.log("Analytics: step2_completed");

    setTimeout(() => {
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/play-style");
      }, 800);
    }, 600);
  };

  const handleSkip = () => {
    console.log("Analytics: step2_skipped");
    router.push("/play-style");
  };

  const handleSelectPosition = (code: string) => {
    const cleanCode = code.split("_")[0];
    setSelectedPosition(cleanCode);
    let newSec = secondaryPosition;
    if (secondaryPosition === cleanCode) {
      setSecondaryPosition("");
      newSec = "";
    }
    updatePlayerData({ position: cleanCode, secondaryPosition: newSec });
  };

  const roleInfo = positionRoles[selectedPosition] || positionRoles["CAM"];
  const suggestedSecondaries = smartSecondary[selectedPosition] || [];

  return (
    <main className="stryk-mobile-shell text-[#1A1A1A] relative overflow-hidden min-h-[100dvh] flex flex-col">
      {/* Premium Marble Background */}
      <img src="/create_card_bg.webp" className="absolute inset-0 z-0 h-full w-full object-cover opacity-90" alt="" />

      {/* Custom Animated Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 10 }} exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
            className="fixed top-safe inset-x-4 z-50 flex justify-center pointer-events-none"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 pr-5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] flex items-center justify-center text-black">
                <Check size={16} strokeWidth={3} />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Identity Created</div>
                <div className="text-[10px] text-white/50">Let's build your player profile.</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section data-scroll-panel className="relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col px-5 pb-4 pt-6 sm:px-8 lg:px-10 overflow-y-auto min-h-0"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <motion.header 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center justify-between gap-4"
        >
          <Button asChild variant="ghost" className="h-8 rounded-full bg-black/5 border border-black/10 hover:bg-black/10 cursor-pointer px-3 text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/60 hover:text-[#1A1A1A]">
            <Link href="/identity">
              <ArrowLeft size={14} className="mr-1.5" /> Identity
            </Link>
          </Button>
          <div className="hidden sm:block"><Stepper /></div>
          <Button variant="ghost" onClick={() => setShowSkipModal(true)} className="h-8 rounded-full bg-transparent hover:bg-black/5 cursor-pointer px-3 text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/40 hover:text-[#1A1A1A]">
            Skip
          </Button>
        </motion.header>

        <div className="mx-auto mt-6 flex w-full max-w-[56rem] flex-1 flex-col items-center min-h-0 pb-8">
          <div className="sm:hidden mb-6"><Stepper /></div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="w-full text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#B08332] font-bold">Pick your role</p>
            <h2 className="font-display text-4xl sm:text-6xl uppercase italic leading-none tracking-tight text-[#1A1A1A] mt-1">
              WHERE DO YOU PLAY?
            </h2>
          </motion.div>

          {/* Live Mini Card Continuity */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-6 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-4 rounded-full border border-black/10 bg-black/5 p-2 pr-6 shadow-sm backdrop-blur-md">
              {playerData?.avatar ? (
                <img src={playerData.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-black/10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-black/20" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A]">{playerData?.fullName || "Player Name"}</span>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold tracking-[0.1em] text-[#B08332]">
                  {selectedPosition} <span className="text-[#1A1A1A]/30">•</span> {strongFoot} Foot
                </div>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleNext} className="mt-8 w-full max-w-4xl mx-auto space-y-4 bg-[#151515] text-white p-6 sm:p-8 rounded-[40px] shadow-2xl border border-white/5 relative z-10">
            
            {/* Tactical Pitch Selector */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-3xl border border-white/10 bg-[#0B1020]/40 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl">
              
              {/* Pitch layout */}
              <div className="relative aspect-[1.3] w-full overflow-visible rounded-2xl border border-white/10 sm:aspect-[1.8]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(198,255,0,0.06), rgba(91,140,255,0.06)), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 24px, transparent 24px 48px)"}}>
                <div className="absolute inset-3 border border-white/15 rounded" />
                <div className="absolute left-3 right-3 top-1/2 h-px bg-white/15" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/15" />

                {positions.map((p, i) => {
                  const displayCode = p.codeDisplay || p.code.split("_")[0];
                  const isActive = selectedPosition === displayCode;
                  const isHovered = hoveredNode === displayCode;
                  
                  return (
                    <motion.div
                      key={i}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    >
                      <motion.button
                        type="button"
                        onClick={() => handleSelectPosition(p.code)}
                        onMouseEnter={() => setHoveredNode(displayCode)}
                        onMouseLeave={() => setHoveredNode(null)}
                        className={cn(
                          "flex items-center justify-center rounded-full font-display text-[9px] tracking-wider cursor-pointer sm:text-xs",
                          isActive ? "w-9 h-9 sm:w-11 sm:h-11 bg-[#C6FF00] text-black" : "w-7 h-7 sm:w-9 sm:h-9 bg-white/5 border border-white/10 text-white/60 hover:text-white"
                        )}
                        layout
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        animate={{
                          scale: isActive ? 1.1 : 1,
                          opacity: isActive ? 1 : 0.6,
                          boxShadow: isActive ? "0 0 20px rgba(198,255,0,0.5)" : "none",
                        }}
                      >
                        {displayCode}
                      </motion.button>
                      
                      {/* Breathing glow for active node */}
                      {isActive && (
                        <motion.div 
                          className="absolute inset-0 rounded-full bg-[#C6FF00] -z-10"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}

                      {/* Tooltip on Hover/Active */}
                      <AnimatePresence>
                        {(isHovered || isActive) && (
                          <motion.div
                            key="tooltip"
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: isActive ? 1 : 0.8, y: -45, scale: 1 }}
                            exit={{ opacity: 0, y: 0, scale: 0.9 }}
                            className="absolute left-1/2 -translate-x-1/2 w-max max-w-[140px] pointer-events-none z-20"
                          >
                            <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 text-center shadow-xl">
                              <div className="text-[9px] font-bold text-[#C6FF00] uppercase tracking-wider">{positionRoles[displayCode]?.role}</div>
                              {isActive && <div className="text-[8px] text-white/60 mt-0.5 leading-tight">{positionRoles[displayCode]?.desc}</div>}
                            </div>
                            <div className="w-2 h-2 bg-black/80 border-b border-r border-white/10 rotate-45 mx-auto -mt-1" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* Role Cards & Secondary Suggestions */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* PRIMARY ROLE CARD */}
              <div className="rounded-3xl border border-[#C6FF00]/30 bg-[#C6FF00]/5 p-5 shadow-[inset_0_0_20px_rgba(198,255,0,0.05)] backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Target size={64} />
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#C6FF00]">
                  <Target size={12} /> PRIMARY ROLE
                </div>
                <div className="mt-2 font-display text-4xl leading-none text-white">{selectedPosition}</div>
                <div className="mt-1 text-xs font-bold text-[#C6FF00]/80 uppercase tracking-wider">{roleInfo.role}</div>
                <p className="mt-2 text-[11px] text-white/50 leading-relaxed max-w-[80%]">{roleInfo.desc}</p>
              </div>

              {/* SECONDARY ROLE CARD */}
              <div className="rounded-3xl border border-white/10 bg-[#0B1020]/40 p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
                    <Zap size={12} /> SECONDARY (OPTIONAL)
                  </div>
                  
                  {secondaryPosition ? (
                    <>
                      <div className="mt-2 font-display text-4xl leading-none text-white flex items-center justify-between">
                        {secondaryPosition}
                        <button type="button" onClick={() => { setSecondaryPosition(""); updatePlayerData({ secondaryPosition: "" }); }} className="text-[10px] font-sans font-bold uppercase tracking-wider text-white/40 hover:text-red-400 bg-white/5 px-3 py-1.5 rounded-full cursor-pointer">Clear</button>
                      </div>
                      <div className="mt-1 text-xs font-bold text-white/60 uppercase tracking-wider">{positionRoles[secondaryPosition]?.role}</div>
                    </>
                  ) : (
                    <div className="mt-2 font-display text-2xl leading-none text-white/30 italic">None Selected</div>
                  )}
                </div>

                <div className="mt-4">
                  {suggestedSecondaries.length > 0 && !secondaryPosition && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {suggestedSecondaries.map(pos => (
                        <button key={pos} type="button" onClick={() => { setSecondaryPosition(pos); updatePlayerData({ secondaryPosition: pos }); }} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#C6FF00]/50 text-[10px] font-bold text-white uppercase tracking-wider transition cursor-pointer">
                          + {pos}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="relative">
                    <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="h-10 w-full flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 text-xs font-bold text-white/60 hover:text-white transition cursor-pointer">
                      Select other position... <ChevronDown size={14} />
                    </button>
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute bottom-full mb-2 w-full max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#0B1020] p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50">
                          {positions.filter(p => p.code.split("_")[0] !== selectedPosition).reduce((acc, current) => {
                            const code = current.code.split("_")[0];
                            if (!acc.find(item => item.code.split("_")[0] === code)) acc.push(current);
                            return acc;
                          }, [] as typeof positions).map((p) => {
                            const displayCode = p.code.split("_")[0];
                            return (
                              <button key={p.code} onClick={() => { setSecondaryPosition(displayCode); setIsDropdownOpen(false); updatePlayerData({ secondaryPosition: displayCode }); }} className="block w-full rounded-lg px-4 py-2.5 text-left text-xs font-bold text-white/70 hover:bg-[#C6FF00]/10 hover:text-[#C6FF00] cursor-pointer" type="button">
                                {displayCode} <span className="font-normal text-white/40 ml-2">{p.name}</span>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Strong Foot */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="rounded-3xl border border-white/10 bg-[#0B1020]/40 p-4 sm:p-5 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.22em] text-white/50">Strong Foot</h2>
                <p className="mt-1 text-[11px] text-white/40">Which foot do you trust the most?</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-[300px]">
                <button
                  onClick={() => { setStrongFoot("Left"); updatePlayerData({ strongFoot: "Left" }); }}
                  className={cn(
                    "relative flex h-12 items-center justify-center gap-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer overflow-hidden",
                    strongFoot === "Left" ? "border border-[#C6FF00]/50 bg-[#C6FF00]/10 text-[#C6FF00] shadow-[0_0_20px_rgba(198,255,0,0.15)] scale-[1.02]" : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                  type="button"
                >
                  <AnimatePresence>
                    {strongFoot === "Left" && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,255,0,0.1)_0%,transparent_70%)]" />
                    )}
                  </AnimatePresence>
                  <Footprints size={14} className={strongFoot === "Left" ? "text-[#C6FF00]" : "opacity-50"} />
                  {strongFoot === "Left" ? "✓ LEFT" : "LEFT"}
                </button>
                <button
                  onClick={() => { setStrongFoot("Right"); updatePlayerData({ strongFoot: "Right" }); }}
                  className={cn(
                    "relative flex h-12 items-center justify-center gap-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer overflow-hidden",
                    strongFoot === "Right" ? "border border-[#C6FF00]/50 bg-[#C6FF00]/10 text-[#C6FF00] shadow-[0_0_20px_rgba(198,255,0,0.15)] scale-[1.02]" : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                  type="button"
                >
                  <AnimatePresence>
                    {strongFoot === "Right" && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,255,0,0.1)_0%,transparent_70%)]" />
                    )}
                  </AnimatePresence>
                  <Footprints size={14} className={strongFoot === "Right" ? "text-[#C6FF00]" : "opacity-50"} style={{ transform: "scaleX(-1)" }} />
                  {strongFoot === "Right" ? "✓ RIGHT" : "RIGHT"}
                </button>
              </div>
            </motion.section>

            {/* CTA Button */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.75 }} className="mt-8 relative group pb-4">
              <div className="absolute -inset-1 bg-[#C6FF00]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                disabled={isSubmitting || isSuccess}
                className="relative w-full h-14 rounded-2xl bg-[#C6FF00] text-black font-display tracking-[0.2em] uppercase font-bold flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600] disabled:opacity-50 overflow-hidden shadow-[0_0_0_0_rgba(198,255,0,0)] hover:shadow-[0_0_30px_-5px_rgba(198,255,0,0.6)]" 
                type="submit"
              >
                {!isSubmitting && !isSuccess && (
                  <motion.div 
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                    animate={{ translateX: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
                  />
                )}
                
                {isSuccess ? (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                    <Check className="size-5 stroke-[3]" /> SAVED
                  </motion.div>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" /> SAVING POSITION...
                  </>
                ) : (
                  <>
                    CONTINUE <ArrowLeft className="rotate-180 size-4" strokeWidth={3} />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>
        </div>
      </section>

      {/* Skip Confirmation Modal */}
      <AnimatePresence>
        {showSkipModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0B1020] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <AlertTriangle className="text-yellow-500" />
              </div>
              <h3 className="text-lg font-display uppercase tracking-wider text-white">Are you sure?</h3>
              <p className="text-sm text-white/50 mt-2 mb-6">Position helps other players discover you and is crucial for your STRYK card rating calculations.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSkipModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer">Cancel</button>
                <button onClick={handleSkip} className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold uppercase tracking-wider transition cursor-pointer">Skip for now</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
