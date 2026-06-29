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
          meta: "Manage your personal information",
          iconColor: "text-[#D4F829]",
          onClick: () => router.push("/identity")
        },
        {
          icon: Bell,
          label: "Notifications",
          meta: "Manage alerts and updates",
          iconColor: "text-white",
          onClick: () => router.push("/notifications")
        },
      ]
    },
  ];

  return (
    <main className="stryk-mobile-shell bg-[#151515] text-white min-h-screen relative overflow-hidden">
      {/* Background grain/texture if needed, kept dark to match design */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40"
        style={{ backgroundImage: "url('/noise.png')" }}
      />

      <div className="relative h-full flex flex-col px-6 pt-8 pb-5 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between mb-2 shrink-0">
          <button
            onClick={() => router.push("/home")}
            className="w-10 h-10 rounded-full bg-[#151515] border border-white/5 text-white flex items-center justify-center cursor-pointer hover:bg-[#202020] transition shadow-sm relative z-10"
            aria-label="Back to home"
            type="button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        </header>

        {/* Title */}
        <div className="text-center mt-2 mb-6 shrink-0">
          <h1 className="font-display text-[2.8rem] font-black italic uppercase tracking-tight text-white drop-shadow-sm leading-none">
            SETTINGS
          </h1>
          <div className="w-12 h-[2px] bg-[#A28B52] mx-auto mt-2" />
        </div>

        {/* User Card */}
        <div className="w-full bg-[#151515] rounded-[1.8rem] p-4 flex items-center gap-4 mb-6 relative overflow-hidden text-white shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {/* Avatar Container with rating badge */}
          <div className="relative size-14 shrink-0 z-10">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#202020] flex items-center justify-center shadow-inner">
              {playerData.avatar ? (
                <img src={playerData.avatar} alt={playerData.fullName} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-white/50" />
              )}
            </div>
            {/* Hexagon Rating Badge */}
            <div 
              className="absolute -bottom-1 -right-1 bg-gradient-to-br from-[#F4E3B5] via-[#C89B3C] to-[#826021] text-white font-display font-extrabold text-[10px] w-[22px] h-[22px] flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.8)] z-20"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
              }}
            >
              {playerData.rating || 60}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 z-10 text-left">
            <div className="font-display text-[18px] uppercase font-black text-white leading-none tracking-widest truncate">
              {playerData.fullName || "Player"}
            </div>
            <div className="text-[11px] font-bold text-[#D4F829] tracking-wider mt-1 truncate">
              @{playerData.username || "username"}
            </div>
            <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-white/40 mt-1 flex items-center gap-2">
              {playerData.position || "CAM"} <span className="text-white/20 text-[10px] leading-none">•</span> {playerData.rating || 60} OVR
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-4 mt-2 mb-4 px-1 text-[11px] font-bold tracking-[0.2em] uppercase text-[#A28B52] shrink-0">
          <span>ACCOUNT</span>
          <div className="flex-1 h-[1px] bg-[#A28B52]/30" />
        </div>

        {/* Settings List Box */}
        <div className="w-full bg-[#151515] rounded-[1.6rem] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden divide-y divide-white/[0.04] shrink-0">
          {sections[0].items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              disabled={!item.onClick}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] active:bg-white/[0.04] transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left group"
              type="button"
            >
              {/* Icon */}
              <item.icon size={18} strokeWidth={2} className={`${item.iconColor} shrink-0`} />
              
              {/* Text Meta */}
              <div className="flex-1 min-w-0">
                <div className="font-display text-[14px] font-black text-white tracking-widest uppercase">
                  {item.label}
                </div>
                <div className="text-[11px] text-white/40 mt-0.5 font-medium tracking-wide">
                  {item.meta}
                </div>
              </div>
              
              {/* Chevron Right */}
              <ChevronRight size={16} strokeWidth={1.5} className="text-white/20 shrink-0 group-hover:text-white/40 transition-colors" />
            </button>
          ))}
        </div>

        {/* LOG OUT CTA */}
        <div className="mt-10 shrink-0">
          <button 
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full h-[58px] rounded-full bg-[#D4F829] hover:bg-[#cbf026] text-[#151515] text-[15px] uppercase font-black tracking-[0.15em] flex items-center justify-center gap-2 transition duration-300 shadow-[0_0_40px_rgba(212,248,41,0.15)] disabled:opacity-50"
            type="button"
          >
            {isSigningOut ? (
              <Loader2 className="animate-spin text-[#151515]" size={18} />
            ) : (
              <LogOut size={18} className="text-[#151515]" strokeWidth={2.5} />
            )}
            SIGN OUT
          </button>
        </div>

      </div>
    </main>
  );
}
