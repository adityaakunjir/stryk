"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, User, LogOut, ChevronRight, Bell, Loader2 } from "lucide-react";
import { usePlayer } from "@/components/player-context";
import { useAuth } from "@clerk/clerk-react";
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
          onClick: () => router.push("/identity")},
        {
          icon: Bell,
          label: "Notifications",
          meta: "Manage alerts",
          onClick: () => router.push("/notifications")},
      ]},
  ];

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,255,0,0.06),transparent_50%)]" />

      <div data-scroll-panel className="relative h-full flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/home")}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition"
            aria-label="Back to home"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#C6FF00] font-bold">Settings</div>
          <div className="w-9 h-9" />
        </header>

        {/* User Card */}
        <div className="rounded-2xl p-4 border border-white/8 bg-white/[0.02] flex items-center gap-4 mb-8">
          <div className="size-14 rounded-full overflow-hidden border border-[#C6FF00]/30 bg-[#0B1020] flex items-center justify-center shrink-0">
            {playerData.avatar ? (
              <img src={playerData.avatar} alt={playerData.fullName} className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-[#C6FF00]/50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{playerData.fullName || "Player"}</div>
            <div className="text-[11px] text-[#C6FF00] font-medium tracking-wide truncate">
              @{playerData.username || "username"}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
              {playerData.position} • {playerData.rating} OVR
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6 flex-1">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-bold mb-3 pl-1">
                {section.title}
              </h2>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    disabled={!item.onClick}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left"
                    type="button"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                      <item.icon size={16} className="text-white/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{item.meta}</div>
                    </div>
                    <ChevronRight size={14} className="text-white/20 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sign Out */}
        <div className="mt-8 pt-6 border-t border-white/5">

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full h-12 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 font-display tracking-[0.15em] text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-red-500/10 transition disabled:opacity-50"
            type="button"
          >
            {isSigningOut ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogOut size={14} />
            )}
            SIGN OUT
          </button>
          <div className="text-center text-[10px] text-white/20 mt-4 tracking-wider">
            STRYK v1.0.0
          </div>
        </div>
      </div>
    </main>
  );
}
