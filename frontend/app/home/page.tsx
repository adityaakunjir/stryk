"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Settings, Play, Users, Trophy, MapPin, Loader2, X, Plus } from "lucide-react";
import { usePlayer } from "@/components/player-context";
import { PlayerCard } from "@/components/player-card";
import { CardDetail } from "@/components/card-detail";
import { AnimatePresence } from "framer-motion";

export default function HomeLobbyPage() {
  const router = useRouter();
  const { playerData, isLoaded } = usePlayer();
  const [showCardDossier, setShowCardDossier] = useState(false);
  const [showSquadModal, setShowSquadModal] = useState(false);

  // Squad / Friends state - empty by default, loaded from localStorage
  const [friends, setFriends] = useState<{ name: string; handle: string; ovr: number; online: boolean; pos: string; avatar: string }[]>([]);
  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendHandle, setNewFriendHandle] = useState("");
  const [newFriendPos, setNewFriendPos] = useState("CM");
  const [newFriendOvr, setNewFriendOvr] = useState(80);

  useEffect(() => {
    // Load friends from localStorage
    const storedFriends = localStorage.getItem("stryk_friends");
    if (storedFriends) {
      try {
        const parsedFriends = JSON.parse(storedFriends);
        queueMicrotask(() => {
          setFriends(parsedFriends);
        });
      } catch (_) {
        queueMicrotask(() => {
          setFriends([]);
        });
      }
    }
  }, []);

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim() || !newFriendHandle.trim()) return;
    const cleanHandle = newFriendHandle.trim().replace("@", "");
    const newFriend = {
      name: newFriendName.trim(),
      handle: cleanHandle,
      ovr: newFriendOvr,
      online: true,
      pos: newFriendPos,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newFriendName.trim())}`
    };
    const updated = [...friends, newFriend];
    setFriends(updated);
    localStorage.setItem("stryk_friends", JSON.stringify(updated));
    setNewFriendName("");
    setNewFriendHandle("");
  };

  // Prevent flashing before context loaded
  if (!isLoaded) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white flex items-center justify-center">
        <Loader2 className="size-10 text-[#C6FF00] animate-spin" />
      </main>
    );
  }

  const firstName = (playerData.fullName || "PLAYER").split(" ")[0].toUpperCase();

  const getReputationValue = () => {
    const matches = playerData.matchesPlayed ?? 0;
    if (matches === 0) return "N/A";
    if (matches < 3) return "C";
    if (matches < 8) return "B";
    if (matches < 15) return "A";
    return "A+";
  };

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B]">
      {/* Ambient bg */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 50% 10%, rgba(198,255,0,0.12) 0%, transparent 60%), radial-gradient(80% 60% at 50% 100%, rgba(91,140,255,0.08) 0%, transparent 60%), #05070B",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 opacity-[0.10] pointer-events-none"
        style={{
          background:
            "linear-gradient(transparent, rgba(198,255,0,0.5)), repeating-linear-gradient(90deg, transparent 0 28px, rgba(255,255,255,0.5) 28px 29px)",
          transform: "perspective(400px) rotateX(70deg)",
          transformOrigin: "bottom",
        }}
      />

      <div data-scroll-panel className="relative h-full flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C6FF00] text-black flex items-center justify-center font-display text-lg">
              S
            </div>
            <div className="font-display tracking-[0.25em] text-base">STRYK</div>
          </div>
          <div className="flex items-center gap-1.5">
            <IconBtn><Bell size={14} /></IconBtn>
            <IconBtn onClick={() => router.push("/")}><Settings size={14} /></IconBtn>
          </div>
        </div>

        {/* Greeting */}
        <div className="mt-4">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-bold">Welcome back</div>
          <div className="font-display tracking-wide mt-1 text-3xl">
            HEY, {firstName}
          </div>
        </div>

        {/* Hero player card display */}
        <div className="mt-4 relative flex justify-center">
          <div
            aria-hidden
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-56 h-8 rounded-[50%] blur-2xl pointer-events-none"
            style={{ background: "rgba(198,255,0,0.35)" }}
          />
          <div className="scale-[0.86] sm:scale-95 origin-top">
            <PlayerCard player={playerData} size="md" onClick={() => router.push("/card")} />
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 px-1 mt-2 sm:mt-4">
          <Pill label="Matches" value={(playerData.matchesPlayed ?? 0).toString()} />
          <Pill label="OVR" value={playerData.rating.toString()} accent />
          <Pill label="Rep" value={getReputationValue()} />
        </div>

        {/* Squad online strip */}
        <div className="mt-6 pt-4 sm:pt-0">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/45 font-bold">Squad online</div>
            <button 
              onClick={() => setShowSquadModal(true)} 
              className="text-[10px] tracking-[0.2em] uppercase text-[#C6FF00] font-bold cursor-pointer hover:underline"
            >
              {friends.filter((f) => f.online).length} LIVE
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
            {friends.slice(0, 5).map((f) => (
              <div key={f.name} className="relative shrink-0 cursor-pointer" onClick={() => setShowSquadModal(true)}>
                <img src={f.avatar} alt={f.name} className="w-11 h-11 rounded-full object-cover border border-white/10" />
                {f.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#C6FF00] border-2 border-[#05070B]" />
                )}
              </div>
            ))}
            <button 
              onClick={() => setShowSquadModal(true)}
              className="w-11 h-11 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/50 text-xs cursor-pointer hover:border-white/40"
            >
              +
            </button>
          </div>
        </div>

        {/* Action panels grid - always visible */}
        <div className="grid mt-6 grid-cols-2 gap-2.5">
          <ActionTile 
            icon={<MapPin size={16} />} 
            label="Matches" 
            meta="Find games" 
            onClick={() => router.push("/matches")} 
          />
          <ActionTile 
            icon={<Users size={16} />} 
            label="Friends" 
            meta={`${friends.length} players`} 
            onClick={() => setShowSquadModal(true)} 
          />
          <ActionTile 
            icon={<Trophy size={16} />} 
            label="Leaderboards" 
            meta="Top Ranks" 
            onClick={() => router.push("/leaderboards")} 
          />
          <ActionTile 
            icon={<Play size={16} />} 
            label="History" 
            meta="submit stats" 
            onClick={() => router.push("/submit")} 
          />
        </div>

        {/* Primary CTA - always visible */}
        <div className="block mt-6 pt-2">
          <button
            onClick={() => router.push("/matches")}
            className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 bg-[#C6FF00] text-black font-display tracking-[0.2em] cursor-pointer hover:bg-[#b0e600] transition duration-200"
            style={{
              fontSize: "0.95rem",
              boxShadow: "0 20px 40px -10px rgba(198,255,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            <Play size={16} strokeWidth={3} fill="currentColor" />
            FIND MATCH
          </button>
        </div>
      </div>

      {/* Card detail dossier flip overlay */}
      <AnimatePresence>
        {showCardDossier && (
          <CardDetail player={playerData} onClose={() => setShowCardDossier(false)} />
        )}
      </AnimatePresence>

      {/* Squad/Friends Modal */}
      {showSquadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-5">
          <div className="relative w-full max-w-sm rounded-[2rem] border border-[#C6FF00]/30 bg-[#050a0d] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] overflow-hidden min-h-0">
            <button 
              onClick={() => setShowSquadModal(false)}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <Users className="mx-auto size-12 text-[#C6FF00]" />
            <h2 className="mt-4 text-2xl font-display uppercase tracking-wider text-center text-white italic">Your Squad</h2>
            <p className="mt-1.5 text-xs text-white/50 text-center leading-relaxed">
              Manage your active matchmaking roster.
            </p>
            
            {/* Squad List container - scrollable */}
            <div className="mt-6 space-y-2.5 overflow-y-auto flex-1 pr-0.5">
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full overflow-hidden bg-[#C6FF00]/10 border border-[#C6FF00] grid place-items-center text-[#C6FF00] font-display text-sm uppercase shrink-0">
                    {playerData.avatar ? (
                      <img src={playerData.avatar} className="h-full w-full object-cover" alt="User avatar" />
                    ) : (
                      playerData.fullName[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-white truncate">{playerData.fullName} (You)</span>
                    <span className="block text-[11px] text-[#C6FF00] uppercase font-bold tracking-wider truncate">{playerData.position} • {playerData.playStyle}</span>
                  </div>
                </div>
                <span className="rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/30 px-3 py-0.5 text-[10px] font-bold text-[#C6FF00] uppercase tracking-wider shrink-0">Ready</span>
              </div>
              
              {friends.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/30 font-medium border border-dashed border-white/8 rounded-xl bg-white/[0.01]">
                  No friends in your squad yet.<br/>Add a teammate below to build your roster.
                </div>
              ) : (
                friends.map((f) => (
                  <div key={f.handle} className="flex items-center justify-between rounded-xl bg-white/[0.01] border border-white/5 p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-800">
                        <img src={f.avatar} className="h-full w-full object-cover" alt={f.name} />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold text-white truncate">{f.name}</span>
                        <span className="block text-[11px] text-white/40 uppercase font-bold tracking-wider truncate">{f.pos} • OVR {f.ovr}</span>
                      </div>
                    </div>
                    {f.online ? (
                      <span className="rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/30 px-3 py-0.5 text-[10px] font-bold text-[#C6FF00] uppercase tracking-wider shrink-0">Ready</span>
                    ) : (
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider mr-2 shrink-0">Offline</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Friend Form (always at the bottom of the modal, non-blocking) */}
            <form onSubmit={handleAddFriend} className="mt-4 pt-4 border-t border-white/10 shrink-0">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/45 mb-2">Add a Teammate</h3>
              <div className="space-y-2">
                <input
                  placeholder="Teammate Full Name"
                  required
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder:text-white/35 outline-none focus:border-[#C6FF00]/50"
                />
                <div className="grid grid-cols-[1fr_4.5rem] gap-2">
                  <input
                    placeholder="Username/Handle"
                    required
                    value={newFriendHandle}
                    onChange={(e) => setNewFriendHandle(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder:text-white/35 outline-none focus:border-[#C6FF00]/50"
                  />
                  <select
                    value={newFriendPos}
                    onChange={(e) => setNewFriendPos(e.target.value)}
                    className="h-9 px-1 rounded-xl border border-white/10 bg-[#050a0d] text-xs text-[#C6FF00] font-bold outline-none focus:border-[#C6FF00]/50"
                  >
                    {["ST", "CAM", "CM", "CB", "GK", "LW", "RW", "LB", "RB"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full h-9 rounded-xl bg-[#C6FF00] text-black font-display text-xs tracking-wider uppercase cursor-pointer hover:bg-[#b0e600] transition"
                >
                  ADD TO SQUAD
                </button>
              </div>
            </form>
            
            <button 
              onClick={() => setShowSquadModal(false)} 
              className="mt-4 w-full rounded-xl py-3 border border-white/10 bg-white/5 text-[11px] tracking-[0.2em] uppercase font-display cursor-pointer hover:bg-white/10 shrink-0"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] text-white/80 flex items-center justify-center cursor-pointer transition hover:bg-white/10 hover:text-white">
      {children}
    </button>
  );
}

function Pill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="rounded-xl py-2 text-center border"
      style={{
        background: accent ? "rgba(198,255,0,0.12)" : "rgba(255,255,255,0.03)",
        borderColor: accent ? "rgba(198,255,0,0.35)" : "rgba(255,255,255,0.08)",
      }}
    >
      <div className="text-[9px] tracking-[0.22em] uppercase text-white/50">{label}</div>
      <div className={`font-display ${accent ? "text-[#C6FF00]" : "text-white"}`} style={{ fontSize: "1.1rem" }}>
        {value}
      </div>
    </div>
  );
}

function ActionTile({ icon, label, meta, onClick }: { icon: React.ReactNode; label: string; meta: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl p-3 border border-white/8 bg-white/[0.03] text-left cursor-pointer transition hover:bg-white/5 hover:border-white/20">
      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white">{icon}</div>
      <div className="mt-2 font-display tracking-wide text-[0.95rem]">{label}</div>
      <div className="text-[9px] tracking-[0.18em] uppercase text-white/45 font-bold mt-0.5">{meta}</div>
    </button>
  );
}
