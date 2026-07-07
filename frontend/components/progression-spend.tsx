"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Loader2, ArrowUpRight, Shield, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStrykAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/player-context";
import { cn } from "@/lib/utils";

interface ProgressionStatus {
  currentPoints: number;
  totalPointsEarned: number;
  verifiedMatchCount: number;
  statCap: number;
  stats: Record<string, { current: number; toCap: number }>;
  nextMatchRewardPreview: string;
}

interface ProgressionSpendProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProgressionSpend({ isOpen, onClose }: ProgressionSpendProps) {
  const router = useRouter();
  const { getToken } = useStrykAuth();
  const { playerData } = usePlayer();
  
  const [status, setStatus] = useState<ProgressionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [spendState, setSpendState] = useState<Record<string, number>>({
    pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0,
    gkDiving: 0, gkHandling: 0, gkKicking: 0, gkReflexes: 0, gkPositioning: 0
  });
  
  const [predictedOvr, setPredictedOvr] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isGK = playerData?.position === "GK";
  
  const displayStats = isGK 
    ? ["gkDiving", "gkHandling", "gkKicking", "gkReflexes", "gkPositioning", "pace", "physical"] 
    : ["pace", "shooting", "passing", "dribbling", "defending", "physical"];

  const formatLabel = (s: string) => {
    if (s.startsWith("gk")) return s.replace("gk", "GK ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setSpendState({
        pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0,
        gkDiving: 0, gkHandling: 0, gkKicking: 0, gkReflexes: 0, gkPositioning: 0
      });
      setPredictedOvr(playerData?.rating || null);
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/player/progression-status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const pointsSpent = Object.values(spendState).reduce((a, b) => a + b, 0);
  const availablePoints = status ? status.currentPoints - pointsSpent : 0;

  useEffect(() => {
    if (!isOpen || !status || pointsSpent === 0) return;
    
    const handler = setTimeout(async () => {
      setIsPredicting(true);
      try {
        const token = await getToken();
        const currentTotals = { ...spendState };
        for (const key of Object.keys(currentTotals)) {
           currentTotals[key] += status.stats[key]?.current || 0;
        }
        
        const res = await fetch("/api/ml/predict-ovr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            position: playerData?.position || "CAM",
            ...currentTotals
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
    }, 400);

    return () => clearTimeout(handler);
  }, [spendState, isOpen, pointsSpent]);

  const handleIncrement = (stat: string) => {
    if (availablePoints <= 0) return;
    if (!status) return;
    
    const maxAllowed = status.stats[stat]?.toCap || 0;
    if (spendState[stat] >= maxAllowed) return;
    
    setSpendState(prev => ({ ...prev, [stat]: prev[stat] + 1 }));
  };

  const handleDecrement = (stat: string) => {
    if (spendState[stat] <= 0) return;
    setSpendState(prev => ({ ...prev, [stat]: prev[stat] - 1 }));
  };

  const handleSubmit = async () => {
    if (pointsSpent <= 0) return;
    setIsSubmitting(true);
    setError("");
    
    try {
      const token = await getToken();
      const res = await fetch("/api/player/spend-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(spendState)
      });
      
      if (res.ok) {
        onClose();
        router.refresh();
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to upgrade stats");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[101] max-h-[85vh] flex flex-col rounded-t-[2rem] border-t border-[#D4F829]/30 bg-[#111] shadow-[0_-20px_40px_rgba(0,0,0,0.8)]"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-[#D4F829]" />
                  <h3 className="font-display text-2xl uppercase italic text-[#E8E8E8] leading-none">Progression</h3>
                </div>
                <p className="text-xs text-[#808080] mt-1 uppercase tracking-wider font-bold">Level up your player</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full border border-[#2A2A2A] flex items-center justify-center hover:bg-[#2A2A2A] transition cursor-pointer bg-[#151515]"
              >
                <X size={20} className="text-[#808080]" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto overflow-x-hidden relative" style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="size-8 animate-spin text-[#D4F829]" />
                </div>
              ) : status ? (
                <div className="space-y-8 pb-32">
                  <div className="flex flex-col items-center bg-[#151515] rounded-2xl border border-[#D4F829]/20 p-6 shadow-[0_0_30px_rgba(212,248,41,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Target size={100} />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#808080] mb-2">Available Points</div>
                    <div className="font-display text-6xl text-[#D4F829] drop-shadow-[0_0_15px_rgba(212,248,41,0.5)]">
                      {availablePoints}
                    </div>
                    <div className="mt-2 text-xs text-[#A28B52] font-bold bg-[#A28B52]/10 px-3 py-1 rounded-full border border-[#A28B52]/20">
                      Cap: {status.statCap}
                    </div>
                  </div>

                  {status.currentPoints === 0 && pointsSpent === 0 && (
                    <div className="text-center p-4 bg-white/5 rounded-xl border border-[#D4F829]/20 text-[#D4F829]/80 shadow-[0_0_15px_rgba(212,248,41,0.05)] mt-4">
                      <p className="text-xs tracking-wide">
                        You don't have enough progression points to upgrade your stats. 
                        Complete matches and level up to earn more points!
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                    <span className="text-sm font-bold uppercase tracking-wider text-[#808080]">Projected OVR</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-white/50 line-through">{playerData?.rating || 60}</span>
                      <ArrowUpRight size={16} className="text-[#D4F829]" />
                      <div className="flex items-center gap-2">
                        {isPredicting && <Loader2 size={14} className="animate-spin text-[#D4F829]" />}
                        <span className="font-display text-3xl text-white">{predictedOvr ?? playerData?.rating ?? 60}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#808080] mb-4 flex items-center gap-2">
                      <Shield size={14} /> Allocate Attributes
                    </h4>
                    
                    {displayStats.map(stat => {
                      const statData = status.stats[stat];
                      if (!statData) return null;
                      
                      const spent = spendState[stat];
                      const total = statData.current + spent;
                      const atCap = total >= status.statCap;
                      
                      return (
                        <div key={stat} className="flex items-center justify-between p-3 rounded-xl bg-[#151515] border border-white/5 hover:border-white/10 transition">
                          <div className="w-24">
                            <div className="text-xs font-bold uppercase tracking-wider text-[#E8E8E8]">{formatLabel(stat)}</div>
                            <div className="text-[10px] text-[#808080] mt-1">{statData.current} &rarr; {total}</div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleDecrement(stat)}
                              disabled={spent === 0}
                              className="w-10 h-10 rounded-full border border-white/10 bg-[#202020] flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#2a2a2a] transition active:scale-95 cursor-pointer"
                            >
                              <Minus size={16} />
                            </button>
                            
                            <div className="w-12 text-center">
                              <span className={cn(
                                "font-display text-2xl",
                                spent > 0 ? "text-[#D4F829]" : "text-white/50"
                              )}>
                                {spent > 0 ? `+${spent}` : "0"}
                              </span>
                            </div>
                            
                            <button 
                              onClick={() => handleIncrement(stat)}
                              disabled={availablePoints <= 0 || atCap}
                              className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center text-[#151515] transition active:scale-95 cursor-pointer",
                                availablePoints <= 0 || atCap 
                                  ? "bg-[#202020] border-white/10 text-white/30 cursor-not-allowed" 
                                  : "bg-[#D4F829] border-[#D4F829] hover:bg-[#cbf026] shadow-[0_0_10px_rgba(212,248,41,0.3)]"
                              )}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-red-400">
                  <p>Failed to load progression data.</p>
                  <p className="text-xs opacity-70 mt-2">Make sure you have completed the onboarding and check your connection.</p>
                </div>
              )}
            </div>

            {status && pointsSpent > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#111] via-[#111] to-transparent pt-12 pb-8 border-t border-white/5 backdrop-blur-md">
                {error && <div className="text-red-400 text-xs text-center mb-4 font-bold">{error}</div>}
                
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-full bg-[#D4F829] text-[#111] hover:bg-[#cbf026] font-display text-lg uppercase tracking-widest cursor-pointer shadow-[0_0_30px_-5px_rgba(212,248,41,0.5)]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> COMMITTING...</span>
                  ) : (
                    `CONFIRM UPGRADE (-${pointsSpent} PTS)`
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
