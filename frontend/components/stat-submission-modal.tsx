"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Minus, Plus, Shield, Award, AlertTriangle, AlertOctagon } from "lucide-react";
import { toast } from "sonner";

interface StatSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  matchFormat: string;
  isGoalkeeper: boolean;
  onSuccess: () => void;
}

export function StatSubmissionModal({ isOpen, onClose, matchId, matchFormat, isGoalkeeper, onSuccess }: StatSubmissionModalProps) {
  const [activeTab, setActiveTab] = useState<"Core" | "Attack" | "Defense" | "GK" | "Discipline">("Core");

  // Core
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);
  const [motm, setMotm] = useState(false);
  const [noShow, setNoShow] = useState(false);
  
  // Attack & Midfield
  const [shotsOnTarget, setShotsOnTarget] = useState(0);
  const [keyPasses, setKeyPasses] = useState(0);
  const [progressivePasses, setProgressivePasses] = useState(0);
  
  // Defense & Physical
  const [tackles, setTackles] = useState(0);
  const [interceptions, setInterceptions] = useState(0);
  const [blocks, setBlocks] = useState(0);
  const [clearances, setClearances] = useState(0);
  const [ballRecoveries, setBallRecoveries] = useState(0);
  const [duelsWon, setDuelsWon] = useState(0);
  const [aerialDuelsWon, setAerialDuelsWon] = useState(0);
  const [cleanSheet, setCleanSheet] = useState(false); // also used by GK
  
  // GK
  const [saves, setSaves] = useState(0);
  const [bigSaves, setBigSaves] = useState(0);
  const [penaltySaves, setPenaltySaves] = useState(0);
  const [distributionAssists, setDistributionAssists] = useState(0);
  
  // Discipline
  const [yellowCards, setYellowCards] = useState(0);
  const [redCards, setRedCards] = useState(0);
  const [ownGoals, setOwnGoals] = useState(0);

  const [loading, setLoading] = useState(false);

  // Format caps
  const formatGoalsCaps: Record<string, number> = {
    "3v3": 4,
    "5v5": 5,
    "7v7": 5,
    "11v11": 6,
  };
  const goalCap = formatGoalsCaps[matchFormat] || 6;

  const handleIncrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, max: number = 99) => {
    if (value < max) setter(value + 1);
  };

  const handleDecrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    if (value > 0) setter(value - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/submit-stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals,
          assists,
          shotsOnTarget,
          keyPasses,
          progressivePasses,
          tackles,
          interceptions,
          blocks,
          clearances,
          ballRecoveries,
          duelsWon,
          aerialDuelsWon,
          saves,
          bigSaves,
          penaltySaves,
          distributionAssists,
          cleanSheet,
          motm,
          yellowCards,
          redCards,
          ownGoals,
          noShow
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Stats submitted successfully! Pending verification.");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to submit stats.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting stats.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderStatRow = (label: string, value: number, setter: React.Dispatch<React.SetStateAction<number>>, max: number = 99) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
      <div className="font-bold text-white uppercase tracking-widest text-sm">{label}</div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => handleDecrement(setter, value)}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
        >
          <Minus size={14} className="text-white/60" />
        </button>
        <div className="w-6 text-center font-display text-xl text-white">{value}</div>
        <button 
          onClick={() => handleIncrement(setter, value, max)}
          className="w-8 h-8 rounded-full bg-[#C6FF00]/10 flex items-center justify-center hover:bg-[#C6FF00]/20 transition"
        >
          <Plus size={14} className="text-[#C6FF00]" />
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-2xl uppercase italic tracking-wide text-white">Match Stats</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          {/* TABS */}
          <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-4 pb-2">
            {["Core", "Attack", "Defense", "GK", "Discipline"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition ${activeTab === tab ? "bg-white text-black" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {activeTab === "Core" && (
              <>
                {renderStatRow("Goals", goals, setGoals, goalCap)}
                {renderStatRow("Assists", assists, setAssists)}
                
                <div 
                  onClick={() => setMotm(!motm)}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition mt-4 ${motm ? 'bg-[#A28B52]/10 border-[#A28B52]/50' : 'bg-white/[0.02] border-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <Award size={16} className={motm ? "text-[#A28B52]" : "text-white/40"} />
                    <div className={`font-bold uppercase tracking-widest text-sm ${motm ? 'text-[#A28B52]' : 'text-white'}`}>Man of the Match</div>
                  </div>
                  <div className={`w-12 h-6 rounded-full flex items-center p-1 transition ${motm ? 'bg-[#A28B52]' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition ${motm ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>

                <div 
                  onClick={() => setNoShow(!noShow)}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${noShow ? 'bg-red-500/10 border-red-500/50' : 'bg-white/[0.02] border-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <AlertOctagon size={16} className={noShow ? "text-red-500" : "text-white/40"} />
                    <div className={`font-bold uppercase tracking-widest text-sm ${noShow ? 'text-red-500' : 'text-white'}`}>Did Not Show Up</div>
                  </div>
                  <div className={`w-12 h-6 rounded-full flex items-center p-1 transition ${noShow ? 'bg-red-500' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition ${noShow ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>
              </>
            )}

            {activeTab === "Attack" && (
              <>
                {renderStatRow("Shots on Target", shotsOnTarget, setShotsOnTarget)}
                {renderStatRow("Key Passes", keyPasses, setKeyPasses)}
                {renderStatRow("Prog. Passes", progressivePasses, setProgressivePasses)}
              </>
            )}

            {activeTab === "Defense" && (
              <>
                {renderStatRow("Tackles", tackles, setTackles)}
                {renderStatRow("Interceptions", interceptions, setInterceptions)}
                {renderStatRow("Blocks", blocks, setBlocks)}
                {renderStatRow("Clearances", clearances, setClearances)}
                {renderStatRow("Ball Recoveries", ballRecoveries, setBallRecoveries)}
                {renderStatRow("Duels Won", duelsWon, setDuelsWon)}
                {renderStatRow("Aerial Duels Won", aerialDuelsWon, setAerialDuelsWon)}

                {!isGoalkeeper && (
                  <div 
                    onClick={() => setCleanSheet(!cleanSheet)}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition mt-4 ${cleanSheet ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/[0.02] border-white/5'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield size={16} className={cleanSheet ? "text-blue-400" : "text-white/40"} />
                      <div className={`font-bold uppercase tracking-widest text-sm ${cleanSheet ? 'text-blue-400' : 'text-white'}`}>Clean Sheet</div>
                    </div>
                    <div className={`w-12 h-6 rounded-full flex items-center p-1 transition ${cleanSheet ? 'bg-blue-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition ${cleanSheet ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "GK" && (
              <>
                {isGoalkeeper ? (
                  <>
                    {renderStatRow("Saves", saves, setSaves)}
                    {renderStatRow("Big Saves", bigSaves, setBigSaves)}
                    {renderStatRow("Penalty Saves", penaltySaves, setPenaltySaves)}
                    {renderStatRow("Distribution Assists", distributionAssists, setDistributionAssists)}
                    
                    <div 
                      onClick={() => setCleanSheet(!cleanSheet)}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition mt-4 ${cleanSheet ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/[0.02] border-white/5'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield size={16} className={cleanSheet ? "text-blue-400" : "text-white/40"} />
                        <div className={`font-bold uppercase tracking-widest text-sm ${cleanSheet ? 'text-blue-400' : 'text-white'}`}>Clean Sheet</div>
                      </div>
                      <div className={`w-12 h-6 rounded-full flex items-center p-1 transition ${cleanSheet ? 'bg-blue-500' : 'bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition ${cleanSheet ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-white/50 text-sm">
                    Only available for Goalkeepers.
                  </div>
                )}
              </>
            )}

            {activeTab === "Discipline" && (
              <>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-yellow-400" />
                    <div className="font-bold text-yellow-400 uppercase tracking-widest text-sm">Yellow Cards</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleDecrement(setYellowCards, yellowCards)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
                      <Minus size={14} className="text-white/60" />
                    </button>
                    <div className="w-6 text-center font-display text-xl text-white">{yellowCards}</div>
                    <button onClick={() => handleIncrement(setYellowCards, yellowCards, 2)} className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center hover:bg-yellow-400/20 transition">
                      <Plus size={14} className="text-yellow-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2">
                    <AlertOctagon size={16} className="text-red-500" />
                    <div className="font-bold text-red-500 uppercase tracking-widest text-sm">Red Cards</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleDecrement(setRedCards, redCards)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
                      <Minus size={14} className="text-white/60" />
                    </button>
                    <div className="w-6 text-center font-display text-xl text-white">{redCards}</div>
                    <button onClick={() => handleIncrement(setRedCards, redCards, 1)} className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition">
                      <Plus size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>

                {renderStatRow("Own Goals", ownGoals, setOwnGoals)}
              </>
            )}

          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 h-12 shrink-0 rounded-2xl bg-white text-black font-display tracking-[0.2em] uppercase font-bold transition duration-200 hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "SUBMIT STATS"}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
