"use client";

import { useState } from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { StrykLogo } from "@/components/stryk-logo";

export default function Home() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleJoinTap = () => {
    setIsTransitioning(true);
    // The Clerk modal will intercept shortly after, but we can set a slight delay if we want.
    // However, since it's a native Clerk button, we just let it pop the modal and show our visual feedback.
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  return (
    <main 
      className="relative h-dvh w-dvw overflow-hidden bg-[#05070B] text-white flex flex-col items-center justify-center selection:bg-[#C6FF00]/30 selection:text-[#C6FF00]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Background Layer 1: Base Gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(198,255,0,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(91,140,255,0.05) 0%, transparent 55%), #05070B",
        }}
      />

      {/* Background Layer 2: Noise Texture (2-3% opacity) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Background Layer 3: Moving Glow behind Logo (20s breathing animation) */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] bg-[#C6FF00]/5 z-0 pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <section className="relative z-10 flex flex-col items-center justify-center h-full w-full max-w-sm px-6">
        
        {/* Logo & Hero Copy */}
        <div className="flex flex-col items-center w-full mb-12 mt-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0 }}
            className="flex flex-col items-center"
          >
            {/* Subtle electric pulse on logo every 4s */}
            <motion.div
              animate={{ filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 4, ease: "easeOut" }}
            >
              <StrykLogo compact centered />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="text-[28px] font-display font-bold tracking-[0.08em] uppercase text-white mt-5 text-center"
          >
            STRYK
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className="text-[14px] font-medium tracking-wide text-[#C6FF00] mt-1 text-center"
          >
            The Athlete Identity Layer
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
            className="flex flex-col items-center mt-6 gap-1 text-[13px] text-white/50 font-medium text-center"
          >
            <p>Build your athlete profile.</p>
            <p>Track achievements.</p>
            <p>Get discovered.</p>
          </motion.div>
        </div>

        {/* Buttons & Conversion Psychology */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          className="w-full flex flex-col gap-4 mt-auto mb-10 relative"
        >
          {/* JOIN STRYK */}
          <div className="relative group w-full">
            {/* Subtle soft green reflection underneath */}
            <div className="absolute -inset-1 bg-[#C6FF00]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
            
            <SignUpButton mode="modal" forceRedirectUrl="/sync" fallbackRedirectUrl="/sync">
              <motion.button
                onClick={handleJoinTap}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                aria-label="Join STRYK"
                className="relative w-full h-[56px] rounded-2xl bg-[#C6FF00] text-[14px] font-display tracking-[0.2em] uppercase text-black font-bold shadow-[0_0_0_0_rgba(198,255,0,0)] hover:shadow-[0_0_30px_-5px_rgba(198,255,0,0.6)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white overflow-hidden cursor-pointer flex items-center justify-center"
              >
                {/* Idle Shimmer Effect */}
                <motion.div 
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                  animate={{ translateX: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
                />
                JOIN STRYK
              </motion.button>
            </SignUpButton>
          </div>

          <p className="text-center text-[11px] text-white/40 font-medium tracking-wide">
            Setup takes less than 60 seconds
          </p>

          {/* LOG IN */}
          <SignInButton mode="modal" forceRedirectUrl="/sync" fallbackRedirectUrl="/sync">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
              whileTap={{ scale: 0.98 }}
              aria-label="Log in to STRYK"
              className="relative w-full h-[56px] rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 text-[13px] font-display tracking-[0.2em] uppercase text-white shadow-inner shadow-white/5 hover:border-white/20 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF00] cursor-pointer overflow-hidden flex items-center justify-center mt-2"
            >
              {/* Inner highlight for glassmorphism */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
              LOG IN
            </motion.button>
          </SignInButton>
        </motion.div>

        {/* Trust Block */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex flex-col items-center gap-2 pb-8 pt-4 w-full border-t border-white/5"
        >
          <div className="flex items-center gap-2 text-[10px] text-white/30 tracking-wider font-medium">
            <Check className="w-3 h-3 text-[#C6FF00]/70" />
            <span>Free Forever</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/30 tracking-wider font-medium">
            <Check className="w-3 h-3 text-[#C6FF00]/70" />
            <span>Athlete Verified Profiles</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/30 tracking-wider font-medium">
            <Check className="w-3 h-3 text-[#C6FF00]/70" />
            <span>Built for Competitive Players</span>
          </div>
        </motion.div>

      </section>

      {/* Page Transition overlay (if triggered) */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#05070B] pointer-events-none"
          />
        )}
      </AnimatePresence>
    </main>
  );
}
