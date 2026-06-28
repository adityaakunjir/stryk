"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CloseMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  teamAName?: string;
  teamBName?: string;
}

export function CloseMatchModal({ isOpen, onClose, matchId, teamAName = "Team A", teamBName = "Team B" }: CloseMatchModalProps) {
  const [scoreA, setScoreA] = useState<string>("");
  const [scoreB, setScoreB] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      if (scoreA !== "" && !isNaN(Number(scoreA))) {
        payload.teamAScore = Number(scoreA);
      }
      if (scoreB !== "" && !isNaN(Number(scoreB))) {
        payload.teamBScore = Number(scoreB);
      }

      const res = await fetch(`/api/matches/${matchId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined,
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Match closed successfully!");
        onClose();
        // Pusher event will handle the redirect/UI update
      } else {
        toast.error(data.message || "Failed to close match.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while closing match.");
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
          className="absolute inset-0 bg-black/60 "
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-2xl uppercase italic tracking-wide text-white">Close Match</h3>
              <p className="text-xs text-white/40 mt-1">Optional: Enter the final scoreline</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:glass-panel0 text-white/50 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest truncate max-w-[80px]" title={teamAName}>{teamAName}</span>
              <input
                type="number"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                placeholder="0"
                className="w-16 h-16 bg-white/[0.02] border border-white/10 rounded-2xl text-center text-3xl font-display text-white placeholder-white/20 focus:outline-none focus:border-[#C6FF00] focus:ring-1 focus:ring-[#C6FF00] transition"
              />
            </div>
            
            <div className="text-2xl font-display text-white/40">-</div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest truncate max-w-[80px]" title={teamBName}>{teamBName}</span>
              <input
                type="number"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                placeholder="0"
                className="w-16 h-16 bg-white/[0.02] border border-white/10 rounded-2xl text-center text-3xl font-display text-white placeholder-white/20 focus:outline-none focus:border-[#C6FF00] focus:ring-1 focus:ring-[#C6FF00] transition"
              />
            </div>
          </div>

          <p className="text-xs text-center text-white/40 mb-6 px-4">
            Closing the match will trigger the stats submission process for all players in the lobby.
          </p>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-red-500 text-white font-display tracking-[0.2em] uppercase font-bold transition duration-200 hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "CONFIRM CLOSE"}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
