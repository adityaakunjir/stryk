"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";

export function UpgradeOverlay({ 
  level, 
  needsUpgrade, 
  onClose 
}: { 
  level: number; 
  needsUpgrade: boolean; 
  onClose: () => void 
}) {
  const [show, setShow] = useState(needsUpgrade);

  useEffect(() => {
    if (needsUpgrade) {
      // Clear flag in background
      fetch("/api/profile/clear-upgrade", { method: "POST" }).catch(console.error);
    }
  }, [needsUpgrade]);

  if (!show) return null;

  let tierName = "Bronze";
  let tierColor = "#cd7f32"; // Bronze
  if (level >= 16) {
    tierName = "Gold";
    tierColor = "#FFD700"; // Gold
  } else if (level >= 6) {
    tierName = "Silver";
    tierColor = "#C0C0C0"; // Silver
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 "
        onClick={() => { setShow(false); onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.5, y: 50, rotateX: 45 }}
          animate={{ scale: 1, y: 0, rotateX: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 1 }}
          className="relative flex flex-col items-center text-center px-6"
        >
          {/* Confetti / Glow */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-50 pointer-events-none"
            style={{ backgroundColor: tierColor }}
          />

          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6 relative z-10"
            style={{ 
              background: `linear-gradient(135deg, ${tierColor}40, transparent)`,
              border: `2px solid ${tierColor}`
            }}
          >
            <Trophy size={48} color={tierColor} />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute inset-0 border border-dashed rounded-full opacity-30"
              style={{ borderColor: tierColor }}
            />
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-display uppercase italic text-white mb-2 relative z-10"
            style={{ textShadow: `0 0 20px ${tierColor}` }}
          >
            Tier Upgraded!
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/70 text-sm max-w-xs mb-8 relative z-10 uppercase tracking-widest"
          >
            You have reached Level {level}. Your card frame has been upgraded to <strong style={{ color: tierColor }}>{tierName}</strong>.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="px-8 h-12 rounded-2xl text-white font-bold tracking-[0.2em] uppercase text-xs hover:scale-105 transition-transform"
            style={{ backgroundColor: tierColor }}
            onClick={() => { setShow(false); onClose(); }}
          >
            Claim New Card
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
