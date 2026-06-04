import { ImageWithFallback } from "./figma/ImageWithFallback";

export type PlayerStats = {
  PAC: number;
  SHO: number;
  PAS: number;
  DRI: number;
  DEF: number;
  PHY: number;
};

export type Player = {
  name: string;
  username: string;
  position: string;
  ovr: number;
  style: string;
  foot: "L" | "R";
  nation: string;
  matches: number;
  stats: PlayerStats;
  avatarUrl: string;
};

type Props = {
  player: Player;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
};

export function PlayerCard({ player, size = "md", onClick }: Props) {
  const dims = {
    sm: "w-44 h-64",
    md: "w-60 h-[22rem]",
    lg: "w-72 h-[26rem]",
  }[size];

  return (
    <button
      onClick={onClick}
      className={`group relative ${dims} shrink-0 rounded-[28px] overflow-hidden text-left transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] focus:outline-none`}
      style={{
        background:
          "linear-gradient(160deg, #1A2540 0%, #0B1020 45%, #05070B 100%)",
        boxShadow:
          "0 0 0 1px rgba(198,255,0,0.25), 0 30px 60px -20px rgba(198,255,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Holographic shimmer */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 mix-blend-screen pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -10%, rgba(198,255,0,0.35) 0%, transparent 55%), radial-gradient(80% 50% at 110% 110%, rgba(91,140,255,0.25) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -inset-x-10 -top-10 h-40 rotate-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        }}
      />

      {/* Top row */}
      <div className="absolute inset-x-0 top-0 px-5 pt-4 flex items-start justify-between z-10">
        <div className="flex flex-col items-center">
          <div className="font-display text-[var(--stryk-lime)] leading-none" style={{ fontSize: size === "lg" ? "3rem" : size === "md" ? "2.5rem" : "2rem" }}>
            {player.ovr}
          </div>
          <div className="font-display text-white/90 -mt-1" style={{ fontSize: size === "sm" ? "0.875rem" : "1.125rem" }}>
            {player.position}
          </div>
          <div className="mt-1 w-7 h-[2px] bg-[var(--stryk-lime)]/60 rounded-full" />
          <div className="mt-2 text-[10px] tracking-[0.2em] text-white/60 uppercase">
            {player.nation}
          </div>
          <div className="mt-2 text-[10px] tracking-[0.2em] text-white/60 uppercase">
            {player.foot} • {player.style.slice(0, 3).toUpperCase()}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] tracking-[0.25em] text-white/40 uppercase">STRYK</div>
          <div className="font-display text-white/80" style={{ fontSize: "0.875rem" }}>
            ID · {player.matches.toString().padStart(3, "0")}
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="absolute inset-x-0 top-6 bottom-[42%] flex items-center justify-center z-0">
        <div
          className="relative w-full h-full"
          style={{
            maskImage:
              "radial-gradient(60% 70% at 50% 50%, #000 60%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(60% 70% at 50% 50%, #000 60%, transparent 100%)",
          }}
        >
          <ImageWithFallback
            src={player.avatarUrl}
            alt={player.name}
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>

      {/* Bottom block */}
      <div className="absolute inset-x-0 bottom-0 p-5 z-10">
        <div
          className="font-display text-white tracking-wide truncate"
          style={{ fontSize: size === "lg" ? "1.75rem" : "1.375rem" }}
        >
          {player.name.toUpperCase()}
        </div>
        <div className="text-[11px] tracking-[0.18em] text-[var(--stryk-lime)]/80 uppercase mb-3">
          @{player.username} · {player.style}
        </div>

        {size !== "sm" && (
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 pt-3 border-t border-white/10">
            {Object.entries(player.stats).map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-1.5">
                <span className="font-display text-white" style={{ fontSize: "1.125rem" }}>
                  {v}
                </span>
                <span className="text-[10px] tracking-[0.15em] text-white/55 uppercase">
                  {k}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
