import { Search, Plus, MapPin, Clock, Users } from "lucide-react";
import { LOBBIES } from "../data";

export function LobbiesScreen() {
  return (
    <div className="relative w-full h-full text-white overflow-hidden" style={{ background: "#05070B" }}>
      <div
        className="absolute inset-x-0 top-0 h-60 opacity-60"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(198,255,0,0.10), transparent 60%)" }}
      />
      <div className="relative h-full flex flex-col px-5 pt-3 pb-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/45">Match Lobbies</div>
            <div className="font-display tracking-wide mt-0.5" style={{ fontSize: "1.5rem" }}>FIND A GAME</div>
          </div>
          <button className="w-10 h-10 rounded-full bg-[#C6FF00] text-black flex items-center justify-center"
            style={{ boxShadow: "0 14px 30px -8px rgba(198,255,0,0.55)" }}>
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center px-3 h-11">
          <Search size={14} className="text-white/50" />
          <input
            placeholder="Search venues, hosts…"
            className="bg-transparent outline-none px-2 text-[13px] text-white placeholder:text-white/35 w-full"
            readOnly
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-hidden">
          <Tab active>All</Tab>
          <Tab>My Lobbies</Tab>
          <Tab>Friends</Tab>
        </div>

        <div className="mt-3 flex-1 space-y-2.5 overflow-hidden">
          {LOBBIES.map((l, i) => (
            <div
              key={l.name}
              className="rounded-2xl p-3.5 border bg-white/[0.03]"
              style={{
                borderColor: i === 0 ? "rgba(198,255,0,0.35)" : "rgba(255,255,255,0.08)",
                background: i === 0 ? "linear-gradient(135deg, rgba(198,255,0,0.10), rgba(198,255,0,0.02))" : undefined,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="font-display tracking-wide truncate" style={{ fontSize: "1rem" }}>
                    {l.name.toUpperCase()}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/55">
                    <MapPin size={10} /> <span className="truncate">{l.venue}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/55">
                    <Clock size={10} /> {l.time}
                  </div>
                </div>
                {l.live && (
                  <span className="text-[9px] tracking-[0.25em] uppercase px-2 py-1 rounded-full bg-[#C6FF00] text-black">Live</span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users size={11} className="text-white/55" />
                  <div className="text-[11px] text-white/70">
                    <span className="text-white">{l.going}</span>/{l.total} going
                  </div>
                  <div className="ml-2 h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#C6FF00]" style={{ width: `${(l.going/l.total)*100}%` }} />
                  </div>
                </div>
                <button
                  className="rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.2em] uppercase"
                  style={{
                    background: i === 0 ? "#C6FF00" : "rgba(255,255,255,0.06)",
                    color: i === 0 ? "#05070B" : "#fff",
                    border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {i === 0 ? "Join" : "View"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tab({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <button
      className="px-4 h-8 rounded-full text-[11px] tracking-[0.2em] uppercase"
      style={{
        background: active ? "#C6FF00" : "transparent",
        color: active ? "#05070B" : "rgba(255,255,255,0.6)",
        border: active ? "none" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {children}
    </button>
  );
}
