import { ArrowLeft, Check, X, ShieldCheck } from "lucide-react";
import { FRIENDS } from "../data";

export function VerifyScreen() {
  const requests = [
    { who: FRIENDS[0], match: "Friday League · Turf Yard", stats: [{ k: "Goals", v: 2 }, { k: "Assists", v: 1 }, { k: "MVP", v: "Yes" }] },
    { who: FRIENDS[1], match: "Friday League · Turf Yard", stats: [{ k: "Tackles", v: 5 }, { k: "Intercepts", v: 3 }] },
    { who: FRIENDS[2], match: "Sunday Sweat 7s", stats: [{ k: "Saves", v: 8 }, { k: "Clean Sheet", v: "Yes" }] },
  ];

  return (
    <div className="relative w-full h-full text-white overflow-hidden" style={{ background: "#05070B" }}>
      <div className="relative h-full flex flex-col px-5 pt-3 pb-4">
        <div className="flex items-center justify-between">
          <Btn><ArrowLeft size={16} /></Btn>
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/45">Trust Layer</div>
            <div className="font-display tracking-wide" style={{ fontSize: "0.95rem" }}>VERIFY STATS</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#C6FF00]/15 border border-[#C6FF00]/30 flex items-center justify-center text-[#C6FF00]">
            <ShieldCheck size={14} />
          </div>
        </div>

        <div className="mt-3 rounded-2xl p-3 border border-white/8 bg-white/[0.03] flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/45">Your Trust Score</div>
            <div className="font-display" style={{ fontSize: "1.5rem", color: "#C6FF00" }}>98<span className="text-white/40" style={{ fontSize: "0.9rem" }}>/100</span></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.22em] uppercase text-white/45">Pending</div>
            <div className="font-display" style={{ fontSize: "1.5rem" }}>{requests.length}</div>
          </div>
        </div>

        <div className="mt-3 flex-1 space-y-2.5 overflow-hidden">
          {requests.map((r, i) => (
            <div key={i} className="rounded-2xl p-3 border border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-2.5">
                <img src={r.who.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] truncate">{r.who.name} <span className="text-white/40">@{r.who.handle}</span></div>
                  <div className="text-[10px] text-white/45 truncate">{r.match}</div>
                </div>
                <div className="font-display text-[#C6FF00]" style={{ fontSize: "0.95rem" }}>{r.who.ovr}</div>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {r.stats.map((s) => (
                  <span key={s.k} className="text-[10px] tracking-[0.15em] uppercase px-2 py-1 rounded-full border border-white/10 bg-white/5">
                    {s.k} · <span className="text-[#C6FF00]">{s.v}</span>
                  </span>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded-xl py-2 flex items-center justify-center gap-1.5 border border-white/10 text-[11px] tracking-[0.2em] uppercase text-white/75">
                  <X size={12} /> Reject
                </button>
                <button className="rounded-xl py-2 flex items-center justify-center gap-1.5 bg-[#C6FF00] text-black text-[11px] tracking-[0.2em] uppercase font-medium">
                  <Check size={12} strokeWidth={3} /> Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Btn({ children }: { children: React.ReactNode }) {
  return <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center">{children}</button>;
}
