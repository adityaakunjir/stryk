"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Settings, Play, Users, Trophy, MapPin, 
  Loader2, X, Target, Zap, Shield, Sparkles, Gauge,
  ChevronRight, Activity
} from "lucide-react";
import { usePlayer } from "@/components/player-context";
import { PlayerCard } from "@/components/player-card";
import { CardDetail } from "@/components/card-detail";
import { cn } from "@/lib/utils";

// Helper to get color from style
const getStyleColor = (styleName: string) => {
  const s = styleName?.toLowerCase() || "";
  if (s.includes("speed")) return "#00E5FF";
  if (s.includes("playmaker")) return "#C6FF00";
  if (s.includes("poach") || s.includes("finish")) return "#A78BFA";
  if (s.includes("box")) return "#FCD34D";
  return "#3B82F6";
};

// Dummy recommendations
const DUMMY_RECS = [
  { name: "Alex R.", pos: "ST", ovr: 64, style: "Poacher", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AR&backgroundColor=000000" },
  { name: "Marcus T.", pos: "CB", ovr: 61, style: "Defender", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=MT&backgroundColor=000000" },
  { name: "Sam J.", pos: "LW", ovr: 66, style: "Speedster", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SJ&backgroundColor=000000" }
];

export default function HomeLobbyPage() {
  const router = useRouter();
  const { playerData, isLoaded } = usePlayer();
  
  const [showCardDossier, setShowCardDossier] = useState(false);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showOvrModal, setShowOvrModal] = useState(false);

  const [friends, setFriends] = useState<any[]>([]);
  const [friendsError, setFriendsError] = useState(false);

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
        }
      } catch {
        setFriendsError(true);
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
  const themeColor = getStyleColor(playerData.playStyle);
  
  // Dynamic Greeting
  const hour = new Date().getHours();
  let greetingSubtext = "Ready to play?";
  if (hour < 12) greetingSubtext = "Ready for today's match?";
  else if (hour < 18) greetingSubtext = "Afternoon grind.";
  else greetingSubtext = "Who's winning tonight?";

  const matches = playerData.matchesPlayed ?? 0;
  const xpCurrent = 45; // Dummy XP value
  const xpTotal = 100;

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] overflow-hidden">
      {/* Dynamic Ambient Background */}
      <motion.div
        className="fixed inset-0 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(70% 50% at 50% 10%, ${themeColor}15 0%, transparent 60%), radial-gradient(80% 60% at 50% 100%, ${themeColor}0A 0%, transparent 60%), #05070B`
        }}
      />
      {/* 3D Floor Grid */}
      <div
        className="fixed inset-x-0 bottom-0 h-56 opacity-20 pointer-events-none"
        style={{
          background: `linear-gradient(transparent, ${themeColor}80), repeating-linear-gradient(90deg, transparent 0 32px, rgba(255,255,255,0.4) 32px 33px)`,
          transform: "perspective(400px) rotateX(75deg)",
          transformOrigin: "bottom"
        }}
      />

      <div data-scroll-panel className="relative h-full flex flex-col px-5 pt-6 pb-28 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg text-black flex items-center justify-center font-display text-lg" style={{ backgroundColor: themeColor, boxShadow: `0 0 15px ${themeColor}60` }}>
              S
            </div>
            <div className="font-display tracking-[0.25em] text-base">STRYK</div>
          </div>
          <div className="flex items-center gap-1.5">
            <IconBtn onClick={() => router.push("/notifications")}><Bell size={14} /></IconBtn>
            <IconBtn onClick={() => router.push("/settings")}><Settings size={14} /></IconBtn>
          </div>
        </header>

        {/* Dynamic Greeting */}
        <div className="mb-6">
          <div className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-bold mb-0.5">{greetingSubtext}</div>
          <div className="font-display tracking-wide text-3xl">HEY, {firstName}</div>
        </div>

        {/* Hero Card & XP */}
        <div className="relative flex flex-col items-center">
          <div className="absolute -bottom-4 w-64 h-8 rounded-[50%] blur-3xl pointer-events-none" style={{ background: `${themeColor}60` }} />
          <div className="scale-[0.88] sm:scale-95 origin-top relative z-10">
            <PlayerCard player={playerData} size="md" onClick={() => setShowCardDossier(true)} />
          </div>
          
          {/* XP Progress Engine */}
          <div className="w-[88%] sm:w-[95%] -mt-6 sm:-mt-2 relative z-20 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-3 shadow-xl">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase">Level 1 Rookie</span>
              <span className="text-[9px] font-bold text-white/40 tracking-wider">XP {xpCurrent}/{xpTotal}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full rounded-full" style={{ backgroundColor: themeColor }}
                initial={{ width: 0 }} animate={{ width: `${(xpCurrent/xpTotal)*100}%` }} transition={{ duration: 1.5, delay: 0.5, type: "spring" }}
              />
            </div>
          </div>
        </div>

        {/* Next Objective (Hero Goal) */}
        <div className="mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-[#C6FF00]">
                <Target size={16} />
              </div>
              <div>
                <div className="text-[9px] tracking-[0.2em] uppercase text-[#C6FF00] font-bold">Next Objective</div>
                <div className="font-display tracking-wider text-base mt-0.5">PLAY FIRST MATCH</div>
                <div className="text-[11px] text-white/50 font-medium mt-0.5">+50 XP Reward</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-bold text-white/40">{matches}/1</span>
              <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#C6FF00] rounded-full" style={{ width: `${matches > 0 ? 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stat Pills (Anti-Empty States) */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <Pill 
            label="Matches" 
            value={matches.toString()} 
            subtext={matches === 0 ? "Play first game" : "View history"} 
          />
          <button onClick={() => setShowOvrModal(true)} className="text-left">
            <Pill 
              label="OVR" 
              value={playerData.rating.toString()} 
              subtext="How it works" 
              accent 
            />
          </button>
          <Pill 
            label="Rep" 
            value={matches < 3 ? "--" : "C"} 
            subtext={matches < 3 ? "Play to earn" : "Good standing"} 
          />
        </div>

        {/* Squad Online */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/45 font-bold">Squad Online</div>
            <button onClick={() => setShowSquadModal(true)} className="text-[10px] tracking-[0.2em] uppercase text-[#C6FF00] font-bold cursor-pointer hover:underline">
              {friends.filter(f => f.online).length} LIVE
            </button>
          </div>
          
          {friends.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.01] p-4 flex items-center justify-between cursor-pointer hover:border-white/30 transition" onClick={() => setShowSquadModal(true)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-dashed border-white/30 flex items-center justify-center text-white/40">
                  <Users size={16} />
                </div>
                <div>
                  <div className="font-display tracking-wider text-sm">Create Your Squad</div>
                  <div className="text-[10px] tracking-wide text-white/50 uppercase mt-0.5">Invite Teammates</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/30" />
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
              <button onClick={() => setShowSquadModal(true)} className="shrink-0 w-12 h-12 rounded-full border border-dashed border-[#C6FF00]/40 flex items-center justify-center text-[#C6FF00] cursor-pointer bg-[#C6FF00]/5 hover:bg-[#C6FF00]/10 transition">
                +
              </button>
              {friends.slice(0, 4).map((f) => (
                <div key={f.name} className="relative shrink-0 cursor-pointer" onClick={() => setShowSquadModal(true)}>
                  <img src={f.avatar} alt={f.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                  {f.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#C6FF00] border-2 border-[#05070B]" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Grid Hierarchy */}
        <div className="mt-6 flex flex-col gap-2.5">
          {/* Tier 1 (Large) */}
          <div className="grid grid-cols-2 gap-2.5">
            <Tier1Tile icon={<MapPin size={18} />} label="Matches" meta="Find games" onClick={() => router.push("/matches")} />
            <Tier1Tile icon={<Users size={18} />} label="Friends" meta={`${friends.length} players`} onClick={() => setShowSquadModal(true)} />
          </div>
          {/* Tier 2 (Small) */}
          <div className="grid grid-cols-2 gap-2.5">
            <Tier2Tile icon={<Trophy size={14} />} label="Leaderboards" onClick={() => router.push("/leaderboards")} />
            <Tier2Tile icon={<Activity size={14} />} label="History" onClick={() => router.push("/submit")} />
          </div>
        </div>

        {/* Daily Return Hook */}
        <div className="mt-8 mb-4 border-t border-white/10 pt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Zap size={12} className="text-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Day 1 Streak</span>
          </div>
        </div>

      </div>

      {/* Floating Dominant CTA */}
      <div className="fixed bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-8 sm:pb-10 z-30 pointer-events-none flex justify-center">
        <div className="w-full max-w-md relative pointer-events-auto group">
          <div className="absolute -inset-1 bg-[#C6FF00]/20 blur-2xl opacity-0 group-hover:opacity-100 transition duration-500 rounded-full" />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push("/matches")}
            className="relative w-full h-14 rounded-[20px] bg-[#C6FF00] text-black font-display tracking-[0.2em] font-bold flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(198,255,0,0.6)] cursor-pointer overflow-hidden"
          >
            <motion.div 
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
              animate={{ translateX: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
            />
            <Play size={16} fill="currentColor" /> FIND MATCH
          </motion.button>
        </div>
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
                    
                    <div className="w-full">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Suggested Players</h3>
                      <div className="space-y-2">
                        {DUMMY_RECS.map((rec, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                              <img src={rec.avatar} alt={rec.name} className="w-10 h-10 rounded-full border border-white/10" />
                              <div>
                                <div className="text-sm font-bold">{rec.name}</div>
                                <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">{rec.pos} • {rec.style}</div>
                              </div>
                            </div>
                            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
                              <Users size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
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

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-8 h-8 rounded-xl border border-white/10 bg-white/[0.04] text-white/80 flex items-center justify-center cursor-pointer transition hover:bg-white/10 hover:text-white">
      {children}
    </button>
  );
}

function Pill({ label, value, subtext, accent }: { label: string; value: string; subtext: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-3 border transition-colors", accent ? "bg-[#C6FF00]/10 border-[#C6FF00]/30" : "bg-white/[0.03] border-white/10")}>
      <div className={cn("text-[9px] tracking-[0.2em] uppercase font-bold", accent ? "text-[#C6FF00]" : "text-white/40")}>{label}</div>
      <div className={cn("font-display text-2xl mt-0.5 leading-none", accent ? "text-[#C6FF00]" : "text-white")}>{value}</div>
      <div className={cn("text-[8px] font-medium mt-1 uppercase tracking-wider truncate", accent ? "text-[#C6FF00]/60" : "text-white/30")}>{subtext}</div>
    </div>
  );
}

function Tier1Tile({ icon, label, meta, onClick }: { icon: React.ReactNode; label: string; meta: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl p-4 border border-white/10 bg-[#0B1020]/60 text-left cursor-pointer transition hover:bg-white/5 hover:border-white/20 shadow-lg relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition" />
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white mb-3 shadow-inner border border-white/5">{icon}</div>
      <div className="font-display tracking-wider text-base text-white">{label}</div>
      <div className="text-[9px] tracking-[0.18em] uppercase text-white/40 font-bold mt-0.5">{meta}</div>
    </button>
  );
}

function Tier2Tile({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl px-4 py-3 border border-white/5 bg-white/[0.02] text-left cursor-pointer transition hover:bg-white/5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-white/60">{icon}</div>
      <div className="font-display tracking-wider text-sm text-white/80">{label}</div>
    </button>
  );
}
