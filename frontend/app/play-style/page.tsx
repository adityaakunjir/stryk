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
  X,
  Battery,
  Lightbulb,
  Activity,
  Compass
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlayer, PlayStyleType } from "@/components/player-context";
import { PlayerCard } from "@/components/player-card";
import { cn } from "@/lib/utils";

const styles = [
  {
    title: "Speedster" as PlayStyleType,
    copy: "Explosive pace and agility.",
    emotion: "Defenders hate chasing you.",
    icon: Zap,
    color: "#D4F829", // Neon Green
    tone: "from-[#D4F829]/30",
  },
  {
    title: "Playmaker" as PlayStyleType,
    copy: "Creates chances. Controls the game.",
    emotion: "You see passes others don't.",
    icon: Compass,
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
    icon: Battery,
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
    <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">
      <div className="flex items-center gap-1.5 text-white/60">
        Identity <Check size={12} className="text-[#D4F829]" strokeWidth={3} />
      </div>
      <div className="w-4 sm:w-6 h-[1px] bg-white/10" />
      <div className="flex items-center gap-1.5 text-white/60">
        Position <Check size={12} className="text-[#D4F829]" strokeWidth={3} />
      </div>
      <div className="w-4 sm:w-6 h-[1px] bg-white/10" />
      <div className="text-white font-black flex items-center gap-1.5 drop-shadow-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-[#D4F829] shadow-[0_0_8px_rgba(212,248,41,0.8)]" />
        Style
      </div>
    </div>
  );
}

function PlayStyleGraphic({ active = false, color = "#C6FF00", styleName = "Speedster" }: { active?: boolean, color?: string, styleName?: PlayStyleType }) {
  return (
    <div className="absolute inset-x-0 top-6 h-52 pointer-events-none flex items-center justify-center">
      <div className="relative w-32 h-44 border-2 rounded-md opacity-80" style={{ borderColor: `${color}40` }}>
        {/* Pitch Markings */}
        <div className="absolute inset-0 flex flex-col justify-between p-2">
          {/* Top Penalty Box */}
          <div className="w-16 h-8 border-b-2 border-x-2 mx-auto" style={{ borderColor: `${color}30` }} />
          {/* Halfway Line */}
          <div className="w-full h-px" style={{ backgroundColor: `${color}30` }} />
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-8 border-2 rounded-full" style={{ borderColor: `${color}30` }} />
          {/* Bottom Penalty Box */}
          <div className="w-16 h-8 border-t-2 border-x-2 mx-auto" style={{ borderColor: `${color}30` }} />
        </div>

        {/* Tactical Diagrams per Style */}
        {styleName === "Speedster" && (
          <motion.div 
            className="absolute inset-0"
            animate={{ opacity: active ? 1 : 0.4 }}
          >
            {/* Player running down the wing */}
            <div className="absolute left-2 top-1/2 size-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color, color }} />
            
            {/* Speed lines/arrows */}
            <motion.div 
              className="absolute left-[11px] top-6 w-[2px] rounded-full origin-bottom"
              style={{ backgroundColor: color, height: "40%" }}
              animate={{ height: active ? ["0%", "40%", "0%"] : "40%", opacity: active ? [0, 1, 0] : 1, y: active ? [40, 0, -40] : 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute left-3 top-12 w-[1px] rounded-full origin-bottom"
              style={{ backgroundColor: color, height: "30%" }}
              animate={{ height: active ? ["0%", "30%", "0%"] : "30%", opacity: active ? [0, 1, 0] : 1, y: active ? [40, 0, -40] : 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.2 }}
            />
          </motion.div>
        )}

        {styleName === "Playmaker" && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: active ? 1 : 0.4 }}
          >
            {/* Central Playmaker node */}
            <div className="absolute size-3 rounded-full shadow-[0_0_15px_currentColor] z-10" style={{ backgroundColor: color, color }} />
            
            {/* Radiating passing lanes */}
            <motion.div 
              className="absolute top-10 left-6 w-[1px] h-12 origin-bottom-right rotate-[30deg]"
              style={{ backgroundColor: color }}
              animate={{ opacity: active ? [0, 1, 0] : 0.5 }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.div 
              className="absolute top-8 right-6 w-[1px] h-16 origin-bottom-left -rotate-[25deg]"
              style={{ backgroundColor: color }}
              animate={{ opacity: active ? [0, 1, 0] : 0.5 }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
            />
            <motion.div 
              className="absolute top-4 left-1/2 w-[1.5px] h-20 -translate-x-1/2 origin-bottom"
              style={{ backgroundColor: color }}
              animate={{ opacity: active ? [0, 1, 0] : 0.5, height: active ? ["0px", "80px", "0px"] : "80px" }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
            />
          </motion.div>
        )}

        {styleName === "Poacher" && (
          <motion.div 
            className="absolute inset-0"
            animate={{ opacity: active ? 1 : 0.4 }}
          >
            {/* Goal scoring zone radar */}
            <motion.div 
              className="absolute top-6 left-1/2 -translate-x-1/2 size-12 rounded-full border border-dashed"
              style={{ borderColor: color, backgroundColor: `${color}10` }}
              animate={{ scale: active ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Striker waiting */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 size-3 rounded-full shadow-[0_0_15px_currentColor]" style={{ backgroundColor: color, color }} />
            
            {/* Cross/Pass arriving */}
            <motion.div 
              className="absolute top-12 right-2 w-[1px] h-12 origin-top -rotate-[60deg]"
              style={{ backgroundColor: color }}
              animate={{ opacity: active ? [0, 1, 0] : 0.5 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        )}

        {styleName === "Box-to-Box" && (
          <motion.div 
            className="absolute inset-0 flex flex-col items-center py-6"
            animate={{ opacity: active ? 1 : 0.4 }}
          >
            {/* Coverage track */}
            <div className="w-1.5 h-full rounded-full opacity-30" style={{ backgroundColor: color }} />
            
            {/* Player moving box to box */}
            <motion.div 
              className="absolute size-4 rounded-full shadow-[0_0_15px_currentColor] z-10"
              style={{ backgroundColor: color, color }}
              animate={{ top: active ? ["10%", "85%", "10%"] : "50%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </div>
    </div>
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
    const revealPlayer = {
      fullName: revealStep >= 1 ? (playerData?.fullName || "YOUR NAME") : "???",
      username: playerData?.username || "username",
      avatar: revealStep >= 4 ? (playerData?.avatar || "") : "",
      position: revealStep >= 2 ? (playerData?.position || "CAM") : "???",
      secondaryPosition: playerData?.secondaryPosition || "",
      strongFoot: playerData?.strongFoot || ("Left" as const),
      playStyle: revealStep >= 3 ? (playerData?.playStyle || "PLAYMAKER") : "???",
      bio: playerData?.bio || "",
      rating: playerData?.rating || 60,
    };

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
            initial={{ scale: 0.7, opacity: 0, rotateY: 180 }} 
            animate={{ scale: 1, opacity: 1, rotateY: 0 }} 
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="relative z-10 w-[280px] sm:w-[320px] aspect-[1417/1878]"
          >
            {/* Bright spotlight/glow behind the card */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#D4F829]/25 via-[#A28B52]/10 to-transparent blur-3xl rounded-full scale-125 z-0 pointer-events-none" />

            <div className="relative z-10 w-full h-full">
              <PlayerCard player={revealPlayer as any} size="lg" disableAnimation={false} />
            </div>

            {/* Floating indicator/subtitle below the card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={revealStep}
              className="absolute -bottom-16 left-0 right-0 text-center"
            >
              <div className="text-[10px] font-bold tracking-[0.35em] text-[#A28B52] uppercase drop-shadow-md">
                {revealStep === 1 && "Identity Compiled"}
                {revealStep === 2 && "Tactical Role Set"}
                {revealStep === 3 && "Signature Play Style"}
                {revealStep === 4 && "Athlete Card Ready"}
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    );
  }

  // --- NORMAL PAGE RENDER ---
  return (
    <main className="stryk-mobile-shell bg-[#151515] text-white">
      {/* Full Screen Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        
      />

      <section data-scroll-panel className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col px-5 pb-8 pt-6 overflow-y-auto min-h-0"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <motion.header 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center justify-between gap-4"
        >
          <Button asChild variant="ghost" size="icon" aria-label="Back to position" className="w-10 h-10 rounded-full bg-[#151515] border border-white/5 text-white flex items-center justify-center cursor-pointer hover:bg-[#202020] transition shadow-sm relative z-10">
            <Link href="/position">
              <ArrowLeft size={18} strokeWidth={2} />
            </Link>
          </Button>
          <JourneyStepper />
          <div className="w-10 h-10" />
        </motion.header>

        <div className="mx-auto mt-6 flex w-full max-w-[56rem] flex-col items-center">

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="text-center mt-6">
            <h2 className="font-display text-[2.5rem] sm:text-6xl font-black italic uppercase leading-none tracking-tight text-[#3A332C] drop-shadow-sm">
              DEFINE YOUR<br/>
              <span className="text-[#A28B52]">PLAY STYLE</span>
            </h2>
            <p className="mt-4 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#A28B52]">
              Pick your signature style
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="mt-8 w-full max-w-4xl mx-auto space-y-6 text-[#E8E8E8] relative z-10">
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
                      
                      <PlayStyleGraphic active={isActive} color={style.color} styleName={style.title as PlayStyleType} />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-center z-10 bg-gradient-to-t from-[#151515] via-[#151515]/90 to-transparent pt-12">
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
                      selectedStyle === style.title ? "bg-[#1a1a1a] border-white/5 scale-110" : "bg-[#151515] border-white/5 opacity-50 hover:opacity-100 hover:border-white/10"
                    )}
                    style={{ color: selectedStyle === style.title ? style.color : "#808080", boxShadow: selectedStyle === style.title ? `0 0 15px ${style.color}20` : "none" }}
                  >
                    <style.icon size={16} />
                  </button>
                ))}
              </div>
            </motion.section>

            {/* Smart Bio Section */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }} className="rounded-2xl bg-[#151515] border border-white/5 p-5 group shadow-sm">
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
                  <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
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
                  className="min-h-[100px] w-full resize-none rounded-xl bg-[#0c0c0c] border border-white/5 px-4 py-4 pr-10 text-sm font-medium text-white shadow-inner outline-none transition-all placeholder:text-transparent focus:border-[#D4F829]/50"
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
                    <button key={i} type="button" onClick={() => setBio(sug)} className="text-left text-[11px] text-[#808080] hover:text-[#E8E8E8] bg-[#0c0c0c] hover:bg-[#1a1a1a] border border-white/5 rounded-lg px-3 py-2 transition truncate cursor-pointer">
                      &ldquo;{sug}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Live Preview Strip */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }} className="flex justify-center mb-2 pointer-events-none">
              <div className="flex items-center gap-4 rounded-full bg-[#151515] border border-white/5 p-2 pr-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <activeStyleConfig.icon size={48} className="text-[#E8E8E8]" />
                </div>
                {playerData?.avatar ? (
                  <img src={playerData.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-[#2A2A2A]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#202020] flex items-center justify-center border border-white/5">
                    <div className="w-5 h-5 rounded-full bg-[#2A2A2A]" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white">{playerData?.fullName || "Player Name"}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold tracking-[0.1em] text-[#A28B52]">
                    {playerData?.position || "CAM"} <span className="text-white/30">•</span> {playerData?.strongFoot || "Right"} Foot <span className="text-white/30">•</span> <span style={{ color: activeStyleConfig.color }}>{selectedStyle}</span>
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
                  launchStep > 0 ? "bg-[#151515] border border-white/5 text-white/30" : "bg-[#D4F829] text-[#151515] hover:bg-[#cbf026] shadow-[0_0_30px_-5px_rgba(212,248,41,0.6)]"
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
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#808080] flex items-center gap-2">
                <Check size={10} className="text-[#D4F829]" /> Identity Created
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#808080] flex items-center gap-2">
                <Check size={10} className="text-[#D4F829]" /> Position Selected
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#A28B52] flex items-center gap-2 bg-[#1a1a1a] border border-white/5 px-4 py-1.5 rounded-full">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInfoModal(false)} className="fixed inset-0 z-40 bg-black/80 " />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border-t border-[#8E793E]/30 glass-panel p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-12"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display text-2xl uppercase italic text-[#E8E8E8]">Play Styles</h3>
                  <p className="text-xs text-[#808080]">Understand your role on the pitch.</p>
                </div>
                <button onClick={() => setShowInfoModal(false)} className="w-8 h-8 rounded-full glass-panel border border-[#2A2A2A] flex items-center justify-center hover:bg-[#2A2A2A] cursor-pointer">
                  <X size={16} className="text-[#808080]" />
                </button>
              </div>
              
              <div className="space-y-4">
                {styles.map(s => (
                  <div key={s.title} className="flex gap-4 items-start p-4 rounded-2xl glass-panel border border-[#2A2A2A]">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-[#2A2A2A]/50 glass-panel" style={{ color: s.color }}>
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
