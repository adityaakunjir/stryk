import { type ReactNode } from "react";

type Props = {
  label: string;
  index: string;
  children: ReactNode;
};

export function PhoneFrame({ label, index, children }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 shrink-0 select-none">
      <div className="flex items-baseline gap-3 px-2">
        <div
          className="font-display text-[#C6FF00] tracking-[0.3em]"
          style={{ fontSize: "0.75rem" }}
        >
          {index}
        </div>
        <div
          className="font-display text-white tracking-[0.18em] uppercase"
          style={{ fontSize: "0.95rem" }}
        >
          {label}
        </div>
      </div>

      <div
        className="relative rounded-[44px] p-[6px]"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))",
          boxShadow:
            "0 50px 80px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="relative w-[360px] h-[640px] rounded-[38px] overflow-hidden"
          style={{ background: "#05070B" }}
        >
          {/* Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black z-50 flex items-center justify-end pr-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C6FF00]/70 animate-pulse" />
          </div>
          
          {/* Status bar */}
          <div className="absolute top-3 left-0 right-0 z-40 px-6 flex items-center justify-between text-[10px] text-white/80 tracking-wider font-semibold pointer-events-none">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="opacity-70">●●●●</span>
              <span className="opacity-70">5G</span>
              <span>100%</span>
            </span>
          </div>

          {/* Adapted child content wrapper */}
          <div className="absolute inset-0 pt-9 [&_main]:min-h-full [&_main]:h-full [&_main]:bg-transparent [&_main]:pt-4 [&_main_header]:pt-2 [&_main_header]:h-12 [&_main_.stryk-card-spin]:scale-[0.85] [&_main_.stryk-card-spin]:origin-center [&_main_.min-h-screen]:min-h-full [&_main_.min-h-screen]:h-full [&_main_.h-screen]:h-full [&_main_section]:min-h-full [&_main_section]:h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
