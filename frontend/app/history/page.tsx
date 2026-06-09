"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Activity, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const router = useRouter();

  return (
    <main className="stryk-mobile-shell bg-[#05070B] text-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="px-5 pt-safe pb-4 border-b border-white/5 flex items-center gap-3 shrink-0 mt-6">
        <button
          onClick={() => router.push("/home")}
          className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Match Data</div>
          <div className="font-display tracking-wider text-xl">HISTORY</div>
        </div>
      </header>

      {/* Empty State Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

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
            className="w-full h-14 rounded-2xl bg-[#C6FF00] text-black font-display text-[14px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_30px_-5px_rgba(198,255,0,0.4)]"
          >
            <Play size={16} fill="currentColor" /> FIND MATCH
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
