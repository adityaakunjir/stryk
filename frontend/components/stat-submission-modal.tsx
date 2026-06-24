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
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);
  const [yellowCards, setYellowCards] = useState(0);
  const [redCards, setRedCards] = useState(0);
  const [saves, setSaves] = useState(0);
  const [tackles, setTackles] = useState(0);
  const [cleanSheet, setCleanSheet] = useState(false);
  const [motm, setMotm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Format caps
  const formatGoalsCaps: Record<string, number> = {
    "3v3": 4,
    "5v5": 5,
    "7v7": 5,
    "11v11": 6,
  };
  const goalCap = formatGoalsCaps[matchFormat] || 6;

  const handleIncrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, max: number) => {
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
          saves,
          tackles,
          cleanSheet: isGoalkeeper ? cleanSheet : false,
          motm,
          yellowCards,
          redCards
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-2xl uppercase italic tracking-wide text-white">Match Stats</h3>
              <p className="text-xs text-white/40 mt-1">Submit your stats. Max goals: {goalCap}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5">
            {/* GOALS */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="font-bold text-white uppercase tracking-widest text-sm">Goals</div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleDecrement(setGoals, goals)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                >
                  <Minus size={14} className="text-white/60" />
                </button>
                <div className="w-6 text-center font-display text-xl text-white">{goals}</div>
                <button 
                  onClick={() => handleIncrement(setGoals, goals, goalCap)}
                  className="w-8 h-8 rounded-full bg-[#C6FF00]/10 flex items-center justify-center hover:bg-[#C6FF00]/20 transition"
                >
                  <Plus size={14} className="text-[#C6FF00]" />
                </button>
              </div>
            </div>

            {/* ASSISTS */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="font-bold text-white uppercase tracking-widest text-sm">Assists</div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleDecrement(setAssists, assists)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                >
                  <Minus size={14} className="text-white/60" />
                </button>
                <div className="w-6 text-center font-display text-xl text-white">{assists}</div>
                <button 
                  onClick={() => handleIncrement(setAssists, assists, goalCap)}
                  className="w-8 h-8 rounded-full bg-[#C6FF00]/10 flex items-center justify-center hover:bg-[#C6FF00]/20 transition"
                >
                  <Plus size={14} className="text-[#C6FF00]" />
                </button>
              </div>
            </div>

            {/* YELLOW CARDS */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                <div className="font-bold text-yellow-400 uppercase tracking-widest text-sm">Yellow Cards</div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleDecrement(setYellowCards, yellowCards)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                >
                  <Minus size={14} className="text-white/60" />
                </button>
                <div className="w-6 text-center font-display text-xl text-white">{yellowCards}</div>
                <button 
                  onClick={() => handleIncrement(setYellowCards, yellowCards, 2)}
                  className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center hover:bg-yellow-400/20 transition"
                >
                  <Plus size={14} className="text-yellow-400" />
                </button>
              </div>
            </div>

            {/* RED CARDS */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <AlertOctagon size={16} className="text-red-500" />
                <div className="font-bold text-red-500 uppercase tracking-widest text-sm">Red Cards</div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleDecrement(setRedCards, redCards)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                >
                  <Minus size={14} className="text-white/60" />
                </button>
                <div className="w-6 text-center font-display text-xl text-white">{redCards}</div>
                <button 
                  onClick={() => handleIncrement(setRedCards, redCards, 1)}
                  className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition"
                >
                  <Plus size={14} className="text-red-500" />
                </button>
              </div>
            </div>

            {/* SAVES (GK ONLY) */}
            {isGoalkeeper && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="font-bold text-white uppercase tracking-widest text-sm">Saves</div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleDecrement(setSaves, saves)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
                  >
                    <Minus size={14} className="text-white/60" />
                  </button>
                  <div className="w-6 text-center font-display text-xl text-white">{saves}</div>
                  <button 
                    onClick={() => handleIncrement(setSaves, saves, 50)}
                    className="w-8 h-8 rounded-full bg-[#C6FF00]/10 flex items-center justify-center hover:bg-[#C6FF00]/20 transition"
                  >
                    <Plus size={14} className="text-[#C6FF00]" />
                  </button>
                </div>
              </div>
            )}

            {/* CLEAN SHEET (GK ONLY) */}
            {isGoalkeeper && (
              <div 
                onClick={() => setCleanSheet(!cleanSheet)}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${cleanSheet ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/[0.02] border-white/5'}`}
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

            {/* MOTM */}
            <div 
              onClick={() => setMotm(!motm)}
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${motm ? 'bg-[#A28B52]/10 border-[#A28B52]/50' : 'bg-white/[0.02] border-white/5'}`}
            >
              <div className="flex items-center gap-2">
                <Award size={16} className={motm ? "text-[#A28B52]" : "text-white/40"} />
                <div className={`font-bold uppercase tracking-widest text-sm ${motm ? 'text-[#A28B52]' : 'text-white'}`}>Man of the Match</div>
              </div>
              <div className={`w-12 h-6 rounded-full flex items-center p-1 transition ${motm ? 'bg-[#A28B52]' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition ${motm ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>

          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 h-12 rounded-2xl bg-white text-black font-display tracking-[0.2em] uppercase font-bold transition duration-200 hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "SUBMIT STATS"}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
