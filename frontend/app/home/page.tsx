"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Play, Users, Trophy, MapPin, 
  Loader2, X, Target, Shield, Star,
  ChevronRight, Home, User, Globe
} from "lucide-react";
import { usePlayer } from "@/components/player-context";
import { CardDetail } from "@/components/card-detail";
import { cn } from "@/lib/utils";

export default function HomeLobbyPage() {
  const router = useRouter();
  const { playerData, isLoaded } = usePlayer();
  
  const [showCardDossier, setShowCardDossier] = useState(false);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showOvrModal, setShowOvrModal] = useState(false);

  const [friends, setFriends] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoaded) return;
    async function fetchFriends() {
      try {
        const res = await fetch("/api/friends");
        const data = await res.json();
        if (data.success) {
          setFriends(data.friends.map((f: any) => ({
            name: f.user.fullName || f.user.username,
            handle: f.user.username,
            ovr: f.user.overall || 50,
            pos: f.user.position || "CAM",
            avatar: f.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.user.username)}`,
            online: true
          })));
          setIncomingRequests(data.incomingRequests || []);
        }
      } catch {
        // Friend data is nice-to-have on the home screen.
      }
    }
    fetchFriends();
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#05070B] flex items-center justify-center">
        <Loader2 className="size-10 text-[#C6FF00] animate-spin" />
      </main>
    );
  }

  const firstName = (playerData.fullName || "PLAYER").split(" ")[0].toUpperCase();
  const xpCurrent = 45; // Dummy XP value
  const xpTotal = 100;

  return (
    <main 
      className="relative h-dvh w-dvw overflow-hidden text-[#181818] flex flex-col justify-between bg-black"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/home_page_bg.webp')",
          backgroundPosition: 'center 15%',
        }}
      />

      {/* Main Scrollable Content */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-md mx-auto overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* Top Header Section (Logo, Profile, Greeting) */}
        <div className="px-6 pt-6 flex flex-col gap-6 shrink-0">
          
          {/* Top Bar: Logo & Profile */}
          <div className="flex justify-between items-center">
            {/* Left: Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#D4F829] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(212,248,41,0.3)]">
              <span className="font-display text-2xl text-black leading-none">S</span>
            </div>
            <div className="font-display text-[22px] tracking-[0.05em] text-[#181818] font-bold ml-1 mt-1">STRYK</div>
          </div>

            {/* Profile & Notifications */}
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/notifications")} className="relative w-10 h-10 rounded-full bg-white/40 backdrop-blur-md border border-black/5 flex items-center justify-center shadow-sm hover:bg-white/60 transition">
                <Bell size={18} className="text-black" />
                {incomingRequests.length > 0 && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#D4F829] rounded-full border-2 border-white" />
                )}
              </button>
              <button onClick={() => router.push("/settings")} className="flex items-center gap-2 p-1 pr-2 rounded-full bg-white/40 backdrop-blur-md border border-black/5 shadow-sm hover:bg-white/60 transition">
                <img src={playerData.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=aditya"} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                <ChevronRight size={14} className="text-black/60 rotate-90" />
              </button>
            </div>
          </div>

          {/* Greeting Area */}
          <div className="flex justify-between items-start mt-6">
            <div className="flex flex-col">
              <div className="text-[9px] font-bold tracking-[0.15em] text-[#A37B31] uppercase mb-1 drop-shadow-sm">
                READY FOR TODAY&apos;S MATCH?
              </div>
              <div className="font-display text-5xl text-[#181818] italic leading-[0.9] drop-shadow-sm tracking-tight flex items-center gap-2">
                HEY, {firstName} <span className="text-4xl not-italic ml-1">👋</span>
              </div>
              <div className="text-[11px] text-[#181818]/70 font-medium mt-2">
                Level up, compete, and build your legacy.
              </div>
            </div>

            {/* Streak Badge */}
            <div className="flex flex-col items-center justify-center bg-[#110E0A] text-[#F3D17A] rounded-xl px-4 py-2 shadow-xl border border-[#2A2315] min-w-[70px]">
              <div className="flex items-center gap-1 font-display text-2xl leading-none">
                <span>🔥</span>
                <span>7</span>
              </div>
              <div className="text-[7px] font-bold tracking-[0.15em] mt-1 text-[#F3D17A]/70 uppercase">DAY STREAK</div>
            </div>
          </div>
        </div>

        {/* 3D Player Card Section */}
        <div className="relative flex-1 flex flex-col justify-center items-center min-h-[455px] shrink-0 z-[41] pt-2">
          <div 
            className="relative aspect-[1417/1878] w-[75vw] max-w-[300px] cursor-pointer hover:scale-[1.025] transition-transform duration-500"
            onClick={() => setShowCardDossier(true)}
          >
            {/* The Player Card Image */}
            <img 
              src="/player_card.webp" 
              alt="Player Card" 
              className="absolute inset-0 z-20 h-full w-full object-contain pointer-events-none drop-shadow-[0_24px_38px_rgba(40,18,4,0.42)]" 
            />

            {/* Avatar placed strictly below the crest so hair can overlap, and ending right on the golden plaque. */}
            <div className="absolute left-[3%] right-[3%] top-[10%] bottom-[45%] z-30 flex justify-center items-end overflow-visible pointer-events-none">
              <img 
                src={playerData.avatar || "/placeholder_avatar.png"} 
                alt="Avatar"
                className="w-[90%] max-h-full object-cover object-bottom"
                style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
              />
            </div>
            
            {/* Card Overlays (Stats & Name at z-40) */}
            <div className="absolute inset-0 z-[45] pointer-events-none">
              {/* Left side: Rating, Position, Badges */}
              <div className="absolute top-[28%] left-[12%] flex flex-col items-center gap-1">
                <div className="font-display text-[clamp(44px,12vw,60px)] text-[#B08332] leading-[0.82] tracking-normal drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">55</div>
                <div className="font-display text-[clamp(20px,5vw,26px)] text-black leading-none font-bold drop-shadow-sm">CAM</div>
                <img src="https://flagcdn.com/w40/in.png" alt="India" className="mt-2 h-[16px] w-[26px] object-cover shadow-sm border border-black/10" />
                {/* Authentic Club Badge matching Mockup */}
                <div className="mt-2 relative flex h-[46px] w-[38px] flex-col items-center justify-start rounded-b-[18px] rounded-t-[4px] bg-[#0A0A0A] shadow-[0_2px_4px_rgba(0,0,0,0.5)] border-[1.5px] border-[#C89B3C] overflow-hidden">
                  <div className="flex gap-[2px] mt-1.5">
                    <Star size={6} className="text-[#C89B3C] fill-[#C89B3C]" />
                    <Star size={7} className="text-[#C89B3C] fill-[#C89B3C] -mt-[1px]" />
                    <Star size={6} className="text-[#C89B3C] fill-[#C89B3C]" />
                  </div>
                  <div className="absolute bottom-2 flex items-center justify-center">
                    <div className="w-[22px] h-[22px] rounded-full border-[1.5px] border-[#C89B3C] flex items-center justify-center relative">
                       <div className="w-[12px] h-[12px] bg-[#C89B3C] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Name placed exactly on the golden plaque */}
              <div className="absolute top-[55%] bottom-[38%] left-[15%] right-[15%] flex items-center justify-center">
                <div className="font-display text-[clamp(16px,4.5vw,22px)] text-[#2A1B0A] leading-none tracking-widest uppercase font-bold drop-shadow-sm">
                  {playerData.firstName || "PLAYER"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sheet Navigation */}
        <div className="relative z-30 bg-[#0A0A0A] rounded-t-[32px] w-full px-6 pt-6 pb-24 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] border-t border-[#1F1F1F] -mt-8">
          <div className="p-6">
            
            {/* Level & XP */}
            <div className="flex justify-between items-end mb-2">
              <div className="flex gap-2 items-baseline">
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#D4F829] uppercase">LEVEL 1</span>
                <span className="text-[11px] font-bold tracking-[0.1em] text-[#D4F829] uppercase">ROOKIE</span>
              </div>
              <span className="text-[10px] font-bold text-white/50 tracking-wider">XP {xpCurrent}/{xpTotal}</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
              <motion.div 
                className="h-full bg-[#D4F829] rounded-full"
                initial={{ width: 0 }} animate={{ width: `${(xpCurrent/xpTotal)*100}%` }} transition={{ duration: 1.5, delay: 0.5, type: "spring" }}
              />
            </div>

            {/* Next Objective Card */}
            <div className="bg-[#151515] rounded-2xl p-4 border border-white/5 flex items-center justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-[#D4F829] shrink-0">
                  <Target size={18} />
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[#D4F829] font-bold">NEXT OBJECTIVE</div>
                  <div className="text-[13px] font-bold text-white uppercase mt-0.5 tracking-wider">PLAY YOUR FIRST MATCH</div>
                  <div className="text-[10px] text-white/40 font-medium mt-0.5">Jump into a match and start your journey.</div>
                </div>
              </div>
              <div className="text-[11px] font-bold text-[#A37B31]">0/1</div>
            </div>

            {/* FIND MATCH BIG BUTTON */}
            <button 
              onClick={() => router.push("/matches")}
              className="w-full h-[48px] bg-[#D4F829] text-black rounded-xl font-bold text-[12px] tracking-[0.15em] flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-95 mb-4 shadow-[0_0_20px_rgba(212,248,41,0.2)]"
            >
              <Play size={14} fill="currentColor" /> FIND MATCH
            </button>

            {/* Action Grid (4 buttons) */}
            <div className="grid grid-cols-4 gap-2">
              <ActionButton icon={<MapPin size={16} />} label="FIND MATCH" subtext="Join matches near you" onClick={() => router.push("/matches")} />
              <ActionButton icon={<Users size={16} />} label="MY SQUAD" subtext="Manage your squad" onClick={() => setShowSquadModal(true)} />
              <ActionButton icon={<Trophy size={16} />} label="LEADERBOARD" subtext="See top players" onClick={() => router.push("/leaderboards")} />
              <ActionButton icon={<Shield size={16} />} label="AI COACH" subtext="Improve your game" onClick={() => {}} />
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Navigation Tab Bar */}
      <div className="fixed bottom-0 inset-x-0 h-[65px] bg-[#0A0A0A] border-t border-white/5 z-40 px-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-safe">
        <NavTab icon={<Home size={20} />} label="HOME" active={true} onClick={() => router.push("/home")} />
        <NavTab icon={<Globe size={20} />} label="MATCHES" active={false} onClick={() => router.push("/matches")} />
        
        {/* Floating Center Button */}
        <div className="relative -top-3">
          <button className="w-14 h-14 rounded-full bg-[#D4F829] border-4 border-[#0A0A0A] flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95">
            <span className="text-black text-2xl leading-none font-light">+</span>
          </button>
        </div>

        <NavTab icon={<Users size={20} />} label="SQUAD" active={false} onClick={() => setShowSquadModal(true)} />
        <NavTab icon={<User size={20} />} label="PROFILE" active={false} onClick={() => router.push("/profile/me")} />
      </div>

      {/* Card Detail Modal */}
      <AnimatePresence>
        {showCardDossier && <CardDetail player={playerData} onClose={() => setShowCardDossier(false)} />}
      </AnimatePresence>

      {/* Squad Modal (Empty State Upgraded) */}
      <AnimatePresence>
        {showSquadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-5">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#0B1020] p-6 shadow-2xl flex flex-col max-h-[85vh]">
              <button onClick={() => setShowSquadModal(false)} className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer">
                <X size={14} className="text-white/60" />
              </button>
              
              <Users className="mx-auto size-10 text-[#C6FF00] mb-3" />
              <h2 className="text-xl font-display uppercase tracking-widest text-center text-white italic">Your Squad</h2>
              
              <div className="mt-6 flex-1 overflow-y-auto pr-1 space-y-3">
                {friends.length === 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="text-center py-6 px-4 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl mb-6">
                      <p className="text-xs text-white/50 font-medium mb-3">No active teammates found.</p>
                      <button onClick={() => router.push("/search")} className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition">Invite Friends</button>
                    </div>
                    
                    <div className="w-full text-center">
                      <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest mt-4">Invite players to start a squad</p>
                    </div>
                  </div>
                ) : (
                  friends.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={f.avatar} alt={f.name} className="w-10 h-10 rounded-full border border-white/10" />
                        <div>
                          <div className="text-sm font-bold">{f.name}</div>
                          <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">{f.pos} • OVR {f.ovr}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#C6FF00] bg-[#C6FF00]/10 px-2 py-1 rounded-full">Ready</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVR Transparency Modal */}
      <AnimatePresence>
        {showOvrModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOvrModal(false)} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border-t border-white/10 bg-[#0B1020] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-12 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display text-3xl uppercase italic text-white leading-none">Overall <span className="text-[#C6FF00]">{playerData.rating}</span></h3>
                  <p className="text-xs text-white/50 mt-1 font-medium">How your rating is calculated.</p>
                </div>
                <button onClick={() => setShowOvrModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer">
                  <X size={16} className="text-white/60" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Pace", val: 62, desc: "Sprint speed and acceleration." },
                  { label: "Shooting", val: 50, desc: "Finishing, shot power, positioning." },
                  { label: "Passing", val: 60, desc: "Vision, crossing, short/long pass." },
                  { label: "Dribbling", val: 65, desc: "Agility, balance, ball control." },
                  { label: "Defending", val: 45, desc: "Interceptions, tackling, awareness." },
                  { label: "Physical", val: 50, desc: "Jumping, stamina, strength." }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center font-display text-xl text-white">{stat.val}</div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-white">{stat.label}</div>
                      <div className="text-[10px] text-white/40 font-medium mt-0.5">{stat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-2xl bg-[#C6FF00]/10 border border-[#C6FF00]/20 text-center">
                <Shield size={16} className="text-[#C6FF00] mx-auto mb-2" />
                <p className="text-[10px] font-bold text-[#C6FF00] uppercase tracking-wider">Play matches to improve stats</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

// Subcomponents

function ActionButton({ icon, label, subtext, onClick }: { icon: React.ReactNode; label: string; subtext: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111111] border border-white/5 text-center cursor-pointer transition hover:bg-white/5 hover:border-white/10 h-full">
      <div className="text-[#D4F829] mb-2">{icon}</div>
      <div className="text-[8px] font-bold tracking-wider text-white uppercase leading-tight mb-1">{label}</div>
      <div className="text-[7px] text-white/40 tracking-wide leading-tight">{subtext}</div>
    </button>
  );
}

function NavTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group">
      <div className={cn("transition-colors group-hover:text-white", active ? "text-[#D4F829]" : "text-white/40")}>
        {icon}
      </div>
      <span className={cn("text-[8px] font-bold tracking-[0.1em] uppercase transition-colors group-hover:text-white", active ? "text-[#D4F829]" : "text-white/40")}>
        {label}
      </span>
    </button>
  );
}
