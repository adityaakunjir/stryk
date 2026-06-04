import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PlayerData } from "./player-context";

export type PlayerStats = {
  PAC: number;
  SHO: number;
  PAS: number;
  DRI: number;
  DEF: number;
  PHY: number;
};

export type PlayerMockType = {
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
  player: PlayerData | PlayerMockType;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  customStats?: { label: string; value: number }[];
};

function getStatsHelper(position: string, playStyle: string) {
  let pac = 75;
  let sho = 70;
  let pas = 75;
  let dri = 75;
  let def = 50;
  let phy = 65;

  if (position === "ST") {
    sho += 10;
    pac += 5;
    def -= 10;
  } else if (position === "CB" || position === "LB" || position === "RB") {
    def += 25;
    phy += 15;
    sho -= 15;
    dri -= 5;
  } else if (position === "GK") {
    def += 30;
    phy += 10;
    sho -= 30;
    pac -= 10;
  }

  switch (playStyle) {
    case "Speedster":
      pac += 15;
      dri += 8;
      def -= 5;
      break;
    case "Playmaker":
      pas += 14;
      dri += 10;
      sho += 4;
      break;
    case "Poacher":
      sho += 16;
      pac += 6;
      pas -= 5;
      def -= 8;
      break;
    case "Box-to-Box":
      phy += 12;
      def += 10;
      pas += 5;
      pac += 3;
      break;
  }

  const clamp = (val: number) => Math.min(99, Math.max(30, val));

  return [
    { label: "PAC", value: clamp(pac) },
    { label: "SHO", value: clamp(sho) },
    { label: "PAS", value: clamp(pas) },
    { label: "DRI", value: clamp(dri) },
    { label: "DEF", value: clamp(def) },
    { label: "PHY", value: clamp(phy) },
  ];
}

export function PlayerCard({ player, size = "md", onClick, customStats }: Props) {
  // Normalize fields across PlayerData (Context) and PlayerMockType (Figma)
  const isMock = "avatarUrl" in player;
  
  const name = isMock ? player.name : player.fullName;
  const username = player.username;
  const position = player.position;
  const ovr = isMock ? player.ovr : player.rating;
  const style = isMock ? player.style : player.playStyle;
  const foot = isMock ? player.foot : player.strongFoot === "Left" ? "L" : "R";
  const nation = isMock ? player.nation : "IND";
  const matches = isMock ? player.matches : 142;
  const avatar = isMock ? player.avatarUrl : player.avatar;

  const dims = {
    sm: "w-44 h-64",
    md: "w-60 h-[22rem]",
    lg: "w-72 h-[26rem]",
  }[size];

  // Resolve stats to display
  let statsToDisplay: { label: string; value: number }[] = [];
  if (customStats) {
    statsToDisplay = customStats;
  } else if (isMock && player.stats) {
    statsToDisplay = Object.entries(player.stats).map(([k, v]) => ({ label: k, value: v }));
  } else {
    statsToDisplay = getStatsHelper(position, style);
  }

  return (
    <button
      onClick={onClick}
      className={`group relative ${dims} shrink-0 rounded-[28px] overflow-hidden text-left transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] focus:outline-none`}
      style={{
        background: "linear-gradient(160deg, #1A2540 0%, #0B1020 45%, #05070B 100%)",
        boxShadow: "0 0 0 1px rgba(198,255,0,0.25), 0 30px 60px -20px rgba(198,255,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
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
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        }}
      />

      {/* Top row */}
      <div className="absolute inset-x-0 top-0 px-5 pt-4 flex items-start justify-between z-10">
        <div className="flex flex-col items-center">
          <div className="font-display text-[var(--stryk-lime)] leading-none" style={{ fontSize: size === "lg" ? "3rem" : size === "md" ? "2.5rem" : "2rem" }}>
            {ovr}
          </div>
          <div className="font-display text-white/90 -mt-1" style={{ fontSize: size === "sm" ? "0.875rem" : "1.125rem" }}>
            {position}
          </div>
          <div className="mt-1 w-7 h-[2px] bg-[var(--stryk-lime)]/60 rounded-full" />
          <div className="mt-2 text-[10px] tracking-widest text-white/60 uppercase">
            {nation}
          </div>
          <div className="mt-2 text-[10px] tracking-wider text-white/60 uppercase">
            {foot} • {style.slice(0, 3).toUpperCase()}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] tracking-[0.25em] text-white/40 uppercase">STRYK</div>
          <div className="font-display text-white/80" style={{ fontSize: "0.875rem" }}>
            ID · {matches.toString().padStart(3, "0")}
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="absolute inset-x-0 top-6 bottom-[42%] flex items-center justify-center z-0">
        <div
          className="relative w-full h-full"
          style={{
            maskImage: "radial-gradient(60% 70% at 50% 50%, #000 60%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(60% 70% at 50% 50%, #000 60%, transparent 100%)",
          }}
        >
          {avatar ? (
            <ImageWithFallback
              src={avatar}
              alt={name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-700 via-zinc-950 to-black opacity-80" />
          )}
        </div>
      </div>

      {/* Bottom block */}
      <div className="absolute inset-x-0 bottom-0 p-5 z-10">
        <div
          className="font-display text-white tracking-wide truncate"
          style={{ fontSize: size === "lg" ? "1.75rem" : "1.375rem" }}
        >
          {name ? name.toUpperCase() : "PLAYER NAME"}
        </div>
        <div className="text-[11px] tracking-wider text-[var(--stryk-lime)]/80 uppercase mb-3">
          @{username || "username"} · {style}
        </div>

        {size !== "sm" && (
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 pt-3 border-t border-white/10">
            {statsToDisplay.map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="font-display text-white" style={{ fontSize: "1.125rem" }}>
                  {value}
                </span>
                <span className="text-[10px] tracking-[0.15em] text-white/55 uppercase">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
