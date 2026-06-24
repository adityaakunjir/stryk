"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PendingVerification {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  goals: number;
  assists: number;
  shotsOnTarget: number;
  keyPasses: number;
  progressivePasses: number;
  tackles: number;
  interceptions: number;
  blocks: number;
  clearances: number;
  ballRecoveries: number;
  duelsWon: number;
  aerialDuelsWon: number;
  saves: number;
  bigSaves: number;
  penaltySaves: number;
  distributionAssists: number;
  cleanSheet: boolean;
  motm: boolean;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  noShow: boolean;
  status: string;
  verificationNote: string | null;
}

interface PeerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
}

export function PeerVerificationModal({ isOpen, onClose, matchId }: PeerVerificationModalProps) {
  const [pending, setPending] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [disputing, setDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPendingVerifications();
    }
  }, [isOpen]);

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/pending-verifications`);
      const data = await res.json();
      if (data.success) {
        setPending(data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending verifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (vote: number) => {
    if (vote === -1 && disputeReason.trim().length === 0) {
      toast.error("Please provide a reason for disputing.");
      return;
    }

    const currentStat = pending[currentIndex];
    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlayerId: currentStat.userId,
          vote,
          disputeReason: vote === -1 ? disputeReason : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(vote === 1 ? "Stats Verified!" : "Dispute filed.");
        // Remove from list
        const newList = [...pending];
        newList.splice(currentIndex, 1);
        setPending(newList);
        
        // Reset state
        setDisputing(false);
        setDisputeReason("");
        if (currentIndex >= newList.length) {
          setCurrentIndex(Math.max(0, newList.length - 1));
        }

        if (newList.length === 0) {
          onClose(); // all done
        }
      } else {
        toast.error(data.message || "Failed to submit vote");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentStat = pending[currentIndex];

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
          className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-2xl uppercase italic tracking-wide text-white">Peer Verification</h3>
              <p className="text-xs text-white/40 mt-1">Review your teammates' claims</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="animate-spin text-[#C6FF00] mb-4" size={32} />
              <p className="text-white/40 text-sm">Loading submissions...</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Check className="text-[#C6FF00]" size={32} />
              </div>
              <p className="text-white text-lg font-display uppercase italic">All Caught Up!</p>
              <p className="text-white/40 text-sm text-center mt-2 px-6">
                You have verified all available stats. Check back later if others submit.
              </p>
              <button
                onClick={onClose}
                className="mt-8 px-8 h-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition font-bold text-sm tracking-widest uppercase"
              >
                Close
              </button>
            </div>
          ) : currentStat ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                  {currentStat.avatarUrl ? (
                    <img src={currentStat.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/50 font-bold text-lg">{currentStat.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{currentStat.username}</h4>
                  <p className="text-xs text-[#C6FF00]">
                    {pending.length} remaining to review
                  </p>
                </div>
              </div>

              {currentStat.verificationNote && (
                 <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-500/80 text-xs">
                   <span className="font-bold">SYSTEM FLAG:</span> {currentStat.verificationNote}
                 </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Goals", value: currentStat.goals },
                  { label: "Assists", value: currentStat.assists },
                  { label: "Shots (T)", value: currentStat.shotsOnTarget },
                  { label: "Key Passes", value: currentStat.keyPasses },
                  { label: "Prog. Passes", value: currentStat.progressivePasses },
                  { label: "Tackles", value: currentStat.tackles },
                  { label: "Interceptions", value: currentStat.interceptions },
                  { label: "Blocks", value: currentStat.blocks },
                  { label: "Clearances", value: currentStat.clearances },
                  { label: "Ball Recov.", value: currentStat.ballRecoveries },
                  { label: "Duels", value: currentStat.duelsWon },
                  { label: "Aerial", value: currentStat.aerialDuelsWon },
                  { label: "Saves", value: currentStat.saves },
                  { label: "Big Saves", value: currentStat.bigSaves },
                  { label: "Pen Saves", value: currentStat.penaltySaves },
                  { label: "Dist. Assists", value: currentStat.distributionAssists },
                  { label: "Yellow", value: currentStat.yellowCards },
                  { label: "Red", value: currentStat.redCards },
                  { label: "Own Goals", value: currentStat.ownGoals }
                ].filter(s => s.value > 0).map(s => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center">
                    <span className="text-2xl font-display text-white">{s.value}</span>
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest text-center">{s.label}</span>
                  </div>
                ))}
                
                {currentStat.cleanSheet && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex flex-col items-center col-span-2">
                    <span className="text-lg font-bold text-blue-400 uppercase tracking-widest mt-1">Clean Sheet</span>
                  </div>
                )}
                {currentStat.motm && (
                  <div className="bg-[#A28B52]/10 border border-[#A28B52]/30 rounded-xl p-3 flex flex-col items-center col-span-2">
                    <span className="text-lg font-bold text-[#A28B52] uppercase tracking-widest mt-1">Man of the Match</span>
                  </div>
                )}
                {currentStat.noShow && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex flex-col items-center col-span-2">
                    <span className="text-lg font-bold text-red-500 uppercase tracking-widest mt-1">No Show</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-8">
                {currentStat.cleanSheet && (
                  <span className="px-3 py-1 bg-[#C6FF00]/10 text-[#C6FF00] rounded-full text-[10px] uppercase font-bold tracking-wider">Clean Sheet</span>
                )}
                {currentStat.motm && (
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] uppercase font-bold tracking-wider">MOTM</span>
                )}
                {currentStat.yellowCards > 0 && (
                  <span className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-[10px] uppercase font-bold tracking-wider">{currentStat.yellowCards} Yellow(s)</span>
                )}
                 {currentStat.redCards > 0 && (
                  <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] uppercase font-bold tracking-wider">Red Card</span>
                )}
              </div>

              {disputing ? (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Briefly explain why this is inaccurate (max 100 chars)..."
                    maxLength={100}
                    className="w-full bg-white/5 border border-red-500/30 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-500 resize-none h-24"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDisputing(false)}
                      className="flex-1 h-12 rounded-xl bg-white/10 text-white font-bold text-xs tracking-widest uppercase hover:bg-white/20 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleVote(-1)}
                      disabled={submitting || disputeReason.trim().length === 0}
                      className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold text-xs tracking-widest uppercase hover:bg-red-600 transition disabled:opacity-50 flex justify-center items-center"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : "Submit Dispute"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setDisputing(true)}
                    className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-bold text-sm tracking-widest uppercase hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Dispute
                  </button>
                  <button
                    onClick={() => handleVote(1)}
                    disabled={submitting}
                    className="flex-[2] h-14 rounded-2xl bg-[#C6FF00] text-black font-display font-bold text-lg uppercase italic tracking-wide hover:bg-[#C6FF00]/90 transition flex justify-center items-center gap-2"
                  >
                     {submitting ? <Loader2 size={20} className="animate-spin" /> : <><Check size={20} /> Verify Stats</>}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
