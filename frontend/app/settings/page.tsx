"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Bell, ChevronRight, LogOut, User, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { usePlayer } from "@/components/player-context";

export default function SettingsPage() {
  const router = useRouter();
  const { playerData, resetPlayerData } = usePlayer();
  const { signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const rating = playerData.rating || 60;
  const displayName = playerData.fullName || "Player";
  const username = playerData.username || "username";
  const position = playerData.position || "CAM";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      resetPlayerData();
      await signOut({ redirectUrl: "/" });
    } catch {
      toast.error("Failed to sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  const accountItems = [
    {
      icon: User,
      label: "EDIT PROFILE",
      description: "Manage your personal information",
      onClick: () => router.push("/identity"),
    },
    {
      icon: Bell,
      label: "NOTIFICATIONS",
      description: "Manage alerts and updates",
      onClick: () => router.push("/notifications"),
    },
  ];

  return (
    <main className="relative min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#E5DCC5] flex justify-center text-[#1A1A1A]">
      <div className="relative min-h-[100dvh] w-full max-w-md flex flex-col shadow-2xl border-x border-[#1A1A1A]/5">
        
        <div
          className="absolute top-0 left-0 right-0 h-[100dvh] z-0 bg-cover bg-top bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/home_page_bg.webp')" }}
        />

        <div className="relative z-10 mx-auto flex h-full w-full flex-col px-6 pt-8 pb-8">
          <header className="flex shrink-0 items-center justify-between mb-8">
            <button
              onClick={() => router.push("/home")}
              className="grid size-[46px] cursor-pointer place-items-center rounded-full border border-[#1A1A1A]/5 bg-[#1A1A1A]/[0.03] text-[#1A1A1A] transition hover:bg-[#1A1A1A]/10 active:scale-95 shadow-sm backdrop-blur-md"
              aria-label="Back to home"
              type="button"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <img src="/logo.webp" alt="STRYK" className="h-[14px] w-auto object-contain opacity-70 mix-blend-multiply grayscale ml-1" />
            <div className="size-[46px]" />
          </header>

          <div className="flex flex-col items-center mb-10 mt-2">
            <h1 className="font-display text-[40px] font-black uppercase leading-none tracking-tight text-[#1A1A1A] scale-y-[1.15] scale-x-[0.95]">
              SETTINGS
            </h1>
            <div className="mt-5 h-[2px] w-10 bg-[#A28B52]" />
          </div>

          <div data-scroll-panel className="min-h-0 flex-1 overflow-y-auto pb-6">
            
            {/* User Card */}
            <section className="mb-10 overflow-hidden rounded-[2.2rem] bg-[#111111] p-4 text-white shadow-[0_24px_40px_rgba(0,0,0,0.3)] shrink-0 flex items-center gap-4 border border-[#A28B52]/10">
              <div className="relative size-[72px] shrink-0 ml-1">
                <div className="grid h-full w-full place-items-center overflow-hidden rounded-full border border-[#A28B52] bg-[#1A1A1A]">
                  {playerData.avatar ? (
                    <img
                      src={playerData.avatar}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-[#A28B52]/70" />
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-2 grid size-[28px] place-items-center bg-gradient-to-br from-[#F4E3B5] via-[#C89B3C] to-[#826021] font-display text-[12px] font-extrabold text-[#1A1A1A] shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  {rating}
                </div>
              </div>

              <div className="min-w-0 flex-1 text-left ml-2">
                <div className="truncate font-display text-[22px] font-bold uppercase leading-none tracking-widest text-white">
                  {displayName}
                </div>
                <div className="mt-[6px] truncate text-[12px] font-bold tracking-[0.1em] text-[#C3DF1B]">
                  @{username}
                </div>
                <div className="mt-[6px] text-[11px] font-medium uppercase tracking-[0.15em] text-white/50 flex items-center gap-2">
                  {position} <span className="text-white/30 text-[10px] leading-none">•</span> {rating} OVR
                </div>
              </div>
            </section>

            <section className="mb-8">
              <div className="mb-5 flex items-center gap-4 px-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#1A1A1A]/50">
                  A C C O U N T
                </span>
                <div className="h-[1px] flex-1 bg-[#1A1A1A]/10" />
              </div>

              <div className="overflow-hidden rounded-[2rem] bg-[#111111] shadow-[0_20px_40px_rgba(0,0,0,0.25)] border border-[#A28B52]/10 divide-y divide-white/5">
                {accountItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="group flex w-full cursor-pointer items-center gap-4 p-5 text-left transition hover:bg-white/[0.02]"
                    type="button"
                  >
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#1A1A1A] border border-white/5">
                      <item.icon size={18} strokeWidth={1.5} className="text-[#C3DF1B]" />
                    </div>
                    <div className="min-w-0 flex-1 py-1 ml-1">
                      <div className="truncate font-display text-[15px] font-bold uppercase tracking-widest text-white">
                        {item.label}
                      </div>
                      <div className="mt-1.5 truncate text-[11px] text-white/40 font-normal tracking-wide">
                        {item.description}
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      strokeWidth={1.5}
                      className="shrink-0 text-white/20 transition group-hover:text-white/40"
                    />
                  </button>
                ))}
              </div>
            </section>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[#0A0A0A] shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition hover:bg-[#111111] disabled:cursor-not-allowed disabled:opacity-50 mt-10"
              type="button"
            >
              {isSigningOut ? (
                <Loader2 size={18} className="animate-spin text-[#C3DF1B]" />
              ) : (
                <LogOut size={18} strokeWidth={1.5} className="text-[#C89B3C]" />
              )}
              <span className="font-display text-[14px] font-bold uppercase tracking-[0.15em] text-[#C3DF1B] pt-0.5">
                SIGN OUT
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
