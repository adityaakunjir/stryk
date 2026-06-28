"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Activity, Play, Trophy, Target, Shield, Flame, Hand, Lock, Loader2, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface MatchStat {
  goals: number;
  assists: number;
  saves: number;
  tackles: number;
  cleanSheet: boolean;
  motm: boolean;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  noShow: boolean;
}

interface MatchHistoryEntry {
  matchId: string;
  title: string;
  format: string;
  matchDate: string;
  outcome: "Win" | "Loss" | "Draw" | "Unknown";
  team: "A" | "B";
  teamAScore: number | null;
  teamBScore: number | null;
  xpGained: number;
  stats: MatchStat;
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 1. Get profile to get username
        const profRes = await fetch("/api/profile");
        const profData = await profRes.json();
        if (!profData.success || !profData.profile) {
          setLoading(false);
          return;
        }

        const username = profData.profile.username;

        // 2. Get history
        const histRes = await fetch(`/api/players/username/${username}/history`);
        const histData = await histRes.json();
        
        if (histData.success) {
          setHistory(histData.data);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "Win": return "text-[#D4F829] border-[#D4F829]/30 bg-[#D4F829]/10";
      case "Loss": return "text-red-400 border-red-400/30 bg-red-400/10";
      case "Draw": return "text-white/60 border-white/20 glass-panel";
      default: return "text-white/40 border-white/10 glass-panel";
    }
  };

  const getOutcomeBorderColor = (outcome: string) => {
    switch (outcome) {
      case "Win": return "border-[#D4F829]";
      case "Loss": return "border-red-400";
      case "Draw": return "border-white/40";
      default: return "border-white/20";
    }
  };

  return (
    <main className="stryk-mobile-shell glass-panel text-white overflow-hidden">
      <div data-scroll-panel className="relative h-full flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <header className="pb-4 flex items-center gap-3 shrink-0 mb-2 relative z-20">
          <button
            onClick={() => router.push("/profile")}
            className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/70 hover:glass-panel0 hover:text-white transition cursor-pointer "
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Match Data</div>
            <div className="font-display tracking-wider text-xl">CAREER TIMELINE</div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#D4F829] opacity-50" size={32} />
          </div>
        ) : history.length === 0 ? (
          /* Empty State Body */
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] glass-panel blur-[100px] rounded-full pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center text-center relative z-10 w-full"
            >
              <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center mb-6 text-white/30">
                <Activity size={32} />
              </div>

              <h2 className="font-display text-3xl uppercase italic tracking-wider mb-2">No Matches Yet</h2>
              <p className="text-[13px] text-white/50 font-medium max-w-[260px] leading-relaxed mb-8">
                Your match history is completely empty. Play your first match to start tracking your performance and improving your stats.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/matches")}
                className="w-full h-14 rounded-2xl bg-[#D4F829] text-white font-display text-[14px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_30px_-5px_rgba(212,248,41,0.4)]"
              >
                <Play size={16} fill="currentColor" /> FIND MATCH
              </motion.button>
            </motion.div>
          </div>
        ) : (
          /* Timeline Body */
          <div className="flex-1 relative pb-10">
            {/* Timeline Vertical Line */}
            <div className="absolute left-[19px] top-4 bottom-0 w-[2px] bg-gradient-to-b from-white/20 via-white/10 to-transparent" />

            <div className="flex flex-col gap-8 pt-4">
              {history.map((match, idx) => (
                <motion.div
                  key={match.matchId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-12 pr-1"
                >
                  {/* Timeline Node */}
                  <div className={`absolute left-[13px] top-6 w-[14px] h-[14px] rounded-full border-[3px] glass-panel z-10 ${getOutcomeBorderColor(match.outcome)}`} />

                  {/* Match Card */}
                  <div className="rounded-[1.5rem] bg-white/[0.03] border border-white/5 overflow-hidden  relative">
                    
                    {/* Header Row */}
                    <div className="p-4 border-b border-white/5 flex items-start justify-between relative overflow-hidden">
                      {/* Subdued background glow based on result */}
                      {match.outcome === "Win" && <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4F829]/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />}
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{match.format}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-[10px] flex items-center gap-1 text-white/40"><Calendar size={10}/> {formatDate(match.matchDate)}</span>
                        </div>
                        <h3 className="font-display text-lg tracking-wide uppercase leading-tight truncate max-w-[200px]">{match.title}</h3>
                      </div>

                      {/* Result Badge */}
                      <div className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border ${getOutcomeColor(match.outcome)}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest">{match.outcome}</span>
                        {(match.teamAScore !== null && match.teamBScore !== null) && (
                          <span className="text-sm font-display mt-0.5 tracking-wider">
                            {match.teamAScore} - {match.teamBScore}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-4 flex flex-col gap-4">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {match.stats.motm && (
                            <div className="flex items-center gap-1.5 text-[#D4F829] bg-[#D4F829]/10 px-2.5 py-1 rounded-lg border border-[#D4F829]/20 shadow-[0_0_15px_rgba(212,248,41,0.2)]">
                              <Trophy size={12} strokeWidth={2.5} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">MVP</span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">XP Earned</span>
                            <span className="text-sm font-display text-white">+{match.xpGained} XP</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-0.5">Played For</span>
                          <span className="text-[11px] font-bold text-white/80 glass-panel0 px-2 py-0.5 rounded-md">Team {match.team}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {match.stats.goals > 0 && (
                          <div className="flex flex-col items-center justify-center glass-panel rounded-xl p-2 border border-white/5">
                            <Target size={14} className="text-white/40 mb-1" />
                            <span className="text-base font-display">{match.stats.goals}</span>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Goals</span>
                          </div>
                        )}
                        {match.stats.assists > 0 && (
                          <div className="flex flex-col items-center justify-center glass-panel rounded-xl p-2 border border-white/5">
                            <Flame size={14} className="text-white/40 mb-1" />
                            <span className="text-base font-display">{match.stats.assists}</span>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Assists</span>
                          </div>
                        )}
                        {match.stats.tackles > 0 && (
                          <div className="flex flex-col items-center justify-center glass-panel rounded-xl p-2 border border-white/5">
                            <Shield size={14} className="text-white/40 mb-1" />
                            <span className="text-base font-display">{match.stats.tackles}</span>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Tackles</span>
                          </div>
                        )}
                        {match.stats.saves > 0 && (
                          <div className="flex flex-col items-center justify-center glass-panel rounded-xl p-2 border border-white/5">
                            <Hand size={14} className="text-white/40 mb-1" />
                            <span className="text-base font-display">{match.stats.saves}</span>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Saves</span>
                          </div>
                        )}
                        {match.stats.cleanSheet && (
                          <div className="flex flex-col items-center justify-center glass-panel rounded-xl p-2 border border-white/5">
                            <Lock size={14} className="text-white/40 mb-1" />
                            <span className="text-base font-display">1</span>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Clean</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
