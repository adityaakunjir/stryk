"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, User, LogOut, ChevronRight, Bell, Loader2 } from "lucide-react";
import { usePlayer } from "@/components/player-context";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { playerData, resetPlayerData } = usePlayer();
  const { signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const sections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Edit Profile",
          meta: playerData.fullName || "Set up your profile",
          onClick: () => router.push("/identity")
        },
        {
          icon: Bell,
          label: "Notifications",
          meta: "Manage alerts",
          onClick: () => router.push("/notifications")
        },
      ]
    },
  ];

  return (
    <main className="stryk-mobile-shell bg-[#151515] text-white min-h-screen relative overflow-hidden">
      {/* Full Screen Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        
      />

      <div className="relative h-full flex flex-col px-6 pt-8 pb-5 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between mb-3 shrink-0">
          <button
            onClick={() => router.push("/home")}
            className="w-10 h-10 rounded-full bg-[#151515]/5 border border-[#151515]/10 text-white flex items-center justify-center cursor-pointer hover:bg-[#151515]/10 transition backdrop-blur-md shadow-sm relative z-10"
            aria-label="Back to home"
            type="button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        </header>

        {/* Title */}
        <div className="text-center mt-4 mb-5 shrink-0">
          <h1 className="font-display text-[2.5rem] font-black italic uppercase tracking-tight text-white drop-shadow-sm leading-none">
            SETTINGS
          </h1>
          <div className="w-8 h-[2px] bg-[#A28B52] mx-auto mt-3" />
        </div>

        {/* User Card */}
        <div className="w-full bg-gradient-to-br from-[#151515] to-[#151515] rounded-[1.8rem] p-4 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_20px_40px_rgba(0,0,0,0.6)] flex items-center gap-3.5 mb-5 relative overflow-hidden text-white shrink-0">
          {/* Avatar Container with rating badge */}
          <div className="relative size-12 shrink-0 z-10 ml-1">
            <div className="w-full h-full rounded-full border border-[#A28B52] overflow-hidden bg-[#151515] flex items-center justify-center shadow-inner">
              {playerData.avatar ? (
                <img src={playerData.avatar} alt={playerData.fullName} className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-[#A28B52]/70" />
              )}
            </div>
            {/* Hexagon Rating Badge */}
            <div 
              className="absolute -bottom-1 -right-1 bg-gradient-to-br from-[#F4E3B5] via-[#C89B3C] to-[#826021] text-white font-display font-extrabold text-[10px] w-[22px] h-[22px] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.8)] z-20"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
              }}
            >
              {playerData.rating || 60}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 z-10 text-left ml-1.5">
            <div className="font-display text-[17px] uppercase font-bold text-white leading-none tracking-widest truncate">
              {playerData.fullName || "Player"}
            </div>
            <div className="text-[10px] font-semibold text-[#C3DF1B] tracking-wider mt-1.5 truncate">
              @{playerData.username || "username"}
            </div>
            <div className="text-[9px] uppercase tracking-[0.15em] font-medium text-white/50 mt-1 flex items-center gap-1.5">
              {playerData.position || "CAM"} <span className="text-white/30 text-[12px] leading-none">•</span> {playerData.rating || 60} OVR
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-4 mt-1 mb-4 px-1 text-[10px] font-bold tracking-[0.2em] uppercase text-[#A28B52] shrink-0">
          <span>ACCOUNT</span>
          <div className="flex-1 h-[1px] bg-[#A28B52]/40" />
        </div>

        {/* Settings List Box */}
        <div className="w-full bg-gradient-to-b from-[#141414] to-[#151515] rounded-[1.6rem] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden divide-y divide-white/[0.03] shrink-0">
          {sections[0].items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              disabled={!item.onClick}
              className="w-full flex items-center gap-3.5 p-3.5 hover:bg-white/[0.03] active:bg-white/[0.05] transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left group"
              type="button"
            >
              {/* Icon Wrapper */}
              <div className="w-10 h-10 rounded-[0.8rem] bg-[#151515] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center shrink-0 group-hover:border-white/10 transition-colors">
                <item.icon size={16} strokeWidth={1.5} className="text-[#C3DF1B]" />
              </div>
              
              {/* Text Meta */}
              <div className="flex-1 min-w-0 py-0.5">
                <div className="font-display text-[13px] font-bold text-white tracking-widest uppercase">
                  {item.label}
                </div>
                <div className="text-[10px] text-white/40 mt-1 font-normal tracking-wide">
                  {item.label === "Edit Profile" ? "Manage your personal information" : "Manage alerts and updates"}
                </div>
              </div>
              
              {/* Chevron Right */}
              <ChevronRight size={16} strokeWidth={1.5} className="text-[#A28B52]/60 shrink-0 group-hover:text-[#A28B52] transition-colors" />
            </button>
          ))}
        </div>

        {/* LOG OUT CTA */}
        <div className="mt-8 shrink-0">
          <button 
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full h-[54px] rounded-full bg-[#D4F829] hover:bg-[#cbf026] text-white text-[13px] uppercase font-black tracking-[0.15em] flex items-center justify-center gap-2 transition duration-300 shadow-[0_8px_20px_rgba(212,248,41,0.25)] disabled:opacity-50"
            type="button"
          >
            {isSigningOut ? (
              <Loader2 className="animate-spin text-white" size={18} />
            ) : (
              <LogOut size={18} className="text-white" />
            )}
            SIGN OUT
          </button>
        </div>

      </div>
    </main>
  );
}
