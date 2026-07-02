"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Crown, Globe, Home, Medal, Trophy, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "ovr" | "xp" | "goals" | "assists" | "cleanSheets";
type Timeframe = "allTime" | "monthly" | "weekly";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  position?: string | null;
  playStyle?: string | null;
  cardFrame: "bronze" | "silver" | "gold" | string;
  level: number;
  OVR: number;
  xp: number;
  careerGoals: number;
  careerAssists: number;
  careerCleanSheets: number;
  matchesPlayed: number;
  verifiedMatchesCount: number;
  stats: { category: string; value: number };
};

type MeResponse = {
  success: boolean;
  myRank: number | null;
  totalPlayers: number;
  rankMovement: number;
  data: LeaderboardEntry[];
  me: LeaderboardEntry & { rank: number | null };
};

const categories: { id: Category; label: string }[] = [
  { id: "ovr", label: "OVR" },
  { id: "xp", label: "XP" },
  { id: "goals", label: "GOALS" },
  { id: "assists", label: "ASSISTS" },
  { id: "cleanSheets", label: "CLEAN SHEETS" },
];

const timeframes: { id: Timeframe; label: string }[] = [
  { id: "allTime", label: "ALL TIME" },
  { id: "monthly", label: "MONTHLY" },
  { id: "weekly", label: "WEEKLY" },
];

const categoryLabels: Record<Category, string> = {
  ovr: "OVR",
  xp: "XP",
  goals: "GOALS",
  assists: "AST",
  cleanSheets: "CS",
};

export default function LeaderboardsPage() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("ovr");
  const [timeframe, setTimeframe] = useState<Timeframe>("allTime");
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadLeaderboard() {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({ category, timeframe, limit: "50" });
        const [boardRes, meRes] = await Promise.all([
          fetch(`/api/leaderboard?${params.toString()}`, { cache: "no-store" }),
          fetch(`/api/leaderboard/me?${params.toString()}`, { cache: "no-store" }),
        ]);
        const boardJson = await boardRes.json();
        const meJson = await meRes.json();
        if (!boardRes.ok || !boardJson.success) throw new Error("leaderboard");
        if (!cancelled) {
          setPlayers(boardJson.data || []);
          setMe(meRes.ok && meJson.success ? meJson : null);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [category, timeframe]);

  const topThree = players.slice(0, 3);
  const listPlayers = players.slice(3);
  const currentUserId = me?.me?.userId;
  const hasPodium = topThree.length >= 3;

  const podiumSlots = useMemo(() => {
    if (!hasPodium) return [];
    return [topThree[1], topThree[0], topThree[2]];
  }, [hasPodium, topThree]);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#05070B] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(162,139,82,0.26),transparent_42%),linear-gradient(180deg,#11100D_0%,#05070B_54%,#030405_100%)]" />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col pb-[150px]">
        <header className="sticky top-0 z-20 border-b border-[#A28B52]/20 bg-[#05070B]/88 px-5 pb-3 pt-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push("/home")} className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/80">
              <ArrowLeft size={17} />
            </button>
            <div className="text-center">
              <div className="text-[9px] font-black uppercase tracking-[0.32em] text-[#A28B52]">STRYK</div>
              <h1 className="font-display text-2xl font-black italic leading-none tracking-wide text-[#F1E4BA]">RANKS</h1>
            </div>
            <Trophy size={20} className="text-[#D7B764]" />
          </div>

          <div className="mt-5 flex gap-5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {categories.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={cn(
                  "relative shrink-0 pb-2 text-[11px] font-black uppercase tracking-[0.16em] transition",
                  category === tab.id ? "text-[#F1D27A]" : "text-white/42"
                )}
              >
                {tab.label}
                {category === tab.id && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#D7B764]" />}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {timeframes.map((pill) => (
              <button
                key={pill.id}
                onClick={() => setTimeframe(pill.id)}
                className={cn(
                  "h-9 shrink-0 rounded-full border px-4 text-[10px] font-black uppercase tracking-[0.14em] transition",
                  timeframe === pill.id
                    ? "border-[#D7B764] bg-[#D7B764] text-[#151515]"
                    : "border-[#A28B52]/24 bg-white/[0.03] text-white/50"
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <section className="space-y-3 px-5 pt-6">
            <div className="h-48 animate-pulse rounded-[1.5rem] border border-white/5 bg-white/[0.04]" />
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-[1.2rem] border border-white/5 bg-white/[0.035]" />
            ))}
          </section>
        ) : error ? (
          <section className="grid flex-1 place-items-center px-8 text-center">
            <div>
              <Medal className="mx-auto mb-4 text-[#A28B52]" size={34} />
              <p className="text-sm font-black uppercase tracking-[0.16em] text-white/80">Ranks unavailable</p>
              <button onClick={() => window.location.reload()} className="mt-5 h-11 rounded-full bg-[#D7B764] px-6 text-[11px] font-black uppercase tracking-[0.14em] text-[#151515]">
                Retry
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="px-5 pt-6">
              {hasPodium ? (
                <div className="rounded-[1.6rem] border border-[#A28B52]/20 bg-[#151515]/72 px-4 pb-4 pt-5 shadow-[0_18px_50px_rgba(0,0,0,0.34)]">
                  <div className="flex h-56 items-end justify-center gap-2">
                    {podiumSlots.map((player, index) => (
                      <PodiumPlayer
                        key={player.userId}
                        player={player}
                        category={category}
                        featured={index === 1}
                        current={player.userId === currentUserId}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-[#A28B52]/25 bg-white/[0.03] px-6 py-12 text-center">
                  <Trophy className="mx-auto mb-4 text-[#D7B764]/70" size={34} />
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-white/80">Not enough players yet</p>
                  <p className="mt-2 text-xs leading-5 text-white/42">Be the first to climb the ranks.</p>
                </div>
              )}
            </section>

            <section className="mt-5 space-y-2 px-5">
              <div className="px-1 text-[9px] font-black uppercase tracking-[0.25em] text-[#A28B52]">Ranked List</div>
              {listPlayers.length === 0 ? (
                <div className="rounded-[1.2rem] border border-white/5 bg-white/[0.025] py-8 text-center text-xs font-bold text-white/35">
                  No more ranked players for this filter.
                </div>
              ) : (
                listPlayers.map((player) => (
                  <RankRow key={player.userId} player={player} category={category} current={player.userId === currentUserId} />
                ))
              )}
            </section>
          </>
        )}
      </div>

      <MyRankStrip me={me} category={category} />
      <BottomNav active="ranks" onSquad={() => router.push("/home")} />
    </main>
  );
}

function PodiumPlayer({ player, category, featured, current }: { player: LeaderboardEntry; category: Category; featured: boolean; current: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col items-center", featured ? "pb-0" : "pb-4")}>
      {featured && <Crown className="mb-2 text-[#F1D27A] drop-shadow-[0_0_14px_rgba(215,183,100,0.55)]" size={24} />}
      <ShieldAvatar player={player} size={featured ? "large" : "medium"} />
      <div className={cn("mt-3 w-full rounded-t-[1rem] border-x border-t border-[#A28B52]/18 bg-white/[0.04] px-2 text-center", featured ? "h-28 pt-4" : "h-22 pt-3")}>
        <div className={cn("mx-auto mb-2 grid place-items-center rounded-full font-display font-black", featured ? "size-7 bg-[#F1D27A] text-[#151515]" : "size-6 bg-white/10 text-[#F1D27A]")}>
          {player.rank}
        </div>
        <div className={cn("truncate text-xs font-black", current ? "text-[#D4F829]" : "text-white")}>@{player.username}</div>
        <div className="mt-1 text-sm font-black text-[#F1D27A]">
          {player.stats.value} <span className="text-[8px] text-white/35">{categoryLabels[category]}</span>
        </div>
      </div>
    </div>
  );
}

function RankRow({ player, category, current }: { player: LeaderboardEntry; category: Category; current: boolean }) {
  return (
    <div className={cn("flex h-16 items-center gap-3 rounded-[1.15rem] border px-3 transition", current ? "border-[#D4F829]/35 bg-[#D4F829]/10 shadow-[0_0_18px_rgba(212,248,41,0.09)]" : "border-white/6 bg-white/[0.025]")}>
      <div className={cn("w-8 text-left font-display text-sm font-black", current ? "text-[#D4F829]" : "text-white/45")}>#{player.rank}</div>
      <div className={cn(current && "border-l-2 border-[#D4F829] pl-2")} />
      <SmallAvatar player={player} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black text-white">@{player.username}</div>
        <div className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">{player.position || "UNK"} · {player.playStyle || "BALANCED"}</div>
      </div>
      <TierBadge frame={player.cardFrame} />
      <div className="w-16 text-right">
        <div className="font-display text-base font-black text-[#F1D27A]">{player.stats.value}</div>
        <div className="text-[8px] font-black uppercase tracking-[0.16em] text-white/30">{categoryLabels[category]}</div>
      </div>
    </div>
  );
}

function MyRankStrip({ me, category }: { me: MeResponse | null; category: Category }) {
  const movement = me?.rankMovement || 0;
  const ranked = Boolean(me?.myRank && me?.me);
  return (
    <div className="fixed bottom-[80px] left-0 right-0 z-40 mx-auto w-full max-w-md px-4 pb-3">
      <div className="flex h-16 items-center gap-3 rounded-[1.25rem] border border-[#D4F829]/28 bg-[#17200D]/95 px-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {ranked ? (
          <>
            <div className="font-display text-lg font-black text-[#D4F829]">#{me!.myRank}</div>
            <SmallAvatar player={me!.me} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-white">@{me!.me.username}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4F829]/72">Your rank</div>
            </div>
            <div className="text-right">
              <div className="font-display text-base font-black text-[#D4F829]">{me!.me.stats.value}</div>
              <div className="flex items-center justify-end gap-1 text-[10px] font-black text-white/55">
                {movement >= 0 ? <ArrowUp size={11} className="text-[#D4F829]" /> : <ArrowDown size={11} className="text-red-300" />}
                {Math.abs(movement)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="font-display text-sm font-black text-[#D4F829]">UNRANKED</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-white">@{me?.me?.username || "player"}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/52">Play your first verified match to appear on the leaderboard</div>
            </div>
            <div className="text-right text-[10px] font-black text-[#D4F829]">{categoryLabels[category]}</div>
          </>
        )}
      </div>
    </div>
  );
}

function ShieldAvatar({ player, size }: { player: LeaderboardEntry; size: "medium" | "large" }) {
  const frame = frameClasses(player.cardFrame);
  return (
    <div className={cn("relative grid place-items-center", size === "large" ? "size-20" : "size-16")}>
      <div className={cn("absolute inset-0 rotate-45 rounded-[1rem] border", frame.border, frame.bg)} />
      <img
        src={player.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.username)}`}
        alt={player.username}
        className={cn("relative rounded-[0.9rem] object-cover", size === "large" ? "size-16" : "size-12")}
      />
    </div>
  );
}

function SmallAvatar({ player }: { player: LeaderboardEntry }) {
  const frame = frameClasses(player.cardFrame);
  return (
    <img
      src={player.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.username)}`}
      alt={player.username}
      className={cn("size-10 rounded-full border-2 object-cover", frame.border)}
    />
  );
}

function TierBadge({ frame }: { frame: string }) {
  const tier = frame?.toLowerCase() === "gold" ? "G" : frame?.toLowerCase() === "silver" ? "S" : "B";
  const cls = frame?.toLowerCase() === "gold" ? "bg-[#D7B764] text-[#151515]" : frame?.toLowerCase() === "silver" ? "bg-slate-200 text-[#151515]" : "bg-[#9B6746] text-white";
  return <div className={cn("grid size-6 place-items-center rounded-md text-[10px] font-black", cls)}>{tier}</div>;
}

function frameClasses(frame: string) {
  if (frame?.toLowerCase() === "gold") return { border: "border-[#D7B764]", bg: "bg-[#D7B764]/18" };
  if (frame?.toLowerCase() === "silver") return { border: "border-slate-200", bg: "bg-slate-200/14" };
  return { border: "border-[#9B6746]", bg: "bg-[#9B6746]/16" };
}

function BottomNav({ active, onSquad }: { active: "home" | "matches" | "ranks" | "squad" | "profile"; onSquad: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed bottom-0 z-40 flex h-[80px] w-full max-w-md items-center justify-between border-t border-white/10 bg-black/45 px-3 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <NavTab icon={<Home size={20} />} label="HOME" active={active === "home"} onClick={() => router.push("/home")} />
      <NavTab icon={<Globe size={20} />} label="MATCH" active={active === "matches"} onClick={() => router.push("/matches")} />
      <NavTab icon={<Trophy size={20} />} label="RANKS" active={active === "ranks"} onClick={() => router.push("/leaderboards")} />
      <NavTab icon={<Users size={20} />} label="SQUAD" active={active === "squad"} onClick={onSquad} />
      <NavTab icon={<User size={20} />} label="PROFILE" active={active === "profile"} onClick={() => router.push("/settings")} />
    </div>
  );
}

function NavTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative flex h-full w-[56px] flex-col items-center justify-center pt-1">
      {active && <div className="absolute top-0 h-[3px] w-7 rounded-b-full bg-[#D4F829] shadow-[0_0_12px_rgba(212,248,41,0.9)]" />}
      <div className={cn("transition", active ? "text-[#D4F829]" : "text-white/40")}>{icon}</div>
      <span className={cn("mt-1.5 text-[8px] font-black uppercase tracking-[0.12em]", active ? "text-[#D4F829]" : "text-white/40")}>{label}</span>
    </button>
  );
}
