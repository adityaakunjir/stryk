import { ArrowLeft, ArrowRight, Check } from "lucide-react";

export function ProfileCreateScreen() {
  const positions = [
    { code: "GK", x: 50, y: 90 },
    { code: "LB", x: 18, y: 72 }, { code: "CB", x: 38, y: 78 }, { code: "CB", x: 62, y: 78 }, { code: "RB", x: 82, y: 72 },
    { code: "CDM", x: 50, y: 60 },
    { code: "LM", x: 22, y: 45 }, { code: "CM", x: 40, y: 47 }, { code: "CM", x: 60, y: 47 }, { code: "RM", x: 78, y: 45 },
    { code: "CAM", x: 50, y: 32, active: true },
    { code: "LW", x: 22, y: 18 }, { code: "ST", x: 50, y: 14 }, { code: "RW", x: 78, y: 18 },
  ];

  return (
    <div className="relative w-full h-full text-white overflow-hidden" style={{ background: "#05070B" }}>
      <div className="relative h-full flex flex-col px-5 pt-3 pb-4">
        <div className="flex items-center justify-between">
          <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><ArrowLeft size={16} /></button>
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/45">Step 2 / 3</div>
          <button className="text-[10px] tracking-[0.25em] uppercase text-white/55">Skip</button>
        </div>

        <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-2/3 bg-[#C6FF00]" />
        </div>

        <div className="mt-4">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#C6FF00]">Pick your role</div>
          <h2 className="font-display tracking-wide mt-1" style={{ fontSize: "1.5rem" }}>WHERE DO YOU PLAY?</h2>
        </div>

        {/* Pitch */}
        <div className="mt-3 relative h-[300px] rounded-2xl border border-white/10 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(198,255,0,0.06), rgba(91,140,255,0.06)), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 24px, transparent 24px 48px)",
          }}>
          <div className="absolute inset-3 border border-white/15 rounded" />
          <div className="absolute left-3 right-3 top-1/2 h-px bg-white/15" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/15" />

          {positions.map((p, i) => (
            <button
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center font-display tracking-wider"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: "0.7rem",
                background: p.active ? "#C6FF00" : "rgba(255,255,255,0.06)",
                color: p.active ? "#05070B" : "rgba(255,255,255,0.7)",
                border: p.active ? "none" : "1px solid rgba(255,255,255,0.12)",
                boxShadow: p.active ? "0 14px 30px -8px rgba(198,255,0,0.6)" : "none",
              }}
            >
              {p.code}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 border border-[#C6FF00]/35" style={{ background: "linear-gradient(135deg, rgba(198,255,0,0.10), transparent)" }}>
            <div className="text-[10px] tracking-[0.22em] uppercase text-white/55">Primary</div>
            <div className="font-display tracking-wide" style={{ fontSize: "1.25rem", color: "#C6FF00" }}>CAM</div>
          </div>
          <div className="rounded-xl p-3 border border-white/10 bg-white/[0.03]">
            <div className="text-[10px] tracking-[0.22em] uppercase text-white/55">Secondary</div>
            <div className="font-display tracking-wide text-white/80" style={{ fontSize: "1.25rem" }}>CM</div>
          </div>
        </div>

        <div className="mt-3 rounded-xl p-3 border border-white/10 bg-white/[0.03] flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-white/55">Strong Foot</div>
            <div className="font-display tracking-wide mt-0.5" style={{ fontSize: "1rem" }}>LEFT</div>
          </div>
          <div className="flex gap-1 p-0.5 rounded-full bg-white/5 border border-white/10">
            <span className="px-3 py-1 rounded-full bg-[#C6FF00] text-black text-[11px] tracking-[0.2em] uppercase">L</span>
            <span className="px-3 py-1 rounded-full text-white/55 text-[11px] tracking-[0.2em] uppercase">R</span>
          </div>
        </div>

        <button className="mt-auto w-full rounded-2xl py-3 bg-[#C6FF00] text-black font-display tracking-[0.22em] flex items-center justify-center gap-2" style={{ fontSize: "0.875rem" }}>
          CONTINUE <ArrowRight size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

void Check;
