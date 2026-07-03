"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp } from "lucide-react";

interface OVRBreakdownProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface BreakdownStat {
  stat: string;
  value: number;
  weight: number;
  contribution_pct: number;
}

interface UpgradePath {
  stat: string;
  delta: number;
}

interface BreakdownData {
  current_ovr: number;
  position: string;
  position_weights: Record<string, number>;
  explanation: string;
  breakdown: BreakdownStat[];
  upgrade_path: UpgradePath | null;
}

function getColorForValue(val: number, isHighestWeight: boolean) {
  if (isHighestWeight) return "bg-[#39FF14]"; // Lime green
  if (val >= 85) return "bg-green-500";
  if (val >= 70) return "bg-green-400";
  if (val >= 60) return "bg-yellow-400";
  if (val >= 50) return "bg-orange-500";
  return "bg-red-500";
}

const formatStatName = (stat: string) => {
  const map: Record<string, string> = {
    pace: "Pace",
    shooting: "Shooting",
    passing: "Passing",
    dribbling: "Dribbling",
    defending: "Defending",
    physical: "Physical",
    gkDiving: "Diving",
    gkHandling: "Handling",
    gkKicking: "Kicking",
    gkReflexes: "Reflexes",
    gkPositioning: "Positioning"
  };
  return map[stat] || stat;
};

export default function OVRBreakdown({ userId, isOpen, onClose }: OVRBreakdownProps) {
  const [data, setData] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = userId 
          ? `/api/v1/ml/ovr-breakdown?userId=${userId}`
          : `/api/v1/ml/ovr-breakdown`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch breakdown");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, userId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] flex-col overflow-hidden rounded-t-[32px] border-t border-[#D4AF37]/30 bg-[#111] pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.8)]"
          >
            {/* Handle */}
            <div className="flex w-full items-center justify-center pt-4 pb-2">
              <div className="h-1.5 w-12 rounded-full bg-white/20" />
            </div>

            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
              {loading || !data ? (
                // Skeleton Loader
                <div className="flex flex-col items-center space-y-6 animate-pulse">
                  <div className="h-20 w-32 rounded-lg bg-white/5" />
                  <div className="h-4 w-48 rounded bg-white/5" />
                  <div className="w-full space-y-4 mt-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-6 w-full rounded bg-white/5" />
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-red-400">{error}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Header */}
                  <div className="text-center">
                    <h2 className="text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)]">
                      {data.current_ovr}
                    </h2>
                    <p className="mt-1 text-sm font-bold tracking-widest text-[#D4AF37]/80 uppercase">
                      {data.position} RATING
                    </p>
                  </div>

                  {/* Explanation */}
                  <div className="mt-6 mb-8 w-full rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-4 text-center">
                    <p className="text-sm font-medium italic leading-relaxed text-[#D4AF37]">
                      "{data.explanation}"
                    </p>
                  </div>

                  {/* Stat Bars */}
                  <div className="w-full space-y-4">
                    {data.breakdown.map((item, idx) => {
                      // find if it's highest weight
                      const highestWeight = Math.max(...data.breakdown.map(b => b.weight));
                      const isHighest = item.weight === highestWeight;
                      
                      const fillPct = Math.min(100, (item.value / 99) * 100);
                      const barColor = getColorForValue(item.value, isHighest);

                      return (
                        <div key={item.stat} className="flex flex-col gap-1.5">
                          <div className="flex items-end justify-between text-xs font-semibold uppercase tracking-wider text-white/80">
                            <div className="flex items-center gap-2">
                              <span>{formatStatName(item.stat)}</span>
                              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                                ×{item.weight.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-white">
                              {item.value}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${fillPct}%` }}
                              transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Upgrade Path */}
                  {data.upgrade_path && (
                    <div className="mt-10 w-full rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-[#39FF14]" />
                        <h3 className="text-xs font-bold tracking-widest text-white/70 uppercase">
                          Upgrade Path
                        </h3>
                      </div>
                      <p className="text-sm text-white/90">
                        Raising your <span className="font-bold text-[#39FF14]">{formatStatName(data.upgrade_path.stat)}</span> by 10 points would boost your overall rating by <span className="font-bold text-[#D4AF37]">+{data.upgrade_path.delta} OVR</span>.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
