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
    color: "#D4F829", // Neon Green
    tone: "from-[#D4F829]/30",
  },
  {
    title: "Playmaker" as PlayStyleType,
    copy: "Creates chances. Controls the game.",
    emotion: "You see passes others don't.",
    icon: Sparkles,
    color: "#A28B52", // Gold
    tone: "from-[#A28B52]/30",
  },
  {
    title: "Poacher" as PlayStyleType,
    copy: "Always in the right place. Finishes cold.",
    emotion: "One chance is enough.",
    icon: Crosshair,
    color: "#E8E8E8", // Silver/White
    tone: "from-[#E8E8E8]/30",
  },
  {
    title: "Box-to-Box" as PlayStyleType,
    copy: "Covers ground. Impacts everywhere.",
    emotion: "Engine of the team. All game.",
    icon: Zap,
    color: "#8E793E", // Darker Gold
    tone: "from-[#8E793E]/30",
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
    <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-[#151515]/80">
      <div className="flex items-center gap-1.5 text-[#151515]/60">
        IDENTITY <Check size={12} className="text-[#151515]/60" strokeWidth={3} />
      </div>
      <div className="w-4 sm:w-6 h-[2px] bg-[#151515]/20" />
      <div className="flex items-center gap-1.5 text-[#151515]/60">
        POSITION <Check size={12} className="text-[#151515]/60" strokeWidth={3} />
      </div>
      <div className="w-4 sm:w-6 h-[2px] bg-[#151515]/20" />
      <div className="text-[#151515] font-black flex items-center gap-1.5 drop-shadow-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-[#D4F829] shadow-[0_0_8px_rgba(212,248,41,0.8)]" />
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
        className="absolute left-1/2 top-14 h-24 w-20 -translate-x-1/2 -rotate-6 rounded-t-[2.5rem] bg-gradient-to-br from-[#151515] via-[#151515] transition-shadow duration-500" 
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

  const [selectedStyle, setSelectedStyle] = useState<PlayStyleType>(playerData?.playStyle || "Playmaker");
  const [bio, setBio] = useState(playerData?.bio || "");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  // Launch Sequence States
  const [launchStep, setLaunchStep] = useState(0); // 0=Default, 1=Analyzing, 2=Building, 3=Generating, 4=Reveal
  const [revealStep, setRevealStep] = useState(0); // For the Ultimate Team Reveal

  const [showInfoModal, setShowInfoModal] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (playerData) {
      queueMicrotask(() => {
        if (playerData.playStyle && playerData.playStyle !== selectedStyle) setSelectedStyle(playerData.playStyle);
        if (playerData.bio !== undefined && playerData.bio !== bio) setBio(playerData.bio);
      });
    }
  }, [playerData]);

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
    
    updatePlayerData({ playStyle: selectedStyle, bio: bio.trim() });
    
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[#E8E8E8] text-center">
              <Loader2 className="size-12 animate-spin text-[#D4F829] mx-auto mb-4" />
              <h2 className="font-display text-2xl uppercase tracking-widest text-[#D4F829]">Compiling Player Identity...</h2>
            </motion.div>
          )}
        </AnimatePresence>

        {revealStep > 0 && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, rotateY: 90 }} 
            animate={{ scale: 1, opacity: 1, rotateY: 0 }} 
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="relative z-10 w-full max-w-sm aspect-[0.7] rounded-[2rem] border-2 bg-[#151515]/90 p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden"
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
    <main className="stryk-mobile-shell bg-[#E5DCC5] overflow-hidden text-[#151515]">
      {/* Full Screen Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/create_card_bg.webp')" }}
      />

      <section data-scroll-panel className="relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col px-5 pb-8 pt-6 sm:px-8 lg:px-10 overflow-y-auto min-h-0"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <motion.header 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center justify-between gap-4"
        >
          <Button asChild variant="ghost" size="icon" aria-label="Back to position" className="w-10 h-10 rounded-full bg-[#151515]/5 border border-[#151515]/10 text-[#151515] flex items-center justify-center cursor-pointer hover:bg-[#151515]/10 transition backdrop-blur-md shadow-sm relative z-10">
            <Link href="/position">
              <ArrowLeft size={18} strokeWidth={2} />
            </Link>
          </Button>
          <div className="hidden sm:block"><JourneyStepper /></div>
          <Button variant="ghost" onClick={() => setShowInfoModal(true)} className="w-10 h-10 rounded-full bg-transparent border border-[#151515]/20 hover:bg-[#151515]/5 cursor-pointer p-0 text-[#151515]">
            <Info size={20} />
          </Button>
        </motion.header>

        <div className="mx-auto mt-6 flex w-full max-w-[56rem] flex-1 flex-col items-center min-h-0">
          <div className="sm:hidden mb-6"><JourneyStepper /></div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="text-center mt-6">
            <h2 className="font-display text-[40px] sm:text-6xl uppercase italic leading-[0.9] tracking-wider text-[#2A261D] drop-shadow-sm font-black">
              DEFINE YOUR<br/>
              <span className="text-[#A28B52]">PLAY STYLE</span>
            </h2>
            <p className="mt-4 text-[13px] sm:text-sm font-medium text-[#151515]/60 uppercase tracking-[0.2em]">
              Pick your signature style
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="mt-8 w-full max-w-4xl mx-auto space-y-6 bg-[#151515] text-[#E8E8E8] p-6 sm:p-8 rounded-[2rem] shadow-[0_28px_50px_rgba(0,0,0,0.5)] border border-[#8E793E]/30 relative z-10">
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
                        updatePlayerData({ playStyle: style.title });
                        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
                      }}
                      className="snap-center relative h-[26rem] min-w-[16rem] sm:min-w-[18rem] rounded-2xl border bg-[#151515] p-5 cursor-pointer select-none overflow-hidden"
                      animate={{
                        scale: isActive ? 1.03 : 0.92,
                        y: isActive ? -8 : 0,
                        rotateX: isActive ? 2 : 0,
                        opacity: isActive ? 1 : 0.65,
                        borderColor: isActive ? style.color : "#2A2A2A",
                        boxShadow: isActive ? `0 20px 40px rgba(0,0,0,0.5), 0 0 30px ${style.color}20` : "0 10px 30px rgba(0,0,0,0.3)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      style={{ transformPerspective: 1000 }}
                    >
                      <div className={cn("absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,var(--tw-gradient-from),transparent_50%)]", style.tone)} />
                      
                      <FootballerArt active={isActive} color={style.color} />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-center z-10 bg-gradient-to-t from-[#151515] via-[#151515]/80 to-transparent pt-12">
                        <motion.div
                          className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border"
                          animate={{
                            borderColor: isActive ? style.color : "#2A2A2A",
                            backgroundColor: isActive ? `${style.color}10` : "#151515",
                            color: isActive ? style.color : "#808080",
                          }}
                        >
                          <Icon className="size-8" />
                        </motion.div>
                        <h2 className="text-2xl font-display uppercase italic" style={{ color: isActive ? "#D4F829" : "#E8E8E8" }}>
                          {style.title}
                        </h2>
                        <div className="h-16 mt-2 flex flex-col justify-start">
                          <p className="mx-auto text-[11px] font-bold text-[#A28B52] mb-1 leading-tight">{style.copy}</p>
                          <AnimatePresence mode="wait">
                            {isActive && (
                              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mx-auto text-[10px] text-[#808080] leading-relaxed max-w-[14rem]">
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
                    onClick={() => { setSelectedStyle(style.title); updatePlayerData({ playStyle: style.title }); scrollToCard(styles.findIndex(s => s.title === style.title)); }}
                    className={cn(
                      "size-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border",
                      selectedStyle === style.title ? "bg-[#151515] border-[#2A2A2A] scale-110" : "bg-[#151515] border-[#2A2A2A] opacity-50 hover:opacity-100 hover:bg-[#151515]"
                    )}
                    style={{ color: selectedStyle === style.title ? style.color : "#808080", boxShadow: selectedStyle === style.title ? `0 0 15px ${style.color}20` : "none" }}
                  >
                    <style.icon size={16} />
                  </button>
                ))}
              </div>
            </motion.section>

            {/* Smart Bio Section */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }} className="rounded-2xl border border-[#2A2A2A] bg-[#151515] p-5 group">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A28B52] mb-1">Player Bio</h2>
                  <p className="mt-1 text-[11px] text-[#808080]">Write something for the back of your card.</p>
                </div>
                <div className="flex flex-col items-end gap-1 w-24">
                  <span className={cn("text-[10px] font-bold transition-colors", bio.length >= 120 ? "text-red-400" : bio.length > 100 ? "text-yellow-400" : "text-[#808080]")}>
                    {bio.length} / 120
                  </span>
                  {/* Visual Progress Bar */}
                  <div className="w-full h-1 bg-[#151515] border border-[#2A2A2A] rounded-full overflow-hidden">
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
                  className="min-h-[100px] w-full resize-none rounded-xl border border-[#2A2A2A] bg-[#151515] px-4 py-4 pr-10 text-sm font-medium text-[#E8E8E8] shadow-inner outline-none transition-all placeholder:text-transparent focus:border-[#D4F829]/50"
                  maxLength={120}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                {!bio && (
                  <div className="absolute inset-x-4 top-4 pointer-events-none text-sm font-medium text-[#808080] truncate">
                    <AnimatePresence mode="wait">
                      <motion.span key={placeholderIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="block">
                        {placeholders[placeholderIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                )}
                <Edit3 className="pointer-events-none absolute bottom-4 right-4 size-4 text-[#808080]" />
              </div>

              {/* AI Suggestions */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={12} className="text-[#A28B52]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#A28B52]">AI Suggestions</span>
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  {suggestions.map((sug, i) => (
                    <button key={i} type="button" onClick={() => setBio(sug)} className="text-left text-[11px] text-[#808080] hover:text-[#E8E8E8] bg-[#151515] hover:bg-[#2A2A2A]/50 border border-[#2A2A2A] rounded-lg px-3 py-2 transition truncate cursor-pointer">
                      "{sug}"
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Live Preview Strip */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }} className="flex justify-center mb-2 pointer-events-none">
              <div className="flex items-center gap-4 rounded-2xl border border-[#2A2A2A] bg-[#151515] p-2 pr-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <activeStyleConfig.icon size={48} className="text-[#E8E8E8]" />
                </div>
                {playerData?.avatar ? (
                  <img src={playerData.avatar} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-[#2A2A2A]" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#151515] flex items-center justify-center border border-[#2A2A2A]">
                    <div className="w-5 h-5 rounded-full bg-[#2A2A2A]" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#E8E8E8]">{playerData?.fullName || "Player Name"}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold tracking-[0.1em] text-[#808080]">
                    <span className="text-[#E8E8E8]">{playerData?.position || "CAM"}</span> • 
                    <span className="text-[#E8E8E8]">{playerData?.strongFoot || "Right"} Foot</span> • 
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
                  "relative w-full h-[60px] rounded-full font-display tracking-[0.15em] uppercase font-bold flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden cursor-pointer text-[15px]",
                  launchStep > 0 ? "bg-[#151515] border border-[#2A2A2A] text-[#808080]" : "bg-[#D4F829] text-[#151515] hover:bg-[#cbf026] shadow-[0_0_30px_-5px_rgba(212,248,41,0.6)]"
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
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#808080] flex items-center gap-2">
                <Check size={10} className="text-[#D4F829]" /> Identity Created
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#808080] flex items-center gap-2">
                <Check size={10} className="text-[#D4F829]" /> Position Selected
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#A28B52] flex items-center gap-2 bg-[#A28B52]/10 px-3 py-1 rounded-full border border-[#A28B52]/20">
                <Check size={10} className="text-[#A28B52]" /> Ready To Generate
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
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border-t border-[#8E793E]/30 bg-[#151515] p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-12"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display text-2xl uppercase italic text-[#E8E8E8]">Play Styles</h3>
                  <p className="text-xs text-[#808080]">Understand your role on the pitch.</p>
                </div>
                <button onClick={() => setShowInfoModal(false)} className="w-8 h-8 rounded-full bg-[#151515] border border-[#2A2A2A] flex items-center justify-center hover:bg-[#2A2A2A] cursor-pointer">
                  <X size={16} className="text-[#808080]" />
                </button>
              </div>
              
              <div className="space-y-4">
                {styles.map(s => (
                  <div key={s.title} className="flex gap-4 items-start p-4 rounded-2xl bg-[#151515] border border-[#2A2A2A]">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-[#2A2A2A]/50 bg-[#151515]" style={{ color: s.color }}>
                      <s.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#E8E8E8] uppercase tracking-wider text-sm">{s.title}</h4>
                      <p className="text-xs text-[#808080] mt-1">{s.copy} {s.emotion}</p>
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
