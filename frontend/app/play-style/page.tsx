"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Edit3,
  Gauge,
  Info,
  Shield,
  Sparkles,
  Zap,
  Cpu,
  Loader2,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlayer, PlayStyleType } from "@/components/player-context";
import { cn } from "@/lib/utils";

const styles = [
  {
    title: "Speedster" as PlayStyleType,
    copy: "Explosive pace and agility.",
    emotion: "Defenders hate chasing you.",
    icon: Gauge,
    color: "#00E5FF", // Cyan
    tone: "from-cyan-400/30",
  },
  {
    title: "Playmaker" as PlayStyleType,
    copy: "Creates chances. Controls the game.",
    emotion: "You see passes others don't.",
    icon: Sparkles,
    color: "#C6FF00", // Lime
    tone: "from-lime-300/30",
  },
  {
    title: "Poacher" as PlayStyleType,
    copy: "Always in the right place. Finishes cold.",
    emotion: "One chance is enough.",
    icon: Crosshair,
    color: "#A78BFA", // Violet
    tone: "from-violet-400/30",
  },
  {
    title: "Box-to-Box" as PlayStyleType,
    copy: "Covers ground. Impacts everywhere.",
    emotion: "Engine of the team. All game.",
    icon: Zap,
    color: "#FCD34D", // Amber
    tone: "from-amber-300/30",
  },
];

const generateSuggestions = (pos: string, style: string) => {
  if (style === "Playmaker") return ["Creative playmaker who thrives on key passes.", `A ${pos || 'player'} with vision and composure.`, "Always looking for the killer pass."];
  if (style === "Speedster") return [`Fast ${pos || 'player'}. Always looking to exploit space.`, "Explosive pace and direct attacking play.", "Relentless engine on the wing."];
  if (style === "Poacher") return ["Clinical finisher inside the box.", `Target ${pos || 'player'} with a deadly strike.`, "Right place at the right time."];
  if (style === "Box-to-Box") return [`Relentless ${pos || 'player'}. Never stops running.`, "Dominating the midfield engine room.", "Covers every blade of grass."];
  return ["Weekend baller. Here to win.", "Working hard for the team.", "Passionate player looking to compete."];
};

const placeholders = [
  "Fast winger. Always looking for assists.",
  "Playmaker who loves controlling the game.",
  "Relentless midfielder. Never stops running.",
  "Weekend baller. Here to win."
];

function JourneyStepper() {
  return (
    <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-display tracking-[0.2em] uppercase text-white/40">
      <div className="flex items-center gap-1.5 text-white/80">
        IDENTITY 
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C6FF00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="w-4 sm:w-6 h-[1px] bg-white/20" />
      <div className="flex items-center gap-1.5 text-white/80">
        ROLE 
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C6FF00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.5 }} points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="w-4 sm:w-6 h-[1px] bg-white/20" />
      <div className="text-[#C6FF00] flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#C6FF00] shadow-[0_0_8px_rgba(198,255,0,0.8)]" />
        STYLE
      </div>
    </div>
  );
}

function FootballerArt({ active = false, color = "#C6FF00" }: { active?: boolean, color?: string }) {
  return (
    <motion.div 
      className="absolute inset-x-5 top-7 h-44 pointer-events-none"
      animate={{ y: active ? [0, -8, 0] : 0 }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        className="absolute left-1/2 top-1 size-16 -translate-x-1/2 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-700 to-black transition-shadow duration-500"
        style={{ boxShadow: active ? `0 0 0 5px ${color}25` : "none" }}
      />
      <div 
        className="absolute left-1/2 top-14 h-24 w-20 -translate-x-1/2 -rotate-6 rounded-t-[2.5rem] bg-gradient-to-br from-zinc-950 via-[#151f20] transition-shadow duration-500" 
        style={{ boxShadow: `inset 0 0 0 1px ${color}20`, backgroundColor: `${color}10` }}
      />
      <div className="absolute left-[18%] top-24 h-4 w-28 -rotate-[28deg] rounded-full transition-colors duration-500" style={{ backgroundColor: active ? `${color}70` : `${color}40` }} />
      <div className="absolute right-[17%] top-16 h-4 w-28 rotate-[24deg] rounded-full transition-colors duration-500" style={{ backgroundColor: active ? `${color}50` : `${color}30` }} />
      <div className="absolute bottom-2 left-[27%] h-20 w-5 rotate-[20deg] rounded-full bg-zinc-900" />
      <div className="absolute bottom-0 right-[31%] h-24 w-5 -rotate-[18deg] rounded-full bg-zinc-900" />
      <div 
        className="absolute bottom-3 left-[16%] size-12 rounded-full border-4 border-white/20 bg-black transition-shadow duration-500" 
        style={{ boxShadow: active ? `0 0 24px ${color}40` : "none" }}
      />
    </motion.div>
  );
}

export default function PlayStylePage() {
  const router = useRouter();
  const { playerData, updatePlayerData } = usePlayer();

  const [selectedStyle, setSelectedStyle] = useState<PlayStyleType>("Playmaker");
  const [bio, setBio] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  // Launch Sequence States
  const [launchStep, setLaunchStep] = useState(0); // 0=Default, 1=Analyzing, 2=Building, 3=Generating, 4=Reveal
  const [revealStep, setRevealStep] = useState(0); // For the Ultimate Team Reveal

  const [showInfoModal, setShowInfoModal] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (playerData) {
      queueMicrotask(() => {
        if (playerData.playStyle) setSelectedStyle(playerData.playStyle);
        if (playerData.bio) setBio(playerData.bio);
      });
    }
  }, [playerData]);

  // Optimistic context updates
  useEffect(() => {
    updatePlayerData({ playStyle: selectedStyle });
  }, [selectedStyle]);

  // Rotating placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePrevStyle = () => {
    const currentIndex = styles.findIndex((s) => s.title === selectedStyle);
    const prevIndex = (currentIndex - 1 + styles.length) % styles.length;
    setSelectedStyle(styles[prevIndex].title);
    scrollToCard(prevIndex);
  };

  const handleNextStyle = () => {
    const currentIndex = styles.findIndex((s) => s.title === selectedStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setSelectedStyle(styles[nextIndex].title);
    scrollToCard(nextIndex);
  };

  const scrollToCard = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = 280; // approximate width + gap
      carouselRef.current.scrollTo({ left: index * cardWidth - 40, behavior: 'smooth' });
    }
  };

  const activeStyleConfig = styles.find(s => s.title === selectedStyle) || styles[1];
  const suggestions = generateSuggestions(playerData?.position || "", selectedStyle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (launchStep > 0) return;
    
    updatePlayerData({ bio: bio.trim() });
    
    // Launch Sequence
    setLaunchStep(1);
    setTimeout(() => setLaunchStep(2), 1000);
    setTimeout(() => setLaunchStep(3), 2000);
    setTimeout(() => {
      setLaunchStep(4);
      // Start Reveal
      setTimeout(() => setRevealStep(1), 800); // Name
      setTimeout(() => setRevealStep(2), 1600); // Position
      setTimeout(() => setRevealStep(3), 2400); // Style
      setTimeout(() => setRevealStep(4), 3200); // Avatar
      setTimeout(() => router.push("/home"), 4500); // Finish
    }, 3000);
  };

  // --- RENDER REVEAL SCREEN ---
  if (launchStep === 4) {
    return (
      <main className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* Dynamic Background */}
        <motion.div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-from),transparent_60%)]"
          style={{ "--tw-gradient-from": `${activeStyleConfig.color}20` } as any}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <AnimatePresence>
          {revealStep === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-white text-center">
              <Loader2 className="size-12 animate-spin text-[#C6FF00] mx-auto mb-4" />
              <h2 className="font-display text-2xl uppercase tracking-widest text-[#C6FF00]">Compiling Player Identity...</h2>
            </motion.div>
          )}
        </AnimatePresence>

        {revealStep > 0 && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, rotateY: 90 }} 
            animate={{ scale: 1, opacity: 1, rotateY: 0 }} 
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="relative z-10 w-full max-w-sm aspect-[0.7] rounded-[2rem] border-2 bg-[#0B1020]/80 p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden"
            style={{ borderColor: `${activeStyleConfig.color}50`, boxShadow: `0 0 100px ${activeStyleConfig.color}30` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0_28%,rgba(255,255,255,0.05)_28%_29%,transparent_29%_100%)] pointer-events-none" />
            
            {/* Avatar */}
            {revealStep >= 4 && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="absolute top-12">
                {playerData?.avatar ? (
                  <img src={playerData.avatar} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-[0_0_40px_rgba(255,255,255,0.3)]" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/20">
                    <div className="w-12 h-12 rounded-full bg-white/30" />
                  </div>
                )}
              </motion.div>
            )}

            <div className="absolute bottom-16 text-center w-full px-6">
              {/* Name */}
              {revealStep >= 1 && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-4xl uppercase tracking-wider text-white mb-2 truncate">
                  {playerData?.fullName || "YOUR NAME"}
                </motion.div>
              )}
              {/* Position */}
              {revealStep >= 2 && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-xl font-bold uppercase text-white mb-3 shadow-lg">
                  {playerData?.position || "CAM"}
                </motion.div>
              )}
              {/* Style */}
              {revealStep >= 3 && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center">
                  <activeStyleConfig.icon className="size-8 mb-2" style={{ color: activeStyleConfig.color }} />
                  <div className="text-xl font-display uppercase italic tracking-widest" style={{ color: activeStyleConfig.color }}>{activeStyleConfig.title}</div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    );
  }

  // --- NORMAL PAGE RENDER ---
  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] overflow-hidden">
      {/* Dynamic Background Layer 1 */}
      <motion.div 
        className="fixed inset-0 z-0 transition-colors duration-1000"
        style={{ 
          background: `radial-gradient(circle at 68% 18%, ${activeStyleConfig.color}15, transparent 35%), radial-gradient(circle at 22% 68%, rgba(91,140,255,0.06), transparent 35%), linear-gradient(180deg, #05070B 0%, #0B1020 48%, #05070B 100%)`
        }}
      />
      
      {/* Background Layer 2: Noise Texture */}
      <div className="fixed inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg_viewBox=%220_0_200_200%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22noiseFilter%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.65%22_numOctaves=%223%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
      
      {/* Background Layer 3: Dynamic Moving Glow */}
      <motion.div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] z-0 pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15], backgroundColor: `${activeStyleConfig.color}25` }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <section data-scroll-panel className="relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col px-5 pb-8 pt-6 sm:px-8 lg:px-10 overflow-y-auto min-h-0"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <motion.header 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center justify-between gap-4"
        >
          <Button asChild variant="ghost" className="h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer px-3 text-[10px] uppercase font-bold tracking-wider text-white/60">
            <Link href="/position">
              <ArrowLeft size={14} className="mr-1.5" /> Position
            </Link>
          </Button>
          <div className="hidden sm:block"><JourneyStepper /></div>
          <Button variant="ghost" onClick={() => setShowInfoModal(true)} className="h-8 w-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer p-0 text-white/60 hover:text-white">
            <Info size={14} />
          </Button>
        </motion.header>

        <div className="mx-auto mt-6 flex w-full max-w-[56rem] flex-1 flex-col items-center min-h-0">
          <div className="sm:hidden mb-6"><JourneyStepper /></div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="w-full text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#C6FF00] font-bold">Pick your style</p>
            <h2 className="font-display text-4xl sm:text-6xl uppercase italic leading-none tracking-wide text-white mt-1">
              DEFINE YOUR PLAY STYLE
            </h2>
          </motion.div>

          <form onSubmit={handleSubmit} className="mt-8 w-full flex-1 space-y-6">
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="relative">
              
              {/* Carousel container */}
              <div ref={carouselRef} className="-mx-5 flex gap-4 overflow-x-auto px-10 pb-8 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
                {styles.map((style) => {
                  const isActive = style.title === selectedStyle;
                  const Icon = style.icon;
                  return (
                    <motion.article
                      key={style.title}
                      onClick={() => {
                        setSelectedStyle(style.title);
                        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
                      }}
                      className="snap-center relative h-[26rem] min-w-[16rem] sm:min-w-[18rem] rounded-[2rem] border bg-[#0B1020]/60 p-5 cursor-pointer select-none overflow-hidden"
                      animate={{
                        scale: isActive ? 1.03 : 0.92,
                        y: isActive ? -8 : 0,
                        rotateX: isActive ? 2 : 0,
                        opacity: isActive ? 1 : 0.65,
                        borderColor: isActive ? style.color : "rgba(255,255,255,0.1)",
                        boxShadow: isActive ? `0 20px 40px rgba(0,0,0,0.5), 0 0 30px ${style.color}40` : "0 10px 30px rgba(0,0,0,0.3)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      style={{ transformPerspective: 1000 }}
                    >
                      <div className={cn("absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,var(--tw-gradient-from),transparent_50%)]", style.tone)} />
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0_28%,rgba(255,255,255,0.03)_28%_29%,transparent_29%_100%)] pointer-events-none" />
                      
                      <AnimatePresence>
                        {isActive && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                            className="absolute left-5 top-5 grid size-9 place-items-center rounded-full text-black z-20"
                            style={{ backgroundColor: style.color, boxShadow: `0 0 20px ${style.color}60` }}
                          >
                            <Check className="size-5 stroke-[3]" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <FootballerArt active={isActive} color={style.color} />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-center z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12">
                        <motion.div
                          className="mx-auto mb-4 grid size-16 place-items-center rounded-[1.2rem] border backdrop-blur-md"
                          animate={{
                            borderColor: isActive ? style.color : "rgba(255,255,255,0.15)",
                            backgroundColor: isActive ? `${style.color}15` : "rgba(255,255,255,0.05)",
                            color: isActive ? style.color : "rgba(255,255,255,0.5)",
                          }}
                        >
                          <Icon className="size-8" />
                        </motion.div>
                        <h2 className="text-2xl font-display uppercase italic" style={{ color: isActive ? style.color : "white" }}>
                          {style.title}
                        </h2>
                        <div className="h-16 mt-2 flex flex-col justify-start">
                          <p className="mx-auto text-[11px] font-bold text-white mb-1 leading-tight">{style.copy}</p>
                          <AnimatePresence mode="wait">
                            {isActive && (
                              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mx-auto text-[10px] text-white/50 leading-relaxed max-w-[14rem]">
                                {style.emotion}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>

              {/* Icon Pagination */}
              <div className="flex justify-center gap-4 mt-2">
                {styles.map((style) => (
                  <button
                    key={style.title}
                    type="button"
                    onClick={() => { setSelectedStyle(style.title); scrollToCard(styles.findIndex(s => s.title === style.title)); }}
                    className={cn(
                      "size-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer",
                      selectedStyle === style.title ? "bg-white/10 scale-110" : "hover:bg-white/5 opacity-40"
                    )}
                    style={{ color: selectedStyle === style.title ? style.color : "white", boxShadow: selectedStyle === style.title ? `0 0 15px ${style.color}30` : "none" }}
                  >
                    <style.icon size={16} />
                  </button>
                ))}
              </div>
            </motion.section>

            {/* Smart Bio Section */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }} className="rounded-3xl border border-white/8 bg-[#0B1020]/40 p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl group">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/50">Player Bio</h2>
                  <p className="mt-1 text-[11px] text-white/40">Write something for the back of your card.</p>
                </div>
                <div className="flex flex-col items-end gap-1 w-24">
                  <span className={cn("text-xs font-bold transition-colors", bio.length >= 120 ? "text-red-400" : bio.length > 100 ? "text-yellow-400" : "text-white/40")}>
                    {bio.length} / 120
                  </span>
                  {/* Visual Progress Bar */}
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full" 
                      style={{ backgroundColor: bio.length >= 120 ? "#f87171" : activeStyleConfig.color }}
                      animate={{ width: `${(bio.length / 120) * 100}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="relative mt-4">
                <textarea
                  className="min-h-[100px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-4 pr-10 text-sm font-semibold text-white shadow-inner outline-none transition-all placeholder:text-transparent focus:border-[#C6FF00]/50 focus:bg-white/[0.03]"
                  style={{ boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)" }}
                  maxLength={120}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                {!bio && (
                  <div className="absolute inset-x-4 top-4 pointer-events-none text-sm font-semibold text-white/30 truncate">
                    <AnimatePresence mode="wait">
                      <motion.span key={placeholderIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="block">
                        {placeholders[placeholderIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                )}
                <Edit3 className="pointer-events-none absolute bottom-4 right-4 size-4 text-white/20" />
              </div>

              {/* AI Suggestions */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={12} className="text-[#00E5FF]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#00E5FF]">AI Suggestions</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((sug, i) => (
                    <button key={i} type="button" onClick={() => setBio(sug)} className="text-left text-[11px] text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-3 py-2 transition truncate cursor-pointer">
                      "{sug}"
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Live Preview Strip */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }} className="flex justify-center mb-2 pointer-events-none">
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0B1020]/60 p-2 pr-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <activeStyleConfig.icon size={48} />
                </div>
                {playerData?.avatar ? (
                  <img src={playerData.avatar} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-white/20" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-white/20" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider text-white">{playerData?.fullName || "Player Name"}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold tracking-[0.1em] text-white/60">
                    <span className="text-white">{playerData?.position || "CAM"}</span> • 
                    <span className="text-white">{playerData?.strongFoot || "Right"} Foot</span> • 
                    <span style={{ color: activeStyleConfig.color }}>{selectedStyle}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Launch Sequence CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="relative group pb-2">
              <div className="absolute -inset-1 bg-[#C6FF00]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
              <motion.button 
                whileHover={{ scale: launchStep === 0 ? 1.01 : 1 }}
                whileTap={{ scale: launchStep === 0 ? 0.97 : 1 }}
                disabled={launchStep > 0}
                className={cn(
                  "relative w-full h-14 rounded-2xl font-display tracking-[0.2em] uppercase font-bold flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden cursor-pointer",
                  launchStep > 0 ? "bg-[#0B1020] border border-[#C6FF00]/50 text-[#C6FF00]" : "bg-[#C6FF00] text-black hover:bg-[#b0e600] shadow-[0_0_30px_-5px_rgba(198,255,0,0.5)]"
                )}
                type="submit"
              >
                {launchStep === 0 && (
                  <motion.div 
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                    animate={{ translateX: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
                  />
                )}
                
                {launchStep === 0 && <>CREATE MY CARD <ArrowRight className="size-4" strokeWidth={3} /></>}
                {launchStep === 1 && <><Loader2 className="size-4 animate-spin" /> ANALYZING STYLE...</>}
                {launchStep === 2 && <><Loader2 className="size-4 animate-spin" /> BUILDING IDENTITY...</>}
                {launchStep === 3 && <><Loader2 className="size-4 animate-spin" /> GENERATING CARD...</>}
              </motion.button>
            </motion.div>

            {/* Dynamic Checklist */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-col items-center gap-1.5 pb-8">
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                <Check size={10} className="text-[#C6FF00]" /> Identity Created
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                <Check size={10} className="text-[#C6FF00]" /> Position Selected
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/70 flex items-center gap-2 bg-[#C6FF00]/10 px-3 py-1 rounded-full border border-[#C6FF00]/20">
                <Check size={10} className="text-[#C6FF00]" /> Ready To Generate
              </div>
            </motion.div>
          </form>
        </div>
      </section>

      {/* Info Bottom Sheet Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInfoModal(false)} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/10 bg-[#0B1020] p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-12"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display text-2xl uppercase italic text-white">Play Styles</h3>
                  <p className="text-xs text-white/50">Understand your role on the pitch.</p>
                </div>
                <button onClick={() => setShowInfoModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer">
                  <X size={16} className="text-white/60" />
                </button>
              </div>
              
              <div className="space-y-4">
                {styles.map(s => (
                  <div key={s.title} className="flex gap-4 items-start p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                      <s.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-wider text-sm">{s.title}</h4>
                      <p className="text-xs text-white/60 mt-1">{s.copy} {s.emotion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
