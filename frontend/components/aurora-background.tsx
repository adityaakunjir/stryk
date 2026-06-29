"use client";
import { motion } from "framer-motion";

export function AuroraBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050505]">
      {/* Heavy noise overlay for the entire background */}
      <div 
        className="absolute inset-0 z-10 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />
      
      {/* Aurora Orbs - Deep Greens, Golds, and Blacks for Stryk */}
      <div className="absolute inset-0 blur-[100px] saturate-[150%] opacity-60">
        <motion.div 
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-[#1A361D] mix-blend-screen"
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#A28B52]/30 mix-blend-screen"
          animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 1.5, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div 
          className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-[#2A261D] mix-blend-screen"
          animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
        <motion.div 
          className="absolute bottom-[10%] right-[20%] w-[45vw] h-[45vw] rounded-full bg-[#32451C] mix-blend-screen"
          animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 7 }}
        />
      </div>
    </div>
  );
}
