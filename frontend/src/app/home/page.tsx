"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Settings, Play, Users, Trophy, MapPin, Loader2, X } from "lucide-react";
import { usePlayer } from "@/components/player-context";
import { PlayerCard } from "@/components/player-card";
import { CardDetail } from "@/components/card-detail";
import { AnimatePresence } from "framer-motion";

const FRIENDS = [
  { name: "Vikram", handle: "vik.7", ovr: 82, online: true, pos: "ST", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Rohan", handle: "rohan.k", ovr: 79, online: true, pos: "CM", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Kabir", handle: "kabir.gk", ovr: 84, online: false, pos: "GK", avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Dev", handle: "dev.cb", ovr: 76, online: true, pos: "CB", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Ishaan", handle: "ish.lw", ovr: 81, online: true, pos: "LW", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Yash", handle: "yashy", ovr: 74, online: false, pos: "RB", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
];

export default function HomeLobbyPage() {
  const router = useRouter();
  const { playerData, isLoaded } = usePlayer();
  const [showCardDossier, setShowCardDossier] = useState(false);
  const [showSquadModal, setShowSquadModal] = useState(false);

  // Prevent flashing before context loaded
  if (!isLoaded) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white flex items-center justify-center">
        <Loader2 className="size-10 text-[#C6FF00] animate-spin" />
      </main>
    );
  }

  const firstName = (playerData.fullName || "PLAYER").split(" ")[0].toUpperCase();

  return (
    <main className="stryk-mobile-shell relative min-h-screen text-white overflow-hidden bg-[#05070B]">
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

      <div className="relative min-h-screen flex flex-col px-5 pt-6 pb-6 max-w-md mx-auto z-10">
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
          <Pill label="Matches" value="142" />
          <Pill label="OVR" value={playerData.rating.toString()} accent />
          <Pill label="Rep" value="A+" />
        </div>

        {/* Squad online strip */}
        <div className="mt-auto pt-4 sm:mt-6 sm:pt-0">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/45 font-bold">Squad online</div>
            <button 
              onClick={() => setShowSquadModal(true)} 
              className="text-[10px] tracking-[0.2em] uppercase text-[#C6FF00] font-bold cursor-pointer hover:underline"
            >
              {FRIENDS.filter((f) => f.online).length} LIVE
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
            {FRIENDS.slice(0, 5).map((f) => (
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

        {/* Action panels grid */}
        <div className="hidden mt-6 grid-cols-2 gap-2.5 sm:grid">
          <ActionTile 
            icon={<MapPin size={16} />} 
            label="Lobbies" 
            meta="3 nearby" 
            onClick={() => router.push("/lobbies")} 
          />
          <ActionTile 
            icon={<Users size={16} />} 
            label="Friends" 
            meta="6 players" 
            onClick={() => setShowSquadModal(true)} 
          />
          <ActionTile 
            icon={<Trophy size={16} />} 
            label="Badges" 
            meta="3 new" 
            onClick={() => router.push("/card")} 
          />
          <ActionTile 
            icon={<Play size={16} />} 
            label="History" 
            meta="submit stats" 
            onClick={() => router.push("/submit")} 
          />
        </div>

        {/* Primary CTA */}
        <div className="hidden mt-auto pt-6 sm:block">
          <button
            onClick={() => router.push("/lobbies")}
            className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 bg-[#C6FF00] text-black font-display tracking-[0.2em] cursor-pointer hover:bg-[#b0e600] transition duration-200"
            style={{
              fontSize: "0.95rem",
              boxShadow: "0 20px 40px -10px rgba(198,255,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            <Play size={16} strokeWidth={3} fill="currentColor" />
            ENTER LOBBY
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
          <div className="relative w-full max-w-sm rounded-[2rem] border border-[#C6FF00]/30 bg-[#050a0d] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.8)]">
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
            
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full overflow-hidden bg-[#C6FF00]/10 border border-[#C6FF00] grid place-items-center text-[#C6FF00] font-display text-sm uppercase">
                    {playerData.avatar ? (
                      <img src={playerData.avatar} className="h-full w-full object-cover" alt="User avatar" />
                    ) : (
                      playerData.fullName[0]
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-white">{playerData.fullName} (You)</span>
                    <span className="block text-[11px] text-[#C6FF00] uppercase font-bold tracking-wider">{playerData.position} • {playerData.playStyle}</span>
                  </div>
                </div>
                <span className="rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/30 px-3 py-0.5 text-[10px] font-bold text-[#C6FF00] uppercase tracking-wider">Ready</span>
              </div>
              
              {FRIENDS.map((f) => (
                <div key={f.name} className="flex items-center justify-between rounded-xl bg-white/[0.01] border border-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full overflow-hidden border border-white/10">
                      <img src={f.avatar} className="h-full w-full object-cover" alt={f.name} />
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-white">{f.name}</span>
                      <span className="block text-[11px] text-white/40 uppercase font-bold tracking-wider">{f.pos} • OVR {f.ovr}</span>
                    </div>
                  </div>
                  {f.online ? (
                    <span className="rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/30 px-3 py-0.5 text-[10px] font-bold text-[#C6FF00] uppercase tracking-wider">Ready</span>
                  ) : (
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider mr-2">Offline</span>
                  )}
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setShowSquadModal(false)} 
              className="mt-6 w-full rounded-xl py-3 border border-white/10 bg-white/5 text-[11px] tracking-[0.2em] uppercase font-display cursor-pointer hover:bg-white/10"
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
