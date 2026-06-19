"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  Camera,
  Check,
  ImageUp,
  Loader2,
  ScanFace,
  UserRound,
  X,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player-context";
import { PlayerCard } from "@/components/player-card";
import { PlayerPhotoUpload } from "@/components/PlayerPhotoUpload";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";


function Stepper() {
  return (
    <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-display tracking-[0.2em] uppercase text-[#1A1A1A]/60 font-medium">
      <div className="text-[#1A1A1A] font-bold flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#D4F829] shadow-[0_0_8px_rgba(212,248,41,0.8)]" />
        Identity
      </div>
      <div className="w-4 sm:w-6 h-[1px] bg-black/20" />
      <div>Player</div>
      <div className="w-4 sm:w-6 h-[1px] bg-black/20" />
      <div>Stats</div>
    </div>
  );
}

// 500ms debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function IdentityPage() {
  const router = useRouter();
  const { user, isLoaded: clerkLoaded } = useUser();
  const { playerData, updatePlayerData } = usePlayer();

  const [fullName, setFullName] = useState(playerData?.fullName || "");
  const [username, setUsername] = useState(playerData?.username || "");
  const [avatar, setAvatar] = useState(playerData?.avatar || "");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [avatarPosition, setAvatarPosition] = useState(playerData?.avatarPosition || "center 15%");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Debounced username
  const debouncedUsername = useDebounce(username, 500);

  // Autofill from Clerk
  useEffect(() => {
    if (clerkLoaded && user && !fullName && !playerData?.fullName) {
      if (user.fullName) setFullName(user.fullName);
    }
  }, [clerkLoaded, user, fullName, playerData]);

  // Sync with context on load
  useEffect(() => {
    if (playerData) {
      queueMicrotask(() => {
        if (playerData.fullName) setFullName(playerData.fullName);
        if (playerData.username) setUsername(playerData.username);
        if (playerData.avatar) setAvatar(playerData.avatar);
        if (playerData.avatarPosition) setAvatarPosition(playerData.avatarPosition);
      });
    }
  }, [playerData]);

  // Real-time username validation
  useEffect(() => {
    const checkUser = async () => {
      const cleanUsername = debouncedUsername.trim();
      if (!cleanUsername) {
        setUsernameStatus("idle");
        return;
      }
      if (cleanUsername.length < 3) {
        setUsernameStatus("invalid");
        return;
      }
      if (playerData?.username && cleanUsername === playerData.username) {
        setUsernameStatus("available");
        return;
      }
      
      setUsernameStatus("checking");
      try {
        const response = await fetch(`/api/check-username?username=${encodeURIComponent(cleanUsername)}`);
        if (!response.ok) throw new Error("Failed to check");
        const data = await response.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    };
    checkUser();
  }, [debouncedUsername]);

  const handlePhotoSave = (base64Url: string, cropPos: string) => {
    setAvatar(base64Url);
    setAvatarPosition(cropPos);
    updatePlayerData({ avatar: base64Url, avatarPosition: cropPos });
  };

  const handleRemovePhoto = () => {
    setAvatar("");
    setAvatarPosition("center 15%");
    updatePlayerData({ avatar: "", avatarPosition: "center 15%" });
  };

  const handleGeneratePhoto = () => {
    setIsGenerating(true);
    // Fake progress for premium feel
    setTimeout(() => {
      const gradients = [
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'><defs><radialGradient id='g' cx='50%' cy='35%' r='65%'><stop offset='0%' stop-color='%23bef518'/><stop offset='45%' stop-color='%2310b981'/><stop offset='100%' stop-color='%23064e3b'/></radialGradient></defs><rect width='100' height='100' fill='url(%23g)'/><circle cx='50' cy='40' r='18' fill='%23ffffff' opacity='0.9'/><path d='M25 80 C 25 60, 75 60, 75 80' fill='%23ffffff' opacity='0.9'/></svg>",
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'><defs><radialGradient id='g' cx='50%' cy='35%' r='65%'><stop offset='0%' stop-color='%2367e8f9'/><stop offset='50%' stop-color='%230284c7'/><stop offset='100%' stop-color='%230f172a'/></radialGradient></defs><rect width='100' height='100' fill='url(%23g)'/><circle cx='50' cy='40' r='18' fill='%23ffffff' opacity='0.9'/><path d='M25 80 C 25 60, 75 60, 75 80' fill='%23ffffff' opacity='0.9'/></svg>",
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'><defs><radialGradient id='g' cx='50%' cy='35%' r='65%'><stop offset='0%' stop-color='%23f472b6'/><stop offset='50%' stop-color='%23db2777'/><stop offset='100%' stop-color='%234c0519'/></radialGradient></defs><rect width='100' height='100' fill='url(%23g)'/><circle cx='50' cy='40' r='18' fill='%23ffffff' opacity='0.9'/><path d='M25 80 C 25 60, 75 60, 75 80' fill='%23ffffff' opacity='0.9'/></svg>",
      ];
      const selected = gradients[Math.floor(Math.random() * gradients.length)];
      setAvatar(selected);
      updatePlayerData({ avatar: selected });
      setIsGenerating(false);
    }, 1200);
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !username.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }
    if (usernameStatus !== "available") {
      toast.error("Please choose an available username.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          avatarUrl: avatar,
        }),
      });

      if (!response.ok) throw new Error("Failed to save profile");

      updatePlayerData({
        fullName: fullName.trim(),
        username: username.trim(),
        avatar: avatar,
        avatarPosition: avatarPosition,
      });

      setIsSuccess(true);
      // Success Moment (800ms delay)
      setTimeout(() => {
        router.push("/position");
      }, 800);
    } catch (err: any) {
      Sentry.captureException(err, {
        tags: { action: "identity_creation" }
      });
      toast.error(err.message || "Failed to communicate with server.");
      setIsSubmitting(false);
    }
  };

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Dynamic Glow
  let glowOpacity = 0.05;
  if (usernameStatus === "available") glowOpacity = 0.2;
  if (avatar) glowOpacity = 0.4;
  if (isSuccess) glowOpacity = 0.8;

  const previewPlayer = {
    ...playerData,
    fullName: fullName || "YOUR NAME",
    username: username || "username",
    avatar: avatar,
    avatarPosition: avatarPosition,
    position: playerData?.position || "CAM",
    playStyle: playerData?.playStyle || "Playmaker",
    rating: playerData?.rating || 50,
  } as any;

  return (
    <main className="stryk-mobile-shell bg-[#E5DCC5] overflow-hidden text-[#1A1A1A]">
      {/* Full Screen Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/create_card_bg.webp')" }}
      />
      
      <section data-scroll-panel className="relative mx-auto flex h-full w-full max-w-5xl flex-col px-5 pb-7 pt-6 sm:px-8 lg:px-10 z-10 overflow-y-auto min-h-0"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <motion.header 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <Button asChild variant="ghost" size="icon" aria-label="Back to home" className="w-10 h-10 rounded-full bg-transparent border border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/5 cursor-pointer text-[#1A1A1A]">
            <Link href="/">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <Stepper />
          <div className="w-10 h-10" />
        </motion.header>

        <div className="mx-auto mt-6 flex w-full max-w-[54rem] flex-col items-center pb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="flex items-center justify-center mb-6"
          >
            <img src="/logo.webp" alt="STRYK Logo" className="h-[42px] w-auto" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <h2 className="font-display text-[40px] sm:text-6xl uppercase italic leading-[0.9] tracking-wider text-[#2A261D] drop-shadow-sm font-black">
              BUILD YOUR<br/>
              <span className="text-[#A28B52]">ATHLETE IDENTITY</span>
            </h2>
            <p className="mt-4 text-[13px] sm:text-sm font-medium text-[#1A1A1A]/60">
              Start with the basics for your player card.
            </p>
          </motion.div>

          <form onSubmit={handleNext} className="mt-8 w-full rounded-[2rem] border border-[#8E793E]/30 bg-[#151515] p-5 shadow-[0_28px_50px_rgba(0,0,0,0.5)] sm:p-8 relative">

            <div className="grid gap-8 md:grid-cols-[1fr_17rem] md:items-start">
              
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.45 }}>
                <div className="flex items-start gap-3">
                  <span className="text-4xl font-display italic text-[#A28B52]">1.</span>
                  <div>
                    <h1 className="text-xl font-display uppercase tracking-[0.1em] text-[#E8E8E8]">Basic Info</h1>
                    <p className="mt-0.5 text-[12px] text-[#808080]">This will be visible on your player card.</p>
                  </div>
                </div>

                {/* Avatar Redesign */}
                <div className="mt-8">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A28B52]">Avatar</label>
                  <p className="text-[11px] text-[#808080] mb-4 mt-0.5">Upload or generate a front-facing photo.</p>
                  
                  <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-[#2A2A2A] flex flex-col items-center">
                    <PlayerPhotoUpload 
                      currentPhotoUrl={avatar} 
                      currentCropPosition={avatarPosition}
                      onSave={handlePhotoSave}
                    />
                    
                    {avatar && (
                      <button 
                        type="button" 
                        onClick={handleRemovePhoto} 
                        className="mt-4 text-[10px] font-bold text-[#808080] uppercase tracking-wider hover:text-red-400 transition cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {/* Floating Label Inputs */}
                  <div className="relative group">
                    <input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                      className="block w-full h-[60px] px-4 pt-4 pb-1 text-[15px] text-[#E8E8E8] bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl appearance-none focus:outline-none focus:ring-0 focus:border-[#A28B52] transition-all duration-200 peer"
                      placeholder=" "
                    />
                    <label htmlFor="fullName" className="absolute text-[9px] font-bold uppercase tracking-[0.15em] text-[#A28B52] duration-200 transform -translate-y-3 scale-75 top-[18px] z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#A28B52]">
                      Full Name
                    </label>
                    <UserRound size={18} strokeWidth={1.5} className="absolute right-4 top-5 text-[#A28B52]/50" />
                  </div>

                  <div className="relative group">
                    <input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20))}
                      className="block w-full h-[60px] px-4 pt-4 pb-1 text-[15px] text-[#E8E8E8] bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl appearance-none focus:outline-none focus:ring-0 focus:border-[#A28B52] transition-all duration-200 peer"
                      placeholder=" "
                    />
                    <label htmlFor="username" className="absolute text-[9px] font-bold uppercase tracking-[0.15em] text-[#A28B52] duration-200 transform -translate-y-3 scale-75 top-[18px] z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#A28B52]">
                      Username
                    </label>
                    
                    <div className="absolute inset-y-0 right-4 flex items-center justify-center pointer-events-none">
                      {usernameStatus === "checking" && <Loader2 size={16} className="animate-spin text-[#808080]" />}
                      {usernameStatus === "available" && <Check size={18} strokeWidth={2.5} className="text-[#D4F829]" />}
                      {usernameStatus === "taken" && <X size={18} strokeWidth={2.5} className="text-[#FF3333]" />}
                      {usernameStatus === "idle" && <Check size={18} strokeWidth={2.5} className="text-[#D4F829]" />}
                    </div>
                  </div>

                  {/* Dynamic Validation Banner */}
                  <AnimatePresence mode="popLayout">
                    {usernameStatus === "taken" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 mt-2">
                          <div className="flex items-center gap-2">
                            <X className="size-4 text-red-400" />
                            <p className="text-[11px] font-bold text-red-400 uppercase tracking-wide">Username taken. Try these:</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[`${username}82`, `${username}_cam`, `official${username}`].map(sug => (
                              <button key={sug} type="button" onClick={() => setUsername(sug)} className="px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-[10px] text-[#A0A0A0] hover:text-[#E8E8E8] transition cursor-pointer border border-[#2A2A2A]">
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Player Card 3D Preview */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}
                className="relative flex justify-center mt-6 md:mt-0"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="scale-90 md:scale-100 origin-center z-10 mx-auto">
                  <PlayerCard player={previewPlayer} size="md" />
                </motion.div>
              </motion.div>
            </div>

            {/* CTA Button 2.0 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.75 }} className="mt-10 relative group">
              <div className="absolute -inset-1 bg-[#D4F829]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                disabled={isSubmitting || isSuccess || usernameStatus !== "available" || !fullName}
                className="relative w-full h-[60px] rounded-full bg-[#D4F829] text-[#1A1A1A] font-display tracking-[0.15em] uppercase font-bold flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#cbf026] disabled:opacity-50 overflow-hidden shadow-[0_0_0_0_rgba(212,248,41,0)] hover:shadow-[0_0_30px_-5px_rgba(212,248,41,0.6)] text-[15px]" 
                type="submit"
              >
                {!isSubmitting && !isSuccess && (
                  <motion.div 
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                    animate={{ translateX: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
                  />
                )}
                
                {isSuccess ? (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                    <Check className="size-5 stroke-[3]" /> IDENTITY CREATED
                  </motion.div>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" /> CREATING IDENTITY...
                  </>
                ) : (
                  <>
                    CONTINUE <ArrowLeft className="rotate-180 size-4 ml-1" strokeWidth={3} />
                  </>
                )}
              </motion.button>
            </motion.div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
              <ScanFace className="size-3 text-[#D4F829]" />
              Secure Athlete Setup
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
