import { ArrowLeft, Share2, Trophy, ShieldCheck, Flame, TrendingUp } from "lucide-react";
import { PlayerCard } from "../components/player-card";
import { PLAYER } from "../data";

export function CardScreen() {
  return (
    <div
      className="relative w-full h-full text-white overflow-hidden"
      style={{
        background:
          "radial-gradient(60% 50% at 50% 25%, rgba(198,255,0,0.18) 0%, transparent 60%), #05070B",
      }}
    >
      <div className="relative h-full flex flex-col px-5 pt-3 pb-5">
        <div className="flex items-center justify-between">
          <Btn><ArrowLeft size={16} /></Btn>
          <div className="text-[10px] tracking-[0.35em] uppercase text-white/50">Player Card</div>
          <Btn><Share2 size={16} /></Btn>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-52 h-6 rounded-[50%] blur-2xl"
              style={{ background: "rgba(198,255,0,0.4)" }}
            />
            <div style={{ transform: "scale(0.92)" }}>
              <PlayerCard player={PLAYER} size="md" />
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] tracking-[0.35em] uppercase text-[#C6FF00]/80">
          Tap to flip · Career Dossier
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <Badge icon={<Flame size={12} />} label="Hat-Trick" />
          <Badge icon={<Trophy size={12} />} label="10× MVP" />
          <Badge icon={<ShieldCheck size={12} />} label="Verified" />
          <Badge icon={<TrendingUp size={12} />} label="Rising" />
        </div>

        <div className="mt-3 rounded-2xl p-3 border border-white/8 bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/45">Recent Form</div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#C6FF00]">+3 OVR</div>
          </div>
          <div className="mt-2 flex items-end gap-1.5 h-10">
            {[0.5, 0.65, 0.55, 0.8, 0.7, 0.95, 1, 0.85].map((v, i) => (
              <div key={i} className="flex-1 rounded-sm"
                style={{
                  height: `${v * 100}%`,
                  background: i >= 5 ? "linear-gradient(to top, #C6FF00, rgba(198,255,0,0.4))" : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Btn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center">
      {children}
    </button>
  );
}
function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl px-2 py-2 border border-white/10 bg-white/[0.04] flex flex-col items-center gap-1">
      <span className="text-[#C6FF00]">{icon}</span>
      <span className="text-[9px] text-white/75 tracking-wide text-center leading-tight">{label}</span>
    </div>
  );
}
