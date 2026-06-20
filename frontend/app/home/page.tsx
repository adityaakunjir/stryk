"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Play, Users, Trophy, MapPin, 
  Loader2, X, Target, Shield, Star,
  ChevronRight, Home, User, Globe, BarChart3, UserPlus
} from "lucide-react";
import { usePlayer } from "@/components/player-context";
import { CardDetail } from "@/components/card-detail";
import { cn } from "@/lib/utils";

export default function HomeLobbyPage() {
  const router = useRouter();
  const { playerData, isLoaded, getStats } = usePlayer();
  
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
  const position = playerData.position || "CAM";
  const playStyle = playerData.playStyle || "PLAYMAKER";
  const rating = playerData.rating || 50;
  const stats = getStats();
  const xpCurrent = 45; // Dummy XP value
  const xpTotal = 100;
  return (
    <main className="relative min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#E5DCC5] flex justify-center custom-scrollbar text-[#1A1A1A]">
      
      {/* Main App Container (Clamps at 448px for tablets/desktop) */}
      <div className="relative min-h-[100dvh] w-full max-w-md bg-transparent shadow-2xl border-x border-[#1A1A1A]/5 flex flex-col">
        
        {/* Background Layer (Constrained to max-w-md) */}
        <div
          className="absolute top-0 left-0 right-0 h-[100dvh] z-0 bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('/home_page_bg.webp')",
            backgroundSize: "100% auto",
            backgroundPosition: "top center",
          }}
        />
        
        {/* Top Header Section (Logo, Profile, Greeting) */}
        <div className="absolute top-0 left-0 right-0 px-6 pt-5 flex flex-col gap-4 shrink-0 z-10">
          
          {/* Top Bar: Logo & Profile */}
          <div className="flex justify-between items-center">
            {/* Left: Logo & Title */}
          <div className="flex items-center gap-2">
            <img src="/logo.webp" alt="STRYK Logo" className="h-10 w-auto" />
          </div>

            {/* Profile & Notifications */}
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/notifications")} className="relative w-10 h-10 rounded-full bg-[#1A1A1A]/5 backdrop-blur-md border border-[#1A1A1A]/10 flex items-center justify-center shadow-sm hover:bg-[#1A1A1A]/10 transition">
                <Bell size={18} className="text-[#1A1A1A]" />
                {incomingRequests.length > 0 && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#C3DF1B] rounded-full border-2 border-white" />
                )}
              </button>
              <button onClick={() => router.push("/settings")} className="flex items-center gap-2 p-1 pr-2 rounded-full bg-[#1A1A1A]/5 backdrop-blur-md border border-[#1A1A1A]/10 shadow-sm hover:bg-[#1A1A1A]/10 transition">
                <img src={playerData.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=aditya"} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                <ChevronRight size={14} className="text-[#1A1A1A]/60 rotate-90" />
              </button>
            </div>
          </div>

        <div className="flex justify-between items-start mt-2">
          <div className="flex flex-col">
            <div className="text-[9px] font-bold tracking-[0.15em] text-[#A37B31] uppercase mb-1">
              READY FOR TODAY&apos;S MATCH?
            </div>
            <div className="font-display text-4xl text-[#1A1A1A] italic leading-[0.9] tracking-tight flex items-center gap-2">
              HEY, {firstName} <span className="text-3xl not-italic ml-1">👋</span>
            </div>
            <div className="text-[10px] text-[#1A1A1A]/70 font-medium mt-1.5">
              Level up, compete, and build your legacy.
            </div>
          </div>

            {/* Streak Badge (Only visible if they've played matches) */}
            {playerData.matchesPlayed && playerData.matchesPlayed > 0 ? (
              <div className="flex flex-col items-center justify-center bg-[#151515] text-[#E8D196] rounded-xl px-4 py-2 shadow-xl border border-[#8E793E]/30 min-w-[70px]">
                <div className="flex items-center gap-1 font-display text-2xl leading-none">
                  <span>🔥</span>
                  <span>1</span>
                </div>
                <div className="text-[7px] font-bold tracking-[0.15em] mt-1 text-[#E8D196]/70 uppercase">DAY STREAK</div>
              </div>
            ) : null}
          </div>
      </div>

      {/* 3D Player Card Section - Mathematically fixed to the Pedestal relative to container width */}
      <div 
        className="absolute left-0 right-0 z-20 flex justify-center items-end pointer-events-none"
        style={{ top: 'calc(1.28 * min(100vw, 448px))' }} /* Tweak this 1.28 number (e.g. to 1.26 or 1.30) to exactly land the card on the podium! */
      >
        <div 
          className="relative w-[61%] pointer-events-auto cursor-pointer hover:scale-[1.025] transition-transform duration-500 -translate-y-full"
          style={{ aspectRatio: '1417/1878' }}
          onClick={() => setShowCardDossier(true)}
        >
          {/* Main Card Container */}
            
            {/* 1. Card Base (Crystal Texture) - Bottom Layer */}
            <img 
              src="/player_card.webp" 
              alt="Card Base" 
              className="absolute inset-0 z-10 h-full w-full object-contain pointer-events-none" 
            />

            {/* PLAYER IMAGE */}
            <div className="absolute inset-0 z-20 flex justify-center overflow-hidden pointer-events-none">
              
              {/* Soft glow behind player */}
              <div className="absolute top-[18%] w-[55%] h-[55%] rounded-full bg-[#E5B95C]/20 blur-3xl z-10" />

              {/* Blurred duplicate for depth */}
              {playerData.avatar && (
                <img
                  src={playerData.avatar}
                  alt=""
                  className="absolute z-10 w-[60%] h-[58%] object-cover object-top top-[17%] blur-2xl opacity-20 scale-125"
                />
              )}

              {/* Main player (Double masked: frame shape + bottom fade) */}
              <div 
                className="absolute inset-0 z-20 flex justify-center pointer-events-none"
                style={{
                  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 66%)",
                  maskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 66%)",
                }}
              >
                <div 
                  className="absolute inset-0 flex justify-center pointer-events-none translate-y-[0.8px]"
                  style={{
                    WebkitMaskImage: "url('/player_card.webp')",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: "url('/player_card.webp')",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                >
                  {playerData.avatar && (
                    <img
                      src={playerData.avatar}
                      alt="Player"
                      className="absolute z-20 w-full h-full object-cover object-top"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 4. Gold Overlay (Optional - Add your own gold_particles.png if needed) */}
            {/* <img src="/gold_overlay.png" className="absolute inset-0 z-[28] h-full w-full object-contain pointer-events-none mix-blend-screen" /> */}

            {/* 5. Frame (Border Shell) */}
            <img 
              src="/player_card_frame.webp" 
              alt="Card Frame" 
              className="absolute inset-0 z-30 h-full w-full object-contain pointer-events-none translate-y-[0.8px] scale-[1.0]"
            />
            
            {/* 6. Text + Stats (Top Layer) */}
            <div className="absolute inset-0 z-[40] pointer-events-none">
              
              {/* ========================================= */}
              {/* LEFT SIDE (Rating, Position, Flag) */}
              {/* ========================================= */}
              <div className="absolute top-[15%] left-[13%] flex flex-col items-center gap-1 z-50">
                <div className="font-display text-[clamp(44px,12vw,60px)] text-[#B08332] leading-[0.82] tracking-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{rating}</div>
                <div className="font-display text-[clamp(20px,5vw,26px)] text-black leading-none font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">{position}</div>
                <img src="https://flagcdn.com/w40/in.png" alt="India" className="mt-2 h-[16px] w-[26px] object-cover shadow-[0_2px_8px_rgba(0,0,0,0.8)] border border-black/10" />
              </div>

              {/* ========================================= */}
              {/* CENTER NAME PLAQUE */}
              {/* ========================================= */}
              <div className="absolute top-[61.4%] bottom-[38%] left-[15%] right-[15%] flex items-center justify-center">
                <div className="font-display text-[clamp(16px,4.5vw,22px)] text-[#2A1B0A] leading-none tracking-widest uppercase font-bold drop-shadow-sm">
                  {(playerData.fullName || "PLAYER").toUpperCase()}
                </div>
              </div>

              {/* ========================================= */}
              {/* PLAYSTYLE TAG */}
              {/* ========================================= */}
              <div className="absolute top-[65.8%] left-0 right-0 flex justify-center">
                <div className="font-display text-[clamp(9px,2vw,12px)] text-[#C89B3C] tracking-[0.2em] uppercase font-bold">
                  {playStyle}
                </div>
              </div>

              {/* ========================================= */}
              {/* STATS GRID */}
              {/* ========================================= */}
              <div className="absolute top-[75%] left-[12%] right-[12%] flex flex-col gap-[clamp(2px,1vw,8px)]">
                {/* Top Row */}
                <div className="flex justify-between px-1">
                  <div className="flex gap-1 items-baseline w-[32%] justify-center">
                    <span className="font-display font-bold text-[clamp(16px,4vw,22px)] text-[#E8D196] leading-none">{stats.find(s => s.label === "PAC")?.value || 50}</span>
                    <span className="font-display text-[clamp(10px,2.5vw,14px)] text-[#E8D196]/80 leading-none">PAC</span>
                  </div>
                  <div className="flex gap-1 items-baseline w-[32%] justify-center">
                    <span className="font-display font-bold text-[clamp(16px,4vw,22px)] text-[#E8D196] leading-none">{stats.find(s => s.label === "SHO")?.value || 50}</span>
                    <span className="font-display text-[clamp(10px,2.5vw,14px)] text-[#E8D196]/80 leading-none">SHO</span>
                  </div>
                  <div className="flex gap-1 items-baseline w-[32%] justify-center">
                    <span className="font-display font-bold text-[clamp(16px,4vw,22px)] text-[#E8D196] leading-none">{stats.find(s => s.label === "PAS")?.value || 50}</span>
                    <span className="font-display text-[clamp(10px,2.5vw,14px)] text-[#E8D196]/80 leading-none">PAS</span>
                  </div>
                </div>
                {/* Bottom Row */}
                <div className="flex justify-between px-1 mt-1">
                  <div className="flex gap-1 items-baseline w-[32%] justify-center">
                    <span className="font-display font-bold text-[clamp(16px,4vw,22px)] text-[#E8D196] leading-none">{stats.find(s => s.label === "DRI")?.value || 50}</span>
                    <span className="font-display text-[clamp(10px,2.5vw,14px)] text-[#E8D196]/80 leading-none">DRI</span>
                  </div>
                  <div className="flex gap-1 items-baseline w-[32%] justify-center">
                    <span className="font-display font-bold text-[clamp(16px,4vw,22px)] text-[#E8D196] leading-none">{stats.find(s => s.label === "DEF")?.value || 50}</span>
                    <span className="font-display text-[clamp(10px,2.5vw,14px)] text-[#E8D196]/80 leading-none">DEF</span>
                  </div>
                  <div className="flex gap-1 items-baseline w-[32%] justify-center">
                    <span className="font-display font-bold text-[clamp(16px,4vw,22px)] text-[#E8D196] leading-none">{stats.find(s => s.label === "PHY")?.value || 50}</span>
                    <span className="font-display text-[clamp(10px,2.5vw,14px)] text-[#E8D196]/80 leading-none">PHY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Spacer to push the drawer strictly below the absolute-positioned card */}
      <div style={{ height: 'calc(1.35 * min(100vw, 448px))' }} className="w-full shrink-0 pointer-events-none" />

      {/* Bottom Sheet Navigation */}
      <div className="relative mt-auto w-full z-30 bg-[#151515] rounded-t-[2rem] px-5 pt-5 pb-[85px] shadow-[0_-20px_50px_rgba(0,0,0,0.6)] border-t border-[#8E793E]/30 text-white">
        <div className="w-full">
            
            {/* Level & XP */}
            <div className="flex justify-between items-end mb-1.5">
              <div className="flex gap-2 items-baseline">
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#C3DF1B] uppercase">LEVEL 1</span>
                <span className="text-[11px] font-bold tracking-[0.1em] text-[#C3DF1B] uppercase">ROOKIE</span>
              </div>
              <span className="text-[10px] font-bold text-white/50 tracking-wider">XP {xpCurrent}/{xpTotal}</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4">
              <motion.div 
                className="h-full bg-[#C3DF1B] rounded-full shadow-[0_0_10px_rgba(195,223,27,0.4)]"
                initial={{ width: 0 }} animate={{ width: `${(xpCurrent/xpTotal)*100}%` }} transition={{ duration: 1.5, delay: 0.5, type: "spring" }}
              />
            </div>

            {/* Next Objective Card */}
            <div className="bg-[#1A1A1A] rounded-[1.5rem] p-4 border border-[#2A2A2A] flex items-center justify-between mb-4 shadow-sm group hover:border-[#A28B52]/50 transition cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-[#C3DF1B] shrink-0 group-hover:bg-[#C3DF1B]/10 group-hover:border-[#C3DF1B]/30 transition">
                  <Target size={16} />
                </div>
                <div>
                  <div className="text-[8px] tracking-[0.2em] uppercase text-[#A28B52] font-bold">NEXT OBJECTIVE</div>
                  <div className="text-[12px] font-bold text-white uppercase mt-0.5 tracking-wider">PLAY YOUR FIRST MATCH</div>
                  <div className="text-[9px] text-white/40 font-medium mt-0.5">Jump into a match and start your journey.</div>
                </div>
              </div>
              <div className="text-[10px] font-bold text-[#C3DF1B] ml-2 drop-shadow-sm">0/1</div>
            </div>

            {/* Action Grid (2 buttons) */}
            <div className="grid grid-cols-2 gap-3">
              <ActionButton icon={<UserPlus size={18} className="text-[#C3DF1B]" />} label="ADD FRIEND" subtext="Find & invite players" onClick={() => router.push("/search")} />
              <ActionButton icon={<BarChart3 size={18} className="text-[#C3DF1B]" />} label="LEADERBOARD" subtext="See top players" onClick={() => router.push("/leaderboards")} />
            </div>

          </div>
        </div>
      {/* Bottom Navigation Tab Bar */}
      <div className="fixed bottom-0 w-full max-w-md h-[70px] bg-[#0A0A0A] border-t border-white/5 z-40 px-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-safe">
        <NavTab icon={<Home size={20} />} label="HOME" active={true} onClick={() => router.push("/home")} />
        <NavTab icon={<Globe size={20} />} label="MATCHES" active={false} onClick={() => router.push("/matches")} />
        


        <NavTab icon={<Users size={20} />} label="SQUAD" active={false} onClick={() => setShowSquadModal(true)} />
        <NavTab icon={<User size={20} />} label="PROFILE" active={false} onClick={() => router.push("/settings")} />
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
              
              {/* Persistent Add Friend Action in Modal */}
              <div className="mt-6 pt-4 border-t border-white/10 w-full shrink-0">
                <button onClick={() => router.push("/search")} className="w-full h-12 rounded-2xl bg-[#C3DF1B]/10 border border-[#C3DF1B]/30 text-[#C3DF1B] text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#C3DF1B]/20 transition flex items-center justify-center gap-2 cursor-pointer">
                  <UserPlus size={16} /> ADD MORE FRIENDS
                </button>
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
      </div>
    </main>
  );
}

// Subcomponents

function ActionButton({ icon, label, subtext, onClick }: { icon: React.ReactNode; label: string; subtext: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-3 rounded-[1.2rem] bg-[#1A1A1A] border border-[#2A2A2A] text-center cursor-pointer transition hover:bg-[#202020] hover:border-[#A28B52]/50 h-full shadow-sm group">
      <div className="text-[#C3DF1B] mb-2 transition-transform group-hover:scale-110 drop-shadow-sm">{icon}</div>
      <div className="text-[9px] font-bold tracking-widest text-[#E8E8E8] uppercase leading-tight mb-1">{label}</div>
      <div className="text-[8px] text-[#808080] tracking-wide leading-tight hidden sm:block">{subtext}</div>
    </button>
  );
}

function NavTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group">
      <div className={cn("transition-colors group-hover:text-white", active ? "text-[#C3DF1B]" : "text-white/40")}>
        {icon}
      </div>
      <span className={cn("text-[9px] font-bold tracking-[0.1em] uppercase transition-colors group-hover:text-white mt-1", active ? "text-[#C3DF1B]" : "text-white/40")}>
        {label}
      </span>
    </button>
  );
}
