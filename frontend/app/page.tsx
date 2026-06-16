"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleJoinTap = () => {
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  return (
    <main 
      className="relative h-dvh w-dvw overflow-hidden bg-[#0A0A0A] text-white flex flex-col justify-between"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Background Layer: Marble Stadium */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/landing_page_bg.webp')",
        }}
      />

      <section className="relative z-10 flex flex-col h-full w-full max-w-md mx-auto px-6 py-8 pb-10">
        
        {/* Top / Middle Section */}
        <div className="flex-1 relative flex flex-col pt-4">
          
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-start mb-6"
          >
            <svg width="32" height="40" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
              <path d="M13.625 0L0 17.5H10.5L8.375 32L22 14.5H11.5L13.625 0Z" fill="url(#gold-grad)"/>
              <defs>
                <linearGradient id="gold-grad" x1="11" y1="0" x2="11" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F5D78D" />
                  <stop offset="0.5" stopColor="#C1973E" />
                  <stop offset="1" stopColor="#8A631B" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-[10px] tracking-[0.6em] text-[#A67C00] font-bold ml-1">STRYK</div>
          </motion.div>

          {/* Headline Copy */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative z-20 flex flex-col mt-4"
          >
            <h1 className="font-display text-[64px] sm:text-[72px] leading-[0.85] italic flex flex-col tracking-tight mb-6">
              <span className="text-[#1C1A17] drop-shadow-sm">BUILD YOUR</span>
              <span className="text-[#1C1A17] drop-shadow-sm">FOOTBALL</span>
              <span className="bg-gradient-to-b from-[#FFE380] via-[#D4A32A] to-[#8A5B12] text-transparent bg-clip-text drop-shadow-md">IDENTITY.</span>
            </h1>
            
            <div className="text-[#1C1A17] text-[11px] tracking-[0.25em] font-bold mt-2 mb-3">
              ONE PROFILE.<br/>EVERY MATCH.
            </div>
            <div className="w-8 h-[2px] bg-[#A67C00]"></div>
          </motion.div>

          {/* 3D Player Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[18%] -right-[30%] sm:-right-[20%] w-[340px] sm:w-[400px] z-10 pointer-events-none drop-shadow-2xl"
          >
            <img 
              src="/landing_page_playercard.webp" 
              alt="STRYK Player Card" 
              className="w-full h-auto object-contain"
            />
          </motion.div>
        </div>

        {/* Bottom CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="relative z-20 flex flex-col gap-4 mt-auto w-full pt-8"
        >
          {isLoaded && isSignedIn ? (
            <button 
              onClick={() => { setIsTransitioning(true); router.push("/sync"); }}
              className="w-full h-[60px] rounded-2xl bg-[#D4F829] text-[15px] font-bold tracking-widest text-black flex items-center justify-center relative hover:bg-[#c3e625] transition-all shadow-[0_0_30px_rgba(212,248,41,0.2)] active:scale-95"
            >
              GO TO DASHBOARD
              <svg className="absolute right-6 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          ) : (
            <>
              {/* JOIN Button */}
              <SignUpButton mode="modal" forceRedirectUrl="/sync" fallbackRedirectUrl="/sync">
                <button 
                  onClick={handleJoinTap}
                  className="w-full h-[60px] rounded-2xl bg-[#D4F829] text-[15px] font-bold tracking-widest text-black flex items-center justify-center relative hover:bg-[#c3e625] transition-all shadow-[0_0_30px_rgba(212,248,41,0.2)] active:scale-95"
                >
                  JOIN STRYK
                  <svg className="absolute right-6 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </SignUpButton>

              {/* Divider */}
              <div className="flex items-center gap-4 my-1">
                <div className="h-[1px] flex-1 bg-[#4A3D22]"></div>
                <div className="text-[10px] tracking-widest text-[#7C6335] font-semibold">ALREADY HAVE AN ACCOUNT?</div>
                <div className="h-[1px] flex-1 bg-[#4A3D22]"></div>
              </div>

              {/* LOG IN Button */}
              <SignInButton mode="modal" forceRedirectUrl="/sync" fallbackRedirectUrl="/sync">
                <button className="w-full h-[60px] rounded-2xl bg-black/40 backdrop-blur-sm border border-[#4A3D22] text-[15px] font-bold tracking-widest text-[#B5944B] flex items-center justify-center relative hover:bg-black/60 hover:border-[#7C6335] transition-all active:scale-95">
                  LOG IN
                  <svg className="absolute right-6 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </SignInButton>
            </>
          )}

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 mt-2 text-[9px] tracking-[0.2em] font-semibold text-[#665229]">
            <svg className="w-4 h-4 text-[#A67C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            TRUSTED BY COMPETITIVE FOOTBALLERS
          </div>
        </motion.div>
      </section>

      {/* Page Transition overlay */}
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
