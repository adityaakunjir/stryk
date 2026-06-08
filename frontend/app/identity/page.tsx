"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  BadgeCheck,
  Camera,
  Check,
  ImageUp,
  Loader2,
  ScanFace,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player-context";
import { PlayerCard } from "@/components/player-card";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/image-cropper";
import { toast } from "sonner";

function StepProgress() {
  return (
    <div className="flex items-center gap-2" aria-label="Step 1 of 3">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={cn(
              "grid size-9 place-items-center rounded-full text-sm font-display tracking-wider transition-all",
              step === 1
                ? "bg-[#C6FF00] text-black shadow-[0_0_24px_rgba(198,255,0,0.45)]"
                : "border border-white/12 bg-white/5 text-white/55"
            )}
          >
            {step}
          </div>
          {step < 3 ? <div className="h-px w-10 bg-white/10 sm:w-16" /> : null}
        </div>
      ))}
    </div>
  );
}

export default function IdentityPage() {
  const router = useRouter();
  const { playerData, updatePlayerData } = usePlayer();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with context on load
  useEffect(() => {
    if (playerData) {
      queueMicrotask(() => {
        setFullName(playerData.fullName || "");
        setUsername(playerData.username || "");
        setAvatar(playerData.avatar || "");
        if (playerData.username) {
          setUsernameStatus("available");
        }
      });
    }
  }, [playerData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCropSrc(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBase64: string) => {
    setAvatar(croppedBase64);
    updatePlayerData({ avatar: croppedBase64 });
    setCropSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    const gradients = [
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'><defs><radialGradient id='g' cx='50%' cy='35%' r='65%'><stop offset='0%' stop-color='%23bef518'/><stop offset='45%' stop-color='%2310b981'/><stop offset='100%' stop-color='%23064e3b'/></radialGradient></defs><rect width='100' height='100' fill='url(%23g)'/><circle cx='50' cy='40' r='18' fill='%23ffffff' opacity='0.9'/><path d='M25 80 C 25 60, 75 60, 75 80' fill='%23ffffff' opacity='0.9'/></svg>",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'><defs><radialGradient id='g' cx='50%' cy='35%' r='65%'><stop offset='0%' stop-color='%2367e8f9'/><stop offset='50%' stop-color='%230284c7'/><stop offset='100%' stop-color='%230f172a'/></radialGradient></defs><rect width='100' height='100' fill='url(%23g)'/><circle cx='50' cy='40' r='18' fill='%23ffffff' opacity='0.9'/><path d='M25 80 C 25 60, 75 60, 75 80' fill='%23ffffff' opacity='0.9'/></svg>",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'><defs><radialGradient id='g' cx='50%' cy='35%' r='65%'><stop offset='0%' stop-color='%23f472b6'/><stop offset='50%' stop-color='%23db2777'/><stop offset='100%' stop-color='%234c0519'/></radialGradient></defs><rect width='100' height='100' fill='url(%23g)'/><circle cx='50' cy='40' r='18' fill='%23ffffff' opacity='0.9'/><path d='M25 80 C 25 60, 75 60, 75 80' fill='%23ffffff' opacity='0.9'/></svg>",
    ];
    const selected = gradients[Math.floor(Math.random() * gradients.length)];
    setAvatar(selected);
    updatePlayerData({ avatar: selected });
  };

  const handleCheckUsername = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    setUsernameStatus("checking");

    try {
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(username.trim())}`);
      if (!response.ok) {
        throw new Error("Failed to check username");
      }
      const data = await response.json();
      if (data.available) {
        setUsernameStatus("available");
      } else {
        setUsernameStatus("taken");
      }
    } catch (err) {
      toast.error("Failed to verify username. Please try again.");
      setUsernameStatus("idle");
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }

    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (usernameStatus !== "available") {
      toast.error("Please check and confirm your username availability first.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          avatarUrl: avatar,
        }),
      });

      const data = await response.json();

      // Profile saved successfully
      if (!data.success) {
        toast.error(data.message || "Failed to save profile");
        return;
      }
      
      toast.success("Profile saved successfully!");
    } catch (err) {
      // Ignored: expected to fail on static exports if not fully configured
    } finally {
      setSubmitting(false);
    }

    updatePlayerData({
      fullName: fullName.trim(),
      username: username.trim(),
      avatar: avatar,
    });

    router.push("/position");
  };

  // Mock player structure for the card preview
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
    <main className="stryk-mobile-shell text-white bg-[#05070B]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_16%,rgba(198,255,0,0.12),transparent_25%),radial-gradient(circle_at_22%_52%,rgba(91,140,255,0.06),transparent_28%),linear-gradient(180deg,#05070B_0%,#0B1020_48%,#05070B_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(180deg,transparent,rgba(11,16,32,0.72)),repeating-linear-gradient(96deg,rgba(198,255,0,0.04)_0_1px,transparent_1px_52px)] opacity-75 pointer-events-none" />

      <section data-scroll-panel className="relative mx-auto flex h-full w-full max-w-5xl flex-col px-5 pb-7 pt-6 sm:px-8 lg:px-10 z-10 overflow-y-auto min-h-0">
        <header className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" size="icon" aria-label="Back to home" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
            <Link href="/">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <StepProgress />
          <div className="w-9 h-9" />
        </header>

        <div className="mx-auto mt-7 flex w-full max-w-[54rem] flex-1 flex-col items-center min-h-0">
          <div className="flex items-center gap-2 justify-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#C6FF00] text-black flex items-center justify-center font-display text-base">S</div>
            <div className="font-display tracking-[0.35em] text-base">STRYK</div>
          </div>

          <div className="text-center">
            <h2 className="font-display text-4xl sm:text-6xl uppercase italic leading-none tracking-wide text-white">
              CREATE YOUR<br/>
              <span className="text-[#C6FF00]" style={{ textShadow: "0 0 24px rgba(198,255,0,0.25)" }}>FOOTBALL IDENTITY</span>
            </h2>
            <p className="mt-3 text-sm font-semibold text-white/60">
              Start with the basics for your player card.
            </p>
          </div>

          <form onSubmit={handleNext} className="mt-8 w-full flex-1 rounded-[2rem] border border-white/8 bg-[#0B1020]/50 p-5 shadow-[0_28px_100px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:flex-none sm:p-8">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            <div className="grid gap-7 md:grid-cols-[1fr_17rem] md:items-start">
              <div>
                <div className="flex items-start gap-3">
                  <span className="text-3xl font-display italic text-[#C6FF00]">
                    1.
                  </span>
                  <div>
                    <h1 className="text-xl font-display uppercase tracking-wider">
                      Basic Info
                    </h1>
                    <p className="mt-1 text-xs text-white/50 leading-relaxed">
                      This will be visible on your player card.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                        Avatar
                      </label>
                      <p className="text-[11px] text-white/45">
                        Upload or generate a front-facing photo.
                      </p>
                    </div>
                    {avatar && (
                      <div className="hidden items-center gap-2 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#C6FF00] sm:flex">
                        <ShieldCheck size={12} />
                        Card Ready
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <button
                      onClick={triggerFileUpload}
                      className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-white/70 transition hover:border-[#C6FF00]/50 hover:bg-[#C6FF00]/5 hover:text-white cursor-pointer"
                      type="button"
                    >
                      <ImageUp size={24} className="text-[#C6FF00] transition group-hover:scale-105" />
                      <span className="text-xs font-bold uppercase tracking-wider">Upload Photo</span>
                    </button>
                    <span className="text-center text-[10px] font-bold text-white/30">
                      OR
                    </span>
                    <button
                      onClick={handleTakePhoto}
                      className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-xs font-bold text-white/70 transition hover:border-[#C6FF00]/40 hover:bg-white/5 hover:text-white sm:min-h-24 sm:flex-col cursor-pointer"
                      type="button"
                    >
                      <Camera size={22} className="text-[#C6FF00]" />
                      <span className="uppercase tracking-wider">Generate Photo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* High-Fidelity Figma Player Card Preview */}
              <div className="relative flex justify-center mt-2 md:mt-0">
                <div
                  aria-hidden
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-6 rounded-[50%] blur-xl pointer-events-none"
                  style={{ background: "rgba(198,255,0,0.3)" }}
                />
                <div className="scale-90 md:scale-100 origin-top">
                  <PlayerCard player={previewPlayer} size="sm" onClick={triggerFileUpload} />
                </div>
              </div>
            </div>



            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/60">
                  Full Name
                </span>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] h-12 flex items-center px-4 gap-2.5 focus-within:border-[#C6FF00]/50 transition duration-200">
                  <UserRound size={16} className="text-white/40" />
                  <input
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); }}
                    className="bg-transparent outline-none flex-1 text-sm placeholder:text-white/40 text-white w-full border-0 focus:ring-0 p-0 font-medium"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/60">
                  Username
                </span>
                <div className="grid rounded-2xl border border-white/10 bg-white/[0.04] focus-within:border-[#C6FF00]/50 transition duration-200 sm:grid-cols-[1fr_auto]">
                  <div className="h-12 flex items-center px-4 gap-2.5">
                    <AtSign size={16} className="text-white/40" />
                    <input
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => { 
                        setUsername(e.target.value.toLowerCase().replace(/\s+/g, "")); 
                        setUsernameStatus("idle");
                      }}
                      className="bg-transparent outline-none flex-1 text-sm placeholder:text-white/40 text-white w-full border-0 focus:ring-0 p-0 font-medium"
                    />
                  </div>
                  <button
                    onClick={handleCheckUsername}
                    disabled={usernameStatus === "checking"}
                    className="mx-2 mb-2 h-10 rounded-xl border border-white/10 bg-white/5 px-5 text-[11px] font-display tracking-wider text-[#C6FF00] transition hover:border-[#C6FF00]/45 hover:bg-[#C6FF00]/5 sm:my-1 sm:h-auto cursor-pointer disabled:opacity-50"
                    type="button"
                  >
                    {usernameStatus === "checking" ? (
                      <Loader2 className="size-4 animate-spin mx-auto" />
                    ) : (
                      "CHECK"
                    )}
                  </button>
                </div>
                <span className="mt-1.5 block text-[11px] text-white/45">
                  Usernames must be unique and cannot be changed later.
                </span>
              </label>

              {usernameStatus === "available" && (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#C6FF00]/22 bg-[#C6FF00]/7 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <BadgeCheck className="size-6 text-[#C6FF00]" />
                    <p className="text-xs font-bold text-[#C6FF00] uppercase tracking-wide">
                      Username available!
                    </p>
                  </div>
                  <Check className="size-5 text-[#C6FF00] stroke-[3]" />
                </div>
              )}

              {usernameStatus === "taken" && (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-red-500/22 bg-red-500/7 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <X className="size-6 text-red-500" />
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wide">
                      Username already taken! Try another one.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button 
              disabled={submitting}
              className="mt-6 h-14 w-full rounded-2xl bg-[#C6FF00] text-black font-display tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600] disabled:opacity-50" 
              type="submit"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  SAVING PROFILE...
                </>
              ) : (
                <>
                  CONTINUE <ArrowRight className="ml-auto" strokeWidth={3} size={16} />
                </>
              )}
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              <ScanFace className="size-4 text-[#C6FF00]" />
              Identity setup
            </div>
          </form>
        </div>
      </section>
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </main>
  );
}
