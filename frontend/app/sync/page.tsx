"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { StrykLogo } from "@/components/stryk-logo";
import { motion } from "framer-motion";

export default function SyncPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    const checkProfile = async () => {
      try {
        const res = await fetch("/api/profile/me");
        
        if (res.ok) {
          // Profile exists
          router.replace("/home");
        } else if (res.status === 404 || res.status === 401) {
          // Profile does not exist (404) or token issue (401) requiring setup
          router.replace("/identity");
        } else {
          // Some other server error
          setError(true);
        }
      } catch (e) {
        setError(true);
      }
    };
    
    checkProfile();
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center bg-[#E5DCC5]">
      {/* Premium Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/create_card_bg.webp')" }}
      />
      
      {/* STRYK 3D Logo - Absolutely Centered */}
      <div className="absolute inset-0 flex items-center justify-center z-10 px-6 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-[65%] max-w-[280px] translate-y-[-10%]"
        >
          <img 
            src="/logo.webp" 
            alt="STRYK" 
            className="w-full h-auto object-contain drop-shadow-2xl" 
          />
        </motion.div>
      </div>

      {/* Loading Indicator Area - Absolutely Positioned Below */}
      <div className="absolute top-[52%] left-0 right-0 z-10 flex flex-col items-center gap-5 w-full px-6 pointer-events-none">
        {/* Golden Glowing Line (Ref Img 3) */}
        <div className="relative w-[240px] h-[1px] flex justify-center items-center">
          {/* The faded track */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C39332]/70 to-transparent" />
          {/* The bright glowing core */}
          <motion.div 
            animate={{ 
              opacity: [0.5, 1, 0.5],
              width: ["30px", "80px", "30px"]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-[2px] bg-[#FFFDF5] rounded-full blur-[0.5px] shadow-[0_0_15px_4px_rgba(216,165,59,0.9)]" 
          />
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="font-display text-[clamp(10px,3vw,12px)] tracking-[0.15em] uppercase font-bold text-[#6A5A3B] drop-shadow-sm"
        >
          {error ? "Error connecting. Retrying..." : "Checking athlete profile..."}
        </motion.p>
      </div>
    </main>
  );
}
