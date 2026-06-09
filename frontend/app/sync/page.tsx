"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
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
    <main className="h-dvh w-dvw flex flex-col items-center justify-center bg-[#05070B] text-white overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex flex-col items-center gap-8">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <StrykLogo compact centered />
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-display tracking-[0.2em] uppercase text-white/50"
        >
          {error ? "Error connecting. Retrying..." : "Checking athlete profile..."}
        </motion.p>
      </div>
    </main>
  );
}
