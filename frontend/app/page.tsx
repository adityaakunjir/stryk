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
      className="relative h-dvh w-dvw overflow-hidden bg-[#151515] text-white flex flex-col justify-between"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-[position:74%_center] sm:bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/landing_page_bg.webp')",
        }}
      />

      <section className="relative z-10 flex flex-col h-full w-full max-w-md mx-auto px-6 py-10 pb-12">
        
        {/* Top / Middle Section */}
        <div className="flex-1 relative flex flex-col pt-4">
          
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-start mb-4"
          >
            <img src="/logo.webp" alt="STRYK Logo" className="h-[42px] w-auto mb-2" />
          </motion.div>

          {/* Headline Copy Container (centered vertically side-by-side with the player card) */}
          <div className="flex-1 flex flex-col justify-center pb-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative z-20 flex flex-col"
            >
              {/* Applied CSS transform to vertically stretch and horizontally condense the Bebas Neue font to perfectly match the mockup's tall typography */}
              <h1 className="font-display text-[42px] sm:text-[52px] leading-[0.88] italic flex flex-col mb-5 text-[#181818] transform scale-y-[1.3] scale-x-[0.85] origin-top-left tracking-tight">
                <span>BUILD YOUR</span>
                <span>FOOTBALL</span>
                <span className="bg-gradient-to-b from-[#EFCC85] via-[#D3A648] to-[#997026] text-transparent bg-clip-text pr-4 pb-1">IDENTITY.</span>
              </h1>
              
              <div className="text-[#181818] text-[9.5px] tracking-[0.25em] font-semibold mt-8 mb-3 leading-relaxed opacity-75">
                ONE PROFILE.<br/>EVERY MATCH.
              </div>
              <div className="w-6 h-[1.5px] bg-[#A37B31]"></div>
            </motion.div>
          </div>
        </div>

        {/* Bottom CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="relative z-20 flex flex-col gap-3 mt-auto w-full pt-4"
        >
          {isLoaded && isSignedIn ? (
            <button 
              onClick={() => { setIsTransitioning(true); router.push("/sync"); }}
              className="w-full h-[54px] rounded-full bg-[#D4F829] hover:bg-[#cbf026] text-white text-[13px] uppercase font-black tracking-[0.15em] flex items-center justify-center relative transition duration-300 shadow-[0_8px_20px_rgba(212,248,41,0.25)]"
            >
              GO TO DASHBOARD
              <svg className="absolute right-5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          ) : (
            <>
              {/* JOIN Button */}
              <SignUpButton mode="modal" forceRedirectUrl="/sync" fallbackRedirectUrl="/sync">
                <button 
                  onClick={handleJoinTap}
                  className="w-full h-[54px] rounded-full bg-[#D4F829] hover:bg-[#cbf026] text-white text-[13px] uppercase font-black tracking-[0.15em] flex items-center justify-center relative transition duration-300 shadow-[0_8px_20px_rgba(212,248,41,0.25)]"
                >
                  JOIN STRYK
                  <svg className="absolute right-5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </SignUpButton>

              {/* Divider */}
              <div className="flex items-center gap-4 my-2">
                <div className="h-[1px] flex-1 bg-white/10"></div>
                <div className="text-[9px] tracking-[0.1em] text-[#69542E] font-medium">ALREADY HAVE AN ACCOUNT?</div>
                <div className="h-[1px] flex-1 bg-white/10"></div>
              </div>

              {/* LOG IN Button */}
              <SignInButton mode="modal" forceRedirectUrl="/sync" fallbackRedirectUrl="/sync">
                <button className="w-full h-[54px] rounded-full border border-[#D4F829]/50 bg-transparent text-[#D4F829] text-[13px] uppercase font-black tracking-[0.15em] flex items-center justify-center relative hover:bg-[#D4F829]/10 transition duration-300">
                  LOG IN
                  <svg className="absolute right-5 w-4 h-4 text-[#D4F829]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </SignInButton>
            </>
          )}

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 mt-2 text-[9px] tracking-[0.15em] font-medium text-[#69542E]">
            <svg className="w-[14px] h-[14px] text-[#A67C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
