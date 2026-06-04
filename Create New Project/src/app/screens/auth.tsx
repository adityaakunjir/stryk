import { Mail, Lock, ArrowRight } from "lucide-react";

export function AuthScreen() {
  return (
    <div className="relative w-full h-full text-white overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 50% 0%, rgba(198,255,0,0.18) 0%, transparent 60%), radial-gradient(70% 50% at 50% 100%, rgba(91,140,255,0.10) 0%, transparent 60%), #05070B",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-56 opacity-[0.12]"
        style={{
          background:
            "linear-gradient(transparent, rgba(198,255,0,0.5)), repeating-linear-gradient(90deg, transparent 0 30px, rgba(255,255,255,0.5) 30px 31px)",
          transform: "perspective(420px) rotateX(72deg)",
          transformOrigin: "bottom",
        }}
      />

      <div className="relative h-full flex flex-col px-6 pt-4 pb-6">
        <div className="flex items-center gap-2 justify-center mt-1">
          <div className="w-8 h-8 rounded-lg bg-[#C6FF00] text-black flex items-center justify-center font-display" style={{ fontSize: "1rem" }}>S</div>
          <div className="font-display tracking-[0.35em]" style={{ fontSize: "1rem" }}>STRYK</div>
        </div>

        <div className="mt-auto">
          <div className="text-[10px] tracking-[0.35em] uppercase text-[#C6FF00]">Build your legend</div>
          <h1 className="font-display tracking-wide mt-2" style={{ fontSize: "2.4rem", lineHeight: 1 }}>
            YOUR FOOTBALL<br/>IDENTITY,<br/><span style={{ color: "#C6FF00" }}>UNLOCKED.</span>
          </h1>
          <div className="text-[13px] text-white/55 mt-3 leading-relaxed">
            One profile. Every match. Verified stats, growing reputation, a card that evolves with you.
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Field icon={<Mail size={14} />} placeholder="Email or phone" />
          <Field icon={<Lock size={14} />} placeholder="Password" />
          <button
            className="mt-1 w-full rounded-2xl py-3.5 bg-[#C6FF00] text-black font-display tracking-[0.22em] flex items-center justify-center gap-2"
            style={{ fontSize: "0.95rem", boxShadow: "0 20px 40px -10px rgba(198,255,0,0.55)" }}
          >
            CONTINUE <ArrowRight size={16} strokeWidth={3} />
          </button>
          <button className="w-full rounded-2xl py-3 border border-white/10 bg-white/5 text-[12px] tracking-[0.22em] uppercase">
            Continue with Google
          </button>
        </div>

        <div className="mt-4 text-center text-[11px] text-white/50">
          New here? <span className="text-[#C6FF00]">Create your card →</span>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, placeholder }: { icon: React.ReactNode; placeholder: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] h-12 flex items-center px-4 gap-2">
      <span className="text-white/40">{icon}</span>
      <input readOnly placeholder={placeholder} className="bg-transparent outline-none flex-1 text-[13px] placeholder:text-white/40 text-white" />
    </div>
  );
}
