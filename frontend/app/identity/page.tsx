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
import { ImageCropper } from "@/components/image-cropper";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";


function Stepper() {
  return (
    <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-display tracking-[0.2em] uppercase text-white/40">
      <div className="text-[#C6FF00] flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#C6FF00] shadow-[0_0_8px_rgba(198,255,0,0.8)]" />
        Identity
      </div>
      <div className="w-4 sm:w-6 h-[1px] bg-white/20" />
      <div>Player</div>
      <div className="w-4 sm:w-6 h-[1px] bg-white/20" />
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
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCropSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBase64: string) => {
    setAvatar(croppedBase64);
    updatePlayerData({ avatar: croppedBase64 });
    setCropSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileUpload = () => fileInputRef.current?.click();
  const handleRemovePhoto = () => {
    setAvatar("");
    updatePlayerData({ avatar: "" });
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
    fullName: fullName || "YOUR NAME",
    username: username || "username",
    avatar: avatar || "",
    position: "CAM",
    secondaryPosition: "",
    strongFoot: "Left" as const,
    playStyle: "Playmaker" as const,
    bio: "",
    rating: 82,
  };

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] overflow-hidden">
      {/* Background Layer 1: Base Gradient */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(198,255,0,0.08)_0%,transparent_60%),radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(91,140,255,0.05)_0%,transparent_55%),#05070B]" />
      
      {/* Background Layer 2: Noise Texture */}
      <div className="fixed inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg_viewBox=%220_0_200_200%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22noiseFilter%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.65%22_numOctaves=%223%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
      
      {/* Background Layer 3: Moving Glow */}
      <motion.div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] bg-[#C6FF00]/10 z-0 pointer-events-none"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Background Layer 4: Football Pitch Grid */}
      <div className="fixed inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(180deg,transparent,rgba(11,16,32,0.72)),repeating-linear-gradient(96deg,rgba(198,255,0,0.08)_0_1px,transparent_1px_52px)] opacity-60 pointer-events-none z-0" />

      <section data-scroll-panel className="relative mx-auto flex h-full w-full max-w-5xl flex-col px-5 pb-7 pt-6 sm:px-8 lg:px-10 z-10 overflow-y-auto min-h-0"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <motion.header 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <Button asChild variant="ghost" size="icon" aria-label="Back to home" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
            <Link href="/">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <Stepper />
          <div className="w-9 h-9" />
        </motion.header>

        <div className="mx-auto mt-7 flex w-full max-w-[54rem] flex-1 shrink-0 flex-col items-center min-h-[min-content] pb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="flex items-center gap-2 justify-center mb-6"
          >
            <div className="w-8 h-8 rounded-lg bg-[#C6FF00] text-black flex items-center justify-center font-display text-base shadow-[0_0_15px_rgba(198,255,0,0.3)]">S</div>
            <div className="font-display tracking-[0.35em] text-base text-white/90">STRYK</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <h2 className="font-display text-4xl sm:text-6xl uppercase italic leading-none tracking-wide text-white">
              BUILD YOUR<br/>
              <span className="text-[#C6FF00]" style={{ textShadow: "0 0 24px rgba(198,255,0,0.25)" }}>ATHLETE IDENTITY</span>
            </h2>
            <p className="mt-3 text-sm font-semibold text-white/50">
              Start with the basics for your player card.
            </p>
          </motion.div>

          <form onSubmit={handleNext} className="mt-8 w-full flex-1 shrink-0 rounded-[2rem] border border-white/8 bg-[#0B1020]/40 p-5 shadow-[0_28px_100px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl sm:flex-none sm:p-8 relative">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <div className="grid gap-8 md:grid-cols-[1fr_17rem] md:items-start">
              
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.45 }}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl font-display italic text-[#C6FF00]">1.</span>
                  <div>
                    <h1 className="text-xl font-display uppercase tracking-wider text-white">Basic Info</h1>
                    <p className="mt-1 text-xs text-white/50 leading-relaxed">This will be visible on your player card.</p>
                  </div>
                </div>

                {/* Avatar Redesign */}
                <div className="mt-8">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/70">Avatar</label>
                  <p className="text-[11px] text-white/45 mb-4">Upload or generate a front-facing photo.</p>
                  
                  {avatar ? (
                    <div className="relative group rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover border border-white/20" />
                        <div>
                          <div className="text-xs font-bold text-white/90 uppercase tracking-wider">Photo Ready</div>
                          <div className="text-[10px] text-white/40 mt-0.5">High-res uploaded</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={triggerFileUpload} className="text-[10px] uppercase font-bold text-[#C6FF00] hover:text-[#e0ff66] transition cursor-pointer">Replace</button>
                        <button type="button" onClick={handleRemovePhoto} className="text-[10px] uppercase font-bold text-white/40 hover:text-red-400 transition cursor-pointer">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                      <motion.button
                        whileHover={{ scale: 0.98, backgroundColor: "rgba(198,255,0,0.05)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={triggerFileUpload}
                        className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-white/70 transition hover:border-[#C6FF00]/50 hover:text-white cursor-pointer"
                        type="button"
                      >
                        <ImageUp size={24} className="text-[#C6FF00]" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Upload Photo</span>
                        <span className="text-[9px] text-white/30 uppercase">Max 5MB • PNG JPG</span>
                      </motion.button>
                      
                      <span className="text-center text-[10px] font-bold text-white/30">OR</span>
                      
                      <motion.button
                        whileHover={{ scale: 0.98, backgroundColor: "rgba(255,255,255,0.06)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGeneratePhoto}
                        disabled={isGenerating}
                        className="relative overflow-hidden flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white/70 transition hover:border-white/20 hover:text-white cursor-pointer disabled:opacity-70"
                        type="button"
                      >
                        {isGenerating ? (
                          <Loader2 size={24} className="text-[#C6FF00] animate-spin" />
                        ) : (
                          <>
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                              <Sparkles size={8} /> AI
                            </div>
                            <Camera size={24} className="text-[#C6FF00]" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-center">Generate Avatar</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-6">
                  {/* Floating Label Inputs */}
                  <div className="relative group">
                    <input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                      className="block w-full h-14 px-4 pt-4 pb-1 text-sm text-white bg-white/[0.03] border border-white/10 rounded-2xl appearance-none focus:outline-none focus:ring-0 focus:border-[#C6FF00]/50 focus:shadow-[0_0_15px_rgba(198,255,0,0.1)] transition-all duration-200 peer"
                      placeholder=" "
                    />
                    <label htmlFor="fullName" className="absolute text-[11px] font-bold uppercase tracking-wider text-white/40 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#C6FF00]/70">
                      Full Name
                    </label>
                    <UserRound size={16} className="absolute right-4 top-4 text-white/20" />
                  </div>

                  <div className="relative group">
                    <input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 20))}
                      className="block w-full h-14 px-4 pt-4 pb-1 text-sm text-white bg-white/[0.03] border border-white/10 rounded-2xl appearance-none focus:outline-none focus:ring-0 focus:border-[#C6FF00]/50 focus:shadow-[0_0_15px_rgba(198,255,0,0.1)] transition-all duration-200 peer"
                      placeholder=" "
                    />
                    <label htmlFor="username" className="absolute text-[11px] font-bold uppercase tracking-wider text-white/40 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#C6FF00]/70">
                      Username
                    </label>
                    
                    <div className="absolute right-4 top-4 flex items-center">
                      {usernameStatus === "checking" && <Loader2 size={16} className="text-white/40 animate-spin" />}
                      {usernameStatus === "available" && <Check size={16} className="text-[#C6FF00]" />}
                      {usernameStatus === "taken" && <X size={16} className="text-red-500" />}
                      {usernameStatus === "idle" && <AtSign size={16} className="text-white/20" />}
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
                              <button key={sug} type="button" onClick={() => setUsername(sug)} className="px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-[10px] text-white/70 transition cursor-pointer">
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
                className="relative flex justify-center mt-6 md:mt-0 perspective-1000"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* Dynamic Ambient Glow Engine */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[340px] rounded-full blur-[60px] pointer-events-none"
                  animate={{ backgroundColor: "rgba(198,255,0,1)", opacity: glowOpacity, scale: isSuccess ? 1.2 : 1 }}
                  transition={{ duration: 0.8 }}
                />
                
                <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="scale-90 md:scale-100 origin-center z-10">
                  <PlayerCard player={previewPlayer} size="md" onClick={triggerFileUpload} />
                </motion.div>
              </motion.div>
            </div>

            {/* CTA Button 2.0 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.75 }} className="mt-10 relative group">
              <div className="absolute -inset-1 bg-[#C6FF00]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                disabled={isSubmitting || isSuccess || usernameStatus !== "available" || !fullName}
                className="relative w-full h-14 rounded-2xl bg-[#C6FF00] text-black font-display tracking-[0.2em] uppercase font-bold flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600] disabled:opacity-50 overflow-hidden shadow-[0_0_0_0_rgba(198,255,0,0)] hover:shadow-[0_0_30px_-5px_rgba(198,255,0,0.6)]" 
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
                    CONTINUE <ArrowLeft className="rotate-180 size-4" strokeWidth={3} />
                  </>
                )}
              </motion.button>
            </motion.div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
              <ScanFace className="size-3 text-[#C6FF00]" />
              Secure Athlete Setup
            </div>
          </form>
        </div>
      </section>

      {cropSrc && (
        <ImageCropper src={cropSrc} onCropComplete={handleCropComplete} onCancel={handleCropCancel} />
      )}
    </main>
  );
}
