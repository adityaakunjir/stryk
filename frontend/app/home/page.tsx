"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Play, Users, Trophy, MapPin, 
  Loader2, X, Target, Shield, Star,
  ChevronRight, Home, User, Globe, BarChart3, UserPlus, ChevronDown
} from "lucide-react";
import { usePlayer } from "@/components/player-context";
import { useUser } from "@clerk/nextjs";
import { CardDetail } from "@/components/card-detail";
import { cn } from "@/lib/utils";

export default function HomeLobbyPage() {
  const router = useRouter();
  const { user } = useUser();
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

  const rawName = user?.firstName || user?.fullName || playerData.fullName || "PLAYER";
  const firstName = rawName.split(" ")[0].toUpperCase();
  const position = playerData.position || "CAM";
  const playStyle = playerData.playStyle || "PLAYMAKER";
  const rating = playerData.rating || 50;
  const stats = getStats();
  const xpCurrent = 45; // Dummy XP value
  const xpTotal = 100;
  return (
    <main className="relative min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden overscroll-none bg-[#E5DCC5] flex justify-center custom-scrollbar text-[#151515]">
      
      {/* Main App Container (Clamps at 448px for tablets/desktop) */}
      <div className="relative min-h-[100dvh] w-full max-w-md bg-transparent shadow-2xl border-x border-[#151515]/5 flex flex-col">
        
        {/* Background Layer (Constrained to max-w-md) */}
        <div
          className="absolute top-0 left-0 right-0 h-[100dvh] z-0 bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('/home_page_bg.webp')",
            backgroundSize: "109% auto",
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
              <button onClick={() => router.push("/notifications")} className="relative w-10 h-10 rounded-full bg-[#151515]/5 backdrop-blur-md border border-[#151515]/10 flex items-center justify-center shadow-sm hover:bg-[#151515]/10 transition">
                <Bell size={18} className="text-[#151515]" />
                {incomingRequests.length > 0 && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#C3DF1B] rounded-full border-2 border-white" />
                )}
              </button>
              <button onClick={() => router.push("/settings")} className="flex items-center gap-2 p-1 pr-2 rounded-full bg-[#151515]/5 backdrop-blur-md border border-[#151515]/10 shadow-sm hover:bg-[#151515]/10 transition">
                <img src={playerData.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=aditya"} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                <ChevronRight size={14} className="text-[#151515]/60 rotate-90" />
              </button>
            </div>
          </div>

        <div className="flex justify-between items-start mt-2">
          <div className="flex flex-col">
            <div className="font-display text-[2.5rem] font-black italic uppercase tracking-tight text-[#151515] drop-shadow-sm leading-none flex items-center gap-2">
              HEY, {firstName}
            </div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-[#A28B52] uppercase mt-2 mb-0.5">
              READY FOR TODAY&apos;S MATCH?
            </div>
            <div className="text-[10px] text-[#151515]/70 font-medium">
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
        style={{ top: 'calc(1.237 * min(100vw, 448px))' }} /* Tweak this 1.28 number (e.g. to 1.26 or 1.30) to exactly land the card on the podium! */
      >
        <div className="relative w-[61%] -translate-y-full pointer-events-none" style={{ aspectRatio: '1417/1878', perspective: '1000px' }}>
          <motion.div 
            className="absolute inset-0 pointer-events-auto cursor-pointer"
            onClick={() => setShowCardDossier(true)}
            whileHover={{ scale: 1.04, transition: { duration: 0.4, ease: "easeOut" } }}
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
                  className="absolute inset-0 flex justify-center pointer-events-none translate-y-[1px] scale-[0.99]"
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
                      className="absolute z-20 left-0 w-full h-[66%] top-0 object-cover object-top"
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
              className="absolute inset-0 z-30 h-full w-full object-contain pointer-events-none translate-y-[1px] scale-100"
            />

            {/* Shimmer Overlay */}
            <motion.div
              className="absolute inset-0 z-[35] pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 20%, rgba(255, 215, 0, 0.1) 30%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 215, 0, 0.1) 70%, transparent 80%)",
                backgroundSize: "200% 200%",
                backgroundRepeat: "no-repeat",
                WebkitMaskImage: "url('/player_card.webp')",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: "url('/player_card.webp')",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
              animate={{ backgroundPosition: ["200% 0%", "-100% 0%", "-100% 0%"] }}
              transition={{ duration: 10, repeat: Infinity, times: [0, 0.1, 1], ease: ["linear", "linear"] }}
            />
            
            {/* 6. Text + Stats (Top Layer) */}
            <div className="absolute inset-0 z-[40] pointer-events-none">
              
              {/* ========================================= */}
              {/* LEFT SIDE (Rating, Position, Flag) */}
              {/* ========================================= */}
              {/* Protective dark gradient behind the stats to guarantee readability on ANY user image */}
              <div className="absolute top-[10%] left-[5%] w-[30%] h-[35%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_70%)] z-40 pointer-events-none" />

              <div className="absolute top-[15%] left-[13%] flex flex-col items-center gap-1 z-50">
                <div className="font-display text-[clamp(38px,10.5vw,52px)] font-bold text-[#F4E3B5] leading-[0.85] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{rating}</div>
                <div className="font-display text-[clamp(17px,4.2vw,21px)] font-semibold text-[#D8C18E] leading-none tracking-[0.1em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-0.5">{position}</div>
                <img src="https://flagcdn.com/w40/in.png" alt="India" className="mt-2 h-[16px] w-[26px] object-cover shadow-[0_4px_8px_rgba(0,0,0,0.6)] border border-white/20" />
              </div>

              {/* ========================================= */}
              {/* CENTER NAME PLAQUE */}
              {/* ========================================= */}
              <div className="absolute top-[61.4%] bottom-[38%] left-[15%] right-[15%] flex items-center justify-center">
                <div className="font-display text-[clamp(16px,4.5vw,22px)] text-[#2A1B0A] leading-none tracking-widest uppercase font-bold drop-shadow-sm">
                  {rawName.toUpperCase()}
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
          </motion.div>
        </div>
      </div>

      {/* Spacer to push the drawer strictly below the absolute-positioned card */}
      <div style={{ height: 'calc(1.35 * min(100vw, 448px))' }} className="w-full shrink-0 pointer-events-none flex flex-col justify-end items-center pb-6">
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex flex-col items-center opacity-50"
        >
          <div className="text-[8px] tracking-[0.3em] font-black uppercase text-[#A28B52] mb-1">Scroll</div>
          <ChevronDown size={16} className="text-[#A28B52]" strokeWidth={2.5} />
        </motion.div>
      </div>

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
            <div className="bg-[#151515] rounded-[1.5rem] p-4 border border-[#2A2A2A] flex items-center justify-between mb-4 shadow-sm group hover:border-[#A28B52]/50 transition cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-[#C3DF1B] shrink-0 group-hover:bg-[#C3DF1B]/10 group-hover:border-[#C3DF1B]/30 transition">
                  <Target size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#A28B52]">NEXT OBJECTIVE</div>
                  <div className="text-[12px] font-bold text-white uppercase mt-0.5 tracking-wider">PLAY YOUR FIRST MATCH</div>
                  <div className="text-[9px] text-white/40 font-medium mt-0.5">Jump into a match and start your journey.</div>
                </div>
              </div>
              <div className="text-[10px] font-bold text-[#C3DF1B] ml-2 drop-shadow-sm">0/1</div>
            </div>

            {/* Action Grid (2 buttons) */}
            <div className="grid grid-cols-2 gap-3">
              <ActionButton icon={<UserPlus size={18} />} label="ADD FRIEND" subtext="Find & invite players" onClick={() => router.push("/search")} isPrimary={true} />
              <ActionButton icon={<BarChart3 size={18} className="text-[#C3DF1B]" />} label="LEADERBOARD" subtext="See top players" onClick={() => router.push("/leaderboards")} />
            </div>

          </div>
        </div>
      {/* Bottom Navigation Tab Bar */}
      {/* Premium Glassmorphism Bottom Navigation */}
      <div className="fixed bottom-0 w-full max-w-md h-[80px] bg-black/70 backdrop-blur-2xl border-t border-[#C3DF1B]/20 z-40 px-8 flex items-center justify-between shadow-[0_-15px_40px_rgba(0,0,0,0.8)] pb-safe">
        <NavTab icon={<Home size={22} />} label="HOME" active={true} onClick={() => router.push("/home")} />
        <NavTab icon={<Globe size={22} />} label="MATCHES" active={false} onClick={() => router.push("/matches")} />
        <NavTab icon={<Users size={22} />} label="SQUAD" active={false} onClick={() => setShowSquadModal(true)} />
        <NavTab icon={<User size={22} />} label="PROFILE" active={false} onClick={() => router.push("/settings")} />
      </div>

      {/* Card Detail Modal */}
      <AnimatePresence>
        {showCardDossier && <CardDetail player={playerData} onClose={() => setShowCardDossier(false)} />}
      </AnimatePresence>

      {/* Squad Modal (Empty State Upgraded) */}
      <AnimatePresence>
        {showSquadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#151515]/80 backdrop-blur-md px-5">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-sm rounded-[2rem] border border-[#A28B52]/20 bg-[#151515] p-6 shadow-[0_24px_60px_rgba(162,139,82,0.15)] flex flex-col max-h-[85vh]">
              <button onClick={() => setShowSquadModal(false)} className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-[#151515] border border-[#A28B52]/10 text-[#888888] hover:text-[#A28B52] hover:bg-[#2A2824] transition duration-200 cursor-pointer">
                <X size={14} strokeWidth={1.5} />
              </button>
              
              <Users className="mx-auto size-10 text-[#D4F829] drop-shadow-[0_0_8px_rgba(212,248,41,0.5)] mb-3" />
              <h2 className="text-xl font-display uppercase tracking-widest text-center text-[#EFE8D6] drop-shadow-sm italic">Your Squad</h2>
              
              <div className="mt-6 flex-1 overflow-y-auto pr-1 space-y-3">
                {friends.length === 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="text-center py-6 px-4 bg-[#151515] border border-dashed border-[#A28B52]/20 rounded-[1.25rem] shadow-inner w-full flex flex-col items-center justify-center min-h-[140px]">
                      <p className="text-xs text-[#E5DCC5]/70 font-medium">No active teammates found.</p>
                      <p className="text-[10px] uppercase font-bold text-[#A28B52]/60 tracking-widest mt-2">Build your squad to play together</p>
                    </div>
                  </div>
                ) : (
                  friends.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-[1.25rem] bg-[#151515] border border-[#A28B52]/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] hover:border-[#A28B52]/30 transition">
                      <div className="flex items-center gap-3">
                        <img src={f.avatar} alt={f.name} className="w-10 h-10 rounded-full border border-[#A28B52]/20 shadow-sm" />
                        <div>
                          <div className="text-sm font-bold text-[#E5DCC5]">{f.name}</div>
                          <div className="text-[10px] uppercase font-bold text-[#A28B52]/80 tracking-wider mt-0.5">{f.pos} • OVR {f.ovr}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4F829] bg-[#D4F829]/10 border border-[#D4F829]/20 px-2 py-1 rounded-full shadow-[0_0_8px_rgba(212,248,41,0.15)]">Ready</span>
                    </div>
                  ))
                )}
              </div>
              
              {/* Persistent Add Friend Action in Modal */}
              <div className="mt-6 pt-5 border-t border-[#A28B52]/10 w-full shrink-0">
                <button onClick={() => router.push("/search")} className="w-full h-[54px] rounded-full bg-[#D4F829] hover:bg-[#cbf026] text-[#151515] text-[13px] font-black uppercase tracking-[0.15em] transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_20px_rgba(212,248,41,0.25)]">
                  <UserPlus size={18} /> {friends.length === 0 ? "INVITE FRIENDS" : "ADD MORE FRIENDS"}
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
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border-t border-white/10 bg-[#151515] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-12 max-h-[80vh] overflow-y-auto">
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

function ActionButton({ icon, label, subtext, onClick, isPrimary }: { icon: React.ReactNode; label: string; subtext: string; onClick?: () => void; isPrimary?: boolean }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-3 rounded-[1.2rem] text-center cursor-pointer transition h-full shadow-sm group ${isPrimary ? 'bg-[#D4F829] border border-[#D4F829] hover:bg-[#cbf026] shadow-[0_8px_16px_rgba(212,248,41,0.25)]' : 'bg-[#151515] border border-[#2A2A2A] hover:bg-[#202020] hover:border-[#A28B52]/50'}`}>
      <div className={`mb-2 transition-transform group-hover:scale-110 drop-shadow-sm ${isPrimary ? 'text-[#151515]' : 'text-[#C3DF1B]'}`}>{icon}</div>
      <div className={`text-[9px] font-bold tracking-widest uppercase leading-tight mb-1 ${isPrimary ? 'text-[#151515]' : 'text-[#E8E8E8]'}`}>{label}</div>
      <div className={`text-[8px] tracking-wide leading-tight hidden sm:block ${isPrimary ? 'text-[#151515]/70' : 'text-[#808080]'}`}>{subtext}</div>
    </button>
  );
}

function NavTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center justify-center h-full w-[64px] cursor-pointer group pt-1">
      {/* Glowing Active Top Indicator */}
      {active && (
        <div className="absolute top-0 w-8 h-[3px] bg-[#C3DF1B] rounded-b-full shadow-[0_0_12px_rgba(195,223,27,0.9)]" />
      )}
      <div className={cn("transition-all duration-300 group-hover:text-white group-hover:-translate-y-0.5", active ? "text-[#C3DF1B] drop-shadow-[0_0_8px_rgba(195,223,27,0.5)]" : "text-white/40")}>
        {icon}
      </div>
      <span className={cn("text-[9px] font-bold tracking-[0.15em] uppercase transition-colors duration-300 group-hover:text-white mt-1.5", active ? "text-[#C3DF1B]" : "text-white/40")}>
        {label}
      </span>
    </button>
  );
}
