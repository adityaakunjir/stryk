import { type ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  title: string;
  meta?: string;
  accent?: boolean;
  onClick?: () => void;
};

export function LobbyPanel({ icon, label, title, meta, accent, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left rounded-[22px] p-5 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 focus:outline-none cursor-pointer"
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(198,255,0,0.18) 0%, rgba(198,255,0,0.04) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        border: accent
          ? "1px solid rgba(198,255,0,0.4)"
          : "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: accent
          ? "0 20px 40px -20px rgba(198,255,0,0.4)"
          : "0 10px 30px -20px rgba(0,0,0,0.6)"}}
    >
      <div
        aria-hidden
        className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: accent ? "#C6FF00" : "#5B8CFF" }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            accent ? "bg-[#C6FF00] text-white font-bold" : "bg-white/5 text-white"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-[0.22em] uppercase text-white/50">
            {label}
          </div>
          <div className="font-display tracking-wide text-white truncate text-xl">
            {title}
          </div>
          {meta && (
            <div className="mt-1 text-[12px] text-white/60 truncate">{meta}</div>
          )}
        </div>
      </div>
    </button>
  );
}
