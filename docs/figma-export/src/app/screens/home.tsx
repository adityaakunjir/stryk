import { Bell, Settings, Play, Users, Trophy, MapPin } from "lucide-react";
import { PlayerCard } from "../components/player-card";
import { PLAYER, FRIENDS } from "../data";

export function HomeScreen() {
  return (
    <div className="relative w-full h-full text-white overflow-hidden">
      {/* Ambient bg */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 50% 10%, rgba(198,255,0,0.12) 0%, transparent 60%), radial-gradient(80% 60% at 50% 100%, rgba(91,140,255,0.08) 0%, transparent 60%), #05070B",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 opacity-[0.10]"
        style={{
          background:
            "linear-gradient(transparent, rgba(198,255,0,0.5)), repeating-linear-gradient(90deg, transparent 0 28px, rgba(255,255,255,0.5) 28px 29px)",
          transform: "perspective(400px) rotateX(70deg)",
          transformOrigin: "bottom",
        }}
      />

      <div className="relative h-full flex flex-col px-5 pt-3 pb-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C6FF00] text-black flex items-center justify-center font-display" style={{ fontSize: "1rem" }}>
              S
            </div>
            <div className="font-display tracking-[0.25em]" style={{ fontSize: "0.95rem" }}>STRYK</div>
          </div>
          <div className="flex items-center gap-1.5">
            <IconBtn><Bell size={14} /></IconBtn>
            <IconBtn><Settings size={14} /></IconBtn>
          </div>
        </div>

        {/* Greeting */}
        <div className="mt-4">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">Welcome back</div>
          <div className="font-display tracking-wide mt-0.5" style={{ fontSize: "1.5rem" }}>
            HEY, {PLAYER.name.split(" ")[0].toUpperCase()}
          </div>
        </div>

        {/* Hero card */}
        <div className="mt-4 relative flex justify-center">
          <div
            aria-hidden
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-56 h-8 rounded-[50%] blur-2xl"
            style={{ background: "rgba(198,255,0,0.35)" }}
          />
          <div style={{ transform: "scale(0.85)", transformOrigin: "top center" }}>
            <PlayerCard player={PLAYER} size="md" />
          </div>
        </div>

        {/* Quick stats row */}
        <div className="-mt-6 grid grid-cols-3 gap-2 px-1">
          <Pill label="Matches" value={PLAYER.matches.toString()} />
          <Pill label="OVR" value={PLAYER.ovr.toString()} accent />
          <Pill label="Rep" value="A+" />
        </div>

        {/* Squad strip */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/45">Squad online</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#C6FF00]">{FRIENDS.filter(f=>f.online).length} live</div>
          </div>
          <div className="flex gap-2 overflow-hidden">
            {FRIENDS.slice(0, 5).map((f) => (
              <div key={f.name} className="relative shrink-0">
                <img src={f.avatar} alt="" className="w-11 h-11 rounded-full object-cover border border-white/10" />
                {f.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#C6FF00] border-2 border-[#05070B]" />
                )}
              </div>
            ))}
            <div className="w-11 h-11 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/50 text-xs">+</div>
          </div>
        </div>

        {/* Action panels */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ActionTile icon={<MapPin size={16} />} label="Lobbies" meta="3 nearby" />
          <ActionTile icon={<Users size={16} />} label="Friends" meta="12" />
          <ActionTile icon={<Trophy size={16} />} label="Badges" meta="3 new" />
          <ActionTile icon={<Play size={16} />} label="History" meta="142 games" />
        </div>

        {/* Primary CTA */}
        <div className="mt-auto pt-3">
          <button
            className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 bg-[#C6FF00] text-black font-display tracking-[0.2em]"
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
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] text-white/80 flex items-center justify-center">
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
      <div className={`font-display ${accent ? "text-[#C6FF00]" : "text-white"}`} style={{ fontSize: "1rem" }}>
        {value}
      </div>
    </div>
  );
}
function ActionTile({ icon, label, meta }: { icon: React.ReactNode; label: string; meta: string }) {
  return (
    <button className="rounded-2xl p-3 border border-white/8 bg-white/[0.03] text-left">
      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white">{icon}</div>
      <div className="mt-2 font-display tracking-wide" style={{ fontSize: "0.875rem" }}>{label}</div>
      <div className="text-[10px] tracking-[0.18em] uppercase text-white/45">{meta}</div>
    </button>
  );
}
