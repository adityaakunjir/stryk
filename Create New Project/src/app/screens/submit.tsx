import { ArrowLeft, Minus, Plus, Crown, Target, Zap, Shield, Hand, Footprints } from "lucide-react";
import { PLAYER } from "../data";

export function SubmitScreen() {
  const stats = [
    { key: "Goals", icon: Target, value: 2 },
    { key: "Assists", icon: Zap, value: 1 },
    { key: "Tackles", icon: Footprints, value: 4 },
    { key: "Saves", icon: Hand, value: 0 },
    { key: "Intercepts", icon: Shield, value: 3 },
  ];
  return (
    <div className="relative w-full h-full text-white overflow-hidden" style={{ background: "#05070B" }}>
      <div className="relative h-full flex flex-col px-5 pt-3 pb-4">
        <div className="flex items-center justify-between">
          <Btn><ArrowLeft size={16} /></Btn>
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/45">Post-Match</div>
            <div className="font-display tracking-wide" style={{ fontSize: "0.95rem" }}>SUBMIT STATS</div>
          </div>
          <div className="w-9 h-9" />
        </div>

        {/* Match header */}
        <div className="mt-3 rounded-2xl p-3 border border-white/10 bg-white/[0.03] flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-white/45">Friday League</div>
            <div className="font-display tracking-wide" style={{ fontSize: "0.95rem" }}>ALPHA 4 — 3 BRAVO</div>
            <div className="text-[10px] text-white/45 mt-0.5">Turf Yard · Today</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.22em] uppercase text-[#C6FF00]">Win</div>
            <div className="font-display" style={{ fontSize: "1.5rem", color: "#C6FF00" }}>W</div>
          </div>
        </div>

        {/* Stats steppers */}
        <div className="mt-3 space-y-1.5 flex-1 overflow-hidden">
          {stats.map((s) => (
            <div key={s.key} className="flex items-center gap-3 rounded-xl px-3 py-2 border border-white/8 bg-white/[0.03]">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#C6FF00]">
                <s.icon size={14} />
              </div>
              <div className="flex-1 text-[13px]">{s.key}</div>
              <div className="flex items-center gap-2">
                <Step><Minus size={12} /></Step>
                <div className="w-7 text-center font-display" style={{ fontSize: "1.1rem" }}>{s.value}</div>
                <Step accent><Plus size={12} /></Step>
              </div>
            </div>
          ))}
        </div>

        {/* MVP */}
        <div className="mt-2 rounded-2xl p-3 border border-[#C6FF00]/30"
          style={{ background: "linear-gradient(135deg, rgba(198,255,0,0.10), transparent)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Crown size={14} className="text-[#C6FF00]" />
            <div className="text-[10px] tracking-[0.25em] uppercase text-[#C6FF00]">MVP Vote</div>
          </div>
          <div className="flex items-center gap-2">
            <img src={PLAYER.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
            <div className="flex-1">
              <div className="text-[13px]">{PLAYER.name}</div>
              <div className="text-[10px] text-white/50">@{PLAYER.username} · CAM</div>
            </div>
            <button className="rounded-full px-3 py-1 text-[10px] tracking-[0.2em] uppercase bg-white/5 border border-white/10">Change</button>
          </div>
        </div>

        <button className="mt-3 w-full rounded-2xl py-3 bg-[#C6FF00] text-black font-display tracking-[0.2em]" style={{ fontSize: "0.875rem", boxShadow: "0 20px 40px -10px rgba(198,255,0,0.5)" }}>
          SUBMIT FOR VERIFICATION
        </button>
        <div className="text-center text-[10px] text-white/40 mt-1.5">3 of 7 teammates must approve</div>
      </div>
    </div>
  );
}

function Btn({ children }: { children: React.ReactNode }) {
  return <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center">{children}</button>;
}
function Step({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <button
      className="w-7 h-7 rounded-lg flex items-center justify-center"
      style={{
        background: accent ? "#C6FF00" : "rgba(255,255,255,0.06)",
        color: accent ? "#05070B" : "#fff",
        border: accent ? "none" : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {children}
    </button>
  );
}
