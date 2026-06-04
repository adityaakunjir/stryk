import { ArrowLeft, Shuffle, Check } from "lucide-react";
import { FRIENDS, PLAYER } from "../data";

export function TeamBuilderScreen() {
  const teamA = [
    { name: PLAYER.name.split(" ")[0], pos: "CAM", ovr: PLAYER.ovr, x: 50, y: 55 },
    { name: "Kabir", pos: "GK", ovr: 84, x: 50, y: 90 },
    { name: "Dev", pos: "CB", ovr: 76, x: 30, y: 72 },
    { name: "Yash", pos: "RB", ovr: 74, x: 75, y: 70 },
    { name: "Ishaan", pos: "LW", ovr: 81, x: 22, y: 35 },
  ];

  return (
    <div className="relative w-full h-full text-white overflow-hidden" style={{ background: "#05070B" }}>
      <div className="relative h-full flex flex-col px-5 pt-3 pb-4">
        <div className="flex items-center justify-between">
          <Btn><ArrowLeft size={16} /></Btn>
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/45">Team Builder</div>
            <div className="font-display tracking-wide" style={{ fontSize: "0.95rem" }}>FRIDAY LEAGUE</div>
          </div>
          <Btn><Shuffle size={16} /></Btn>
        </div>

        {/* Team chips */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <TeamChip color="#C6FF00" name="TEAM ALPHA" avg={80} count={5} active />
          <TeamChip color="#5B8CFF" name="TEAM BRAVO" avg={77} count={4} />
        </div>

        {/* Pitch */}
        <div className="mt-3 relative flex-1 rounded-2xl overflow-hidden border border-white/10"
          style={{
            background:
              "linear-gradient(180deg, rgba(198,255,0,0.06), rgba(91,140,255,0.06)), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 28px, transparent 28px 56px)",
          }}>
          {/* Pitch markings */}
          <div className="absolute inset-3 border border-white/15 rounded-md" />
          <div className="absolute left-1/2 top-3 bottom-3 w-px bg-white/15" />
          <div className="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
          {/* Penalty box */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 w-32 h-12 border border-white/15 border-b-0" />
          <div className="absolute left-1/2 -translate-x-1/2 top-3 w-32 h-12 border border-white/15 border-t-0" />

          {/* Players */}
          {teamA.map((p) => (
            <div
              key={p.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <div
                className="w-9 h-9 rounded-full bg-[#C6FF00] text-black flex items-center justify-center font-display"
                style={{ fontSize: "0.75rem", boxShadow: "0 8px 18px -6px rgba(198,255,0,0.7)" }}
              >
                {p.ovr}
              </div>
              <div className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] bg-black/60 backdrop-blur tracking-[0.15em] uppercase">
                {p.pos}
              </div>
              <div className="text-[10px] text-white/80 mt-0.5">{p.name}</div>
            </div>
          ))}

          {/* Empty slot */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: "78%", top: "35%" }}>
            <div className="w-9 h-9 rounded-full border border-dashed border-white/30 flex items-center justify-center text-white/40 text-xs">+</div>
            <div className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] bg-black/40 tracking-[0.15em] uppercase text-white/40">RW</div>
          </div>
        </div>

        {/* Bench */}
        <div className="mt-3">
          <div className="text-[10px] tracking-[0.25em] uppercase text-white/45 mb-1.5">Bench · drag to assign</div>
          <div className="flex gap-2 overflow-hidden">
            {FRIENDS.slice(0, 4).map((f) => (
              <div key={f.name} className="flex flex-col items-center gap-1 shrink-0">
                <div className="relative">
                  <img src={f.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded text-[8px] bg-black/70 tracking-wider">{f.pos}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="mt-3 w-full rounded-2xl py-3 bg-[#C6FF00] text-black font-display tracking-[0.2em] flex items-center justify-center gap-2" style={{ fontSize: "0.875rem" }}>
          <Check size={14} strokeWidth={3} /> LOCK TEAMS
        </button>
      </div>
    </div>
  );
}

function Btn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center">{children}</button>
  );
}
function TeamChip({ color, name, avg, count, active }: { color: string; name: string; avg: number; count: number; active?: boolean }) {
  return (
    <div
      className="rounded-xl px-3 py-2 border flex items-center justify-between"
      style={{
        borderColor: active ? color : "rgba(255,255,255,0.08)",
        background: active ? `linear-gradient(135deg, ${color}22, transparent)` : "rgba(255,255,255,0.03)",
      }}
    >
      <div>
        <div className="font-display tracking-wide" style={{ fontSize: "0.8rem", color }}>{name}</div>
        <div className="text-[10px] text-white/55">{count} players</div>
      </div>
      <div className="text-right">
        <div className="text-[9px] tracking-[0.2em] uppercase text-white/45">AVG</div>
        <div className="font-display" style={{ fontSize: "1.1rem", color }}>{avg}</div>
      </div>
    </div>
  );
}
