"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player-context";
import { cn } from "@/lib/utils";
import { PlayerCard } from "@/components/player-card";
import { useStrykAuth } from "@/components/auth-provider";

function Stepper() {
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
      <div className="flex items-center gap-1.5 text-white/60">
        Style <Check size={12} className="text-[#D4F829]" strokeWidth={3} />
      </div>
      <div className="w-4 sm:w-6 h-[1px] bg-white/10" />
      <div className="text-white font-black flex items-center gap-1.5 drop-shadow-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-[#D4F829] shadow-[0_0_8px_rgba(212,248,41,0.8)]" />
        Stats
      </div>
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const { playerData, updatePlayerData } = usePlayer();
  const { getToken } = useStrykAuth();

  const isGK = playerData?.position === "GK";

  const [stats, setStats] = useState({
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
    gkDiving: 50,
    gkHandling: 50,
    gkKicking: 50,
    gkReflexes: 50,
    gkPositioning: 50,
  });

  const [predictedOvr, setPredictedOvr] = useState(50);
  const [displayOvr, setDisplayOvr] = useState(50);
  const [isPredicting, setIsPredicting] = useState(false);
  const [contextHint, setContextHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  // Launch sequence states
  const [launchStep, setLaunchStep] = useState(0); // 0=Default, 1=Analyzing, 2=Building, 3=Generating, 4=Reveal
  const [revealStep, setRevealStep] = useState(0); // For the Reveal

  // Fetch contextual hint on mount
  useEffect(() => {
    async function fetchHint() {
      try {
        const token = await getToken();
        const pos = playerData?.position || "CAM";
        const res = await fetch(`/api/ml/ovr-breakdown?position=${pos}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const weights = data.position_weights || {};
          // Find top 2 stats
          const sortedStats = Object.entries(weights)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 2)
            .map(entry => entry[0]);
          
          if (pos === "GK") {
            setContextHint("As a Goalkeeper, your GK attributes are what matter most.");
          } else if (sortedStats.length === 2) {
            const getFriendlyName = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
            let roleStr = "Player";
            if (pos === "ST") roleStr = "Striker";
            if (pos === "CAM") roleStr = "Playmaker";
            if (pos === "CB") roleStr = "Centre-Back";
            if (pos === "CDM") roleStr = "Holding Mid";
            if (pos === "LW" || pos === "RW") roleStr = "Winger";
            if (pos === "LB" || pos === "RB") roleStr = "Fullback";
            setContextHint(`As a ${roleStr}, ${getFriendlyName(sortedStats[0])} and ${getFriendlyName(sortedStats[1])} drive your OVR most.`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchHint();
  }, [playerData?.position, getToken]);

  // Debounced prediction
  useEffect(() => {
    const handler = setTimeout(async () => {
      setIsPredicting(true);
      try {
        const token = await getToken();
        const res = await fetch("/api/ml/predict-ovr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            position: playerData?.position || "CAM",
            ...stats
          })
        });
        if (res.ok) {
          const data = await res.json();
          setPredictedOvr(data.predicted_ovr);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsPredicting(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [stats, playerData?.position, getToken]);

  // Animate OVR
  useEffect(() => {
    if (predictedOvr !== displayOvr) {
      let startTime: number;
      const duration = 400; // ms
      const startValue = displayOvr;
      const endValue = predictedOvr;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = Math.round(startValue + (endValue - startValue) * progress);
        setDisplayOvr(current);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [predictedOvr, displayOvr]);


  const handleSliderChange = (statName: keyof typeof stats, value: number) => {
    setStats(prev => ({ ...prev, [statName]: value }));
  };

  const hasChanged = Object.values(stats).filter(v => v !== 50).length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanged || isSubmitting || launchStep > 0) return;

    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      // Save to context which triggers pushToBackend
      await updatePlayerData({ 
        ...stats,
        rating: predictedOvr
      });
      
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
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to save stats. Please try again.");
      setIsSubmitting(false);
    }
  };

  // --- RENDER REVEAL SCREEN ---
  if (launchStep === 4) {
    const activeStyleConfig = { color: "#D4F829" }; // generic color for reveal bg
    const revealPlayer = {
      ...playerData,
      fullName: revealStep >= 1 ? (playerData?.fullName || "YOUR NAME") : "???",
      avatar: revealStep >= 4 ? (playerData?.avatar || "") : "",
      position: revealStep >= 2 ? (playerData?.position || "CAM") : "???",
      playStyle: revealStep >= 3 ? (playerData?.playStyle || "PLAYMAKER") : "???",
      ...stats,
      rating: predictedOvr,
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

  const sliderProps = (name: keyof typeof stats, label: string) => (
    <div className="flex flex-col gap-3 w-full mb-6">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold tracking-[0.15em] uppercase text-[#A28B52]">{label}</span>
        <span className="font-black text-white text-sm">{stats[name]}</span>
      </div>
      <div className="relative w-full h-6 flex items-center">
        {/* Custom slider input overlay */}
        <input 
          type="range"
          min="1"
          max="99"
          value={stats[name]}
          onChange={(e) => handleSliderChange(name, parseInt(e.target.value))}
          className="w-full absolute z-20 opacity-0 cursor-pointer h-full inset-0"
        />
        {/* Custom Track */}
        <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden absolute top-1/2 -translate-y-1/2 pointer-events-none z-0">
           <div 
             className="h-full bg-[#D4F829] rounded-full transition-all duration-150 ease-out" 
             style={{ width: `${(stats[name] / 99) * 100}%` }}
           />
        </div>
        {/* Custom Thumb */}
        <div 
          className="absolute h-[18px] w-[18px] bg-[#A28B52] border-[3px] border-[#F4E3B5] rounded-full shadow-[0_0_12px_rgba(212,248,41,0.5)] pointer-events-none z-10 -ml-[9px] top-1/2 -translate-y-1/2 transition-all duration-150 ease-out"
          style={{ left: `${(stats[name] / 99) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <main className="stryk-mobile-shell bg-[#151515] text-white">
      <section data-scroll-panel className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col px-5 pb-4 pt-6 overflow-y-auto min-h-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        
        <motion.header 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center justify-between gap-4 shrink-0"
        >
          <Button asChild variant="ghost" size="icon" aria-label="Back to Style" className="w-10 h-10 rounded-full bg-[#151515] border border-white/5 text-white flex items-center justify-center cursor-pointer hover:bg-[#202020] transition shadow-sm relative z-10">
            <button type="button" onClick={() => router.push("/play-style")}>
              <ArrowLeft size={18} strokeWidth={2} />
            </button>
          </Button>
          <Stepper />
          <div className="w-10 h-10" />
        </motion.header>

        <div className="mx-auto mt-6 flex w-full max-w-[56rem] flex-col items-center pb-8 flex-1">

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="text-center mt-2 shrink-0"
          >
            <h2 className="font-display text-[2.5rem] sm:text-6xl font-black italic uppercase leading-none tracking-tight text-white drop-shadow-sm">
               RATE <span className="text-[#A28B52]">YOURSELF</span>
             </h2>
             <p className="mt-3 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#A28B52]">
               Be honest. Your card updates as you go.
             </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="mt-8 w-full flex flex-col gap-8 relative z-10 max-w-[28rem] mx-auto">
            
            {/* Card Preview Area */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex justify-center shrink-0">
               <div className="w-[220px] sm:w-[260px] transform origin-top relative">
                 <motion.div
                   animate={{ opacity: isPredicting ? 0.7 : 1 }}
                   transition={{ duration: 0.3 }}
                 >
                   <PlayerCard 
                     player={{...playerData, ...stats, rating: displayOvr} as any}
                     size="md"
                     disableAnimation={false}
                   />
                 </motion.div>
                 
                 <AnimatePresence>
                   {isPredicting && (
                     <motion.div 
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/20 blur-2xl rounded-full pointer-events-none" 
                     />
                   )}
                 </AnimatePresence>
               </div>
            </motion.div>

            {/* Context Hint */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center px-4 -mt-2">
              <span className="text-xs sm:text-sm text-[#A28B52] italic">{contextHint || "Loading analysis..."}</span>
            </motion.div>

            {/* Sliders Container */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 p-6 sm:p-8 shadow-[0_28px_50px_rgba(0,0,0,0.5)]">
               
               {sliderProps("pace", "Pace")}
               {sliderProps("shooting", "Shooting")}
               {sliderProps("passing", "Passing")}
               {sliderProps("dribbling", "Dribbling")}
               {sliderProps("defending", "Defending")}
               {sliderProps("physical", "Physical")}

               {isGK && (
                 <>
                   <div className="w-full h-px bg-white/10 my-6" />
                   <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-6">Goalkeeper Attributes</div>
                   {sliderProps("gkDiving", "GK Diving")}
                   {sliderProps("gkHandling", "GK Handling")}
                   {sliderProps("gkKicking", "GK Kicking")}
                   {sliderProps("gkReflexes", "GK Reflexes")}
                   {sliderProps("gkPositioning", "GK Positioning")}
                 </>
               )}
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="relative group pb-4">
              {hasChanged && (
                <div className="absolute -inset-1 bg-[#D4F829]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
              )}
              
              <motion.button 
                whileHover={{ scale: hasChanged && !isSubmitting && launchStep === 0 ? 1.01 : 1 }}
                whileTap={{ scale: hasChanged && !isSubmitting && launchStep === 0 ? 0.97 : 1 }}
                disabled={!hasChanged || isSubmitting || launchStep > 0}
                className={cn(
                  "relative w-full h-[60px] rounded-full font-display tracking-[0.15em] uppercase font-bold flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden cursor-pointer text-[15px]",
                  (!hasChanged || launchStep > 0 || isSubmitting) ? "bg-[#0a0a0a] border border-[#1A1A1A] text-white/30 cursor-not-allowed shadow-none" : "bg-[#D4F829] text-[#151515] hover:bg-[#cbf026] shadow-[0_0_30px_-5px_rgba(212,248,41,0.6)]"
                )}
                type="submit"
              >
                {hasChanged && launchStep === 0 && !isSubmitting && (
                  <motion.div 
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                    animate={{ translateX: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
                  />
                )}
                
                {launchStep === 0 && <>CREATE MY CARD <ArrowRight className="size-5 ml-1" strokeWidth={3} /></>}
                {launchStep === 1 && <><Loader2 className="size-5 animate-spin" /> ANALYZING STATS...</>}
                {launchStep === 2 && <><Loader2 className="size-5 animate-spin" /> BUILDING IDENTITY...</>}
                {launchStep === 3 && <><Loader2 className="size-5 animate-spin" /> GENERATING CARD...</>}
              </motion.button>

              {!hasChanged && (
                <div className="text-center mt-5 text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">
                  Adjust your stats to continue
                </div>
              )}
              {submitError && (
                <div className="text-center mt-5 text-[10px] text-red-400 uppercase tracking-[0.2em] font-bold">
                  {submitError}
                </div>
              )}
            </motion.div>
          </form>
        </div>
      </section>
    </main>
  );
}
