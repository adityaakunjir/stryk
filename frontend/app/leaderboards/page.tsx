"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Trophy, Medal, Star, Users } from "lucide-react";
import Link from "next/link";
import { usePlayer } from "@/components/player-context";

type LeaderboardPlayer = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  overall: number;
  position: string;
  playStyle: string;
};

type LeaderboardTeam = {
  id: string;
  name: string;
  logoUrl: string;
  wins: number;
  draws: number;
  losses: number;
};

type LeaderboardData = {
  CAM: LeaderboardPlayer[];
  ST: LeaderboardPlayer[];
  GK: LeaderboardPlayer[];
  Teams: LeaderboardTeam[];
};

type Category = "CAM" | "ST" | "GK" | "Teams";

export default function LeaderboardsPage() {
  const { playerData } = usePlayer();
  const [activeTab, setActiveTab] = useState<Category>("CAM");
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        const res = await fetch("/api/leaderboards");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, []);

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden glass-panel text-white flex items-center justify-center">
        <Loader2 className="size-10 text-[#C6FF00] animate-spin" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="stryk-mobile-shell text-white glass-panel min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center text-center px-6">
          <Trophy size={32} className="text-white/20 mb-4" />
          <div className="text-sm font-bold uppercase tracking-wider text-white/70">Failed to load leaderboards</div>
          <p className="text-xs text-white/40 mt-1">Please check your connection and try again.</p>
          <button
            onClick={() => { setError(false); setLoading(true); window.location.reload(); }}
            className="mt-6 h-10 px-6 rounded-xl bg-[#C6FF00] text-white text-xs font-display tracking-widest uppercase cursor-pointer hover:bg-[#b0e600] transition"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const currentTabItems = data ? data[activeTab] : [];
  // Podium items (indices 0, 1, 2) mapped to Rank 1, 2, 3
  const rank1 = currentTabItems[0] || null;
  const rank2 = currentTabItems[1] || null;
  const rank3 = currentTabItems[2] || null;

  // Remaining list items (ranks 4-10)
  const listItems = currentTabItems.slice(3);

  const tabs: { id: Category; label: string }[] = [
    { id: "CAM", label: "Top CAM" },
    { id: "ST", label: "Top ST" },
    { id: "GK", label: "Top GK" },
    { id: "Teams", label: "Top Teams" },
  ];

  return (
    <main className="stryk-mobile-shell text-white glass-panel min-h-screen">
      {/* Ambient backgrounds */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 45% at 50% 12%, rgba(198,255,0,0.12) 0%, transparent 60%), radial-gradient(60% 40% at 50% 100%, rgba(91,140,255,0.06) 0%, transparent 65%), #05070B"}}
      />

      <div data-scroll-panel className="relative h-full flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/home" className="w-9 h-9 rounded-full glass-panel text-white flex items-center justify-center cursor-pointer hover:glass-panel0 transition">
            <ArrowLeft size={16} />
          </Link>
          <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 font-bold">Leaderboards</div>
          <Trophy size={16} className="text-[#C6FF00]" />
        </div>

        {/* Title */}
        <div className="mt-4 text-center">
          <h1 className="font-display text-3xl uppercase italic leading-none tracking-wide text-white">
            STRYK <span className="text-[#C6FF00]">TOP RANKS</span>
          </h1>
          <p className="mt-1 text-xs text-white/45">
            The elite players and clubs in the network.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="mt-5 grid grid-cols-4 gap-1 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#C6FF00] text-white shadow-[0_0_15px_rgba(198,255,0,0.3)]"
                  : "text-white/60 hover:text-white hover:glass-panel"
              }`}
            >
              {tab.id === "GK" ? "GK" : tab.id}
            </button>
          ))}
        </div>

        {/* Podium Area */}
        <div className="mt-6 rounded-3xl border border-white/5 glass-panel p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#C6FF00]/[0.02] to-transparent pointer-events-none" />
          <div className="flex items-end justify-center gap-3 h-52 pb-2 relative z-10">
            {/* RANK 2 (Left) */}
            {rank2 && (
              <PodiumSlot
                item={rank2}
                rank={2}
                color="border-slate-400/30 text-slate-350"
                heightClass="h-28"
                badgeColor="bg-slate-400 text-white border-slate-300"
                glowColor="rgba(148, 163, 184, 0.15)"
                currentUser={playerData.username === (rank2 as any).username}
              />
            )}

            {/* RANK 1 (Center - Taller) */}
            {rank1 && (
              <PodiumSlot
                item={rank1}
                rank={1}
                color="border-[#C6FF00]/40 text-[#C6FF00]"
                heightClass="h-36"
                badgeColor="bg-[#C6FF00] text-white border-white"
                glowColor="rgba(198, 255, 0, 0.35)"
                pulse
                currentUser={playerData.username === (rank1 as any).username}
              />
            )}

            {/* RANK 3 (Right) */}
            {rank3 && (
              <PodiumSlot
                item={rank3}
                rank={3}
                color="border-amber-700/30 text-amber-600"
                heightClass="h-24"
                badgeColor="bg-amber-700 text-white border-amber-600"
                glowColor="rgba(180, 83, 9, 0.15)"
                currentUser={playerData.username === (rank3 as any).username}
              />
            )}
          </div>
        </div>

        {/* List Rankings (Ranks 4-10) */}
        <div className="mt-4 space-y-2 flex-1 min-h-0">
          <div className="text-[9px] tracking-[0.2em] uppercase text-white/35 font-bold mb-1 px-1">Global Rankings</div>
          {listItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-white/30 font-medium border border-dashed border-white/5 rounded-2xl bg-white/[0.005]">
              No more ranks registered in this category.
            </div>
          ) : (
            listItems.map((item, idx) => {
              const rank = idx + 4;
              const isUser = playerData.username === (item as any).username;
              const isTeam = activeTab === "Teams";
              
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-2xl p-3 border transition duration-200 ${
                    isUser
                      ? "border-[#C6FF00]/30 bg-[#C6FF00]/5 shadow-[0_0_12px_rgba(198,255,0,0.05)]"
                      : "border-white/5 bg-white/[0.01] hover:border-white/10"
                  }`}
                >
                  {/* Rank Number */}
                  <span className="w-5 text-center font-display text-xs text-white/40 font-bold">#{rank}</span>

                  {/* Avatar / Logo */}
                  <div className="relative size-9 rounded-full overflow-hidden border border-white/10 glass-panel shrink-0 flex items-center justify-center">
                    {isTeam ? (
                      (item as LeaderboardTeam).logoUrl ? (
                        <img src={(item as LeaderboardTeam).logoUrl} alt={(item as LeaderboardTeam).name} className="w-full h-full object-cover" />
                      ) : (
                        <Users size={16} className="text-[#C6FF00]" />
                      )
                    ) : (
                      (item as LeaderboardPlayer).avatarUrl ? (
                        <img src={(item as LeaderboardPlayer).avatarUrl} alt={(item as LeaderboardPlayer).username} className="w-full h-full object-cover" />
                      ) : (
                        <Medal size={16} className="text-white/20" />
                      )
                    )}
                  </div>

                  {/* Name Info */}
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-white truncate">
                      {isTeam ? (item as LeaderboardTeam).name : (item as LeaderboardPlayer).fullName}
                    </span>
                    <span className="block text-[9px] text-white/45 uppercase font-medium mt-0.5 tracking-wider truncate">
                      {isTeam ? (
                        <>Record: {(item as LeaderboardTeam).wins}W - {(item as LeaderboardTeam).draws}D - {(item as LeaderboardTeam).losses}L</>
                      ) : (
                        <>@{(item as LeaderboardPlayer).username} • {(item as LeaderboardPlayer).playStyle}</>
                      )}
                    </span>
                  </div>

                  {/* Overall / Win Ratio */}
                  <div className="shrink-0 text-right px-1">
                    {isTeam ? (
                      <>
                        <span className="block text-[8px] uppercase tracking-widest text-white/35 font-bold">Points</span>
                        <span className="font-display text-xs text-white font-extrabold">
                          {(item as LeaderboardTeam).wins * 3 + (item as LeaderboardTeam).draws}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="block text-[8px] uppercase tracking-widest text-white/35 font-bold">OVR</span>
                        <span className="font-display text-xs text-[#C6FF00] font-extrabold">
                          {(item as LeaderboardPlayer).overall}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

interface PodiumSlotProps {
  item: LeaderboardPlayer | LeaderboardTeam;
  rank: number;
  color: string;
  heightClass: string;
  badgeColor: string;
  glowColor: string;
  pulse?: boolean;
  currentUser?: boolean;
}

function PodiumSlot({
  item,
  rank,
  color,
  heightClass,
  badgeColor,
  glowColor,
  pulse = false,
  currentUser = false}: PodiumSlotProps) {
  const isTeam = "wins" in item;

  return (
    <div className="flex-1 flex flex-col items-center justify-end min-w-0">
      {/* Avatar Display */}
      <div className="relative mb-3 flex flex-col items-center">
        {/* Glow */}
        <div
          className="absolute inset-0 size-14 rounded-full blur-md opacity-60 pointer-events-none scale-110"
          style={{ background: glowColor }}
        />
        
        <div
          className={`relative size-14 rounded-full overflow-hidden border glass-panel flex items-center justify-center ${color} ${
            pulse ? "animate-[pulse_2s_infinite]" : ""
          } ${currentUser ? "shadow-[0_0_15px_rgba(198,255,0,0.2)]" : ""}`}
        >
          {isTeam ? (
            (item as LeaderboardTeam).logoUrl ? (
              <img src={(item as LeaderboardTeam).logoUrl} alt={(item as LeaderboardTeam).name} className="w-full h-full object-cover" />
            ) : (
              <Users size={20} className="text-[#C6FF00]" />
            )
          ) : (
            (item as LeaderboardPlayer).avatarUrl ? (
              <img src={(item as LeaderboardPlayer).avatarUrl} alt={(item as LeaderboardPlayer).username} className="w-full h-full object-cover" />
            ) : (
              <Star size={20} className="text-white/20" />
            )
          )}
        </div>

        {/* Rank Badge */}
        <div
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest shrink-0 shadow-lg ${badgeColor}`}
        >
          #{rank}
        </div>
      </div>

      {/* Podium block */}
      <div
        className={`w-full ${heightClass} rounded-t-xl bg-white/[0.02] border-t border-x border-white/5 flex flex-col items-center justify-start p-2.5 text-center min-w-0`}
      >
        <span className="block text-[10px] font-bold text-white truncate w-full">
          {isTeam ? (item as LeaderboardTeam).name : (item as LeaderboardPlayer).fullName}
        </span>
        <span className="block text-[8px] text-white/40 uppercase font-black tracking-wider mt-0.5 truncate w-full">
          {isTeam ? (
            <>{(item as LeaderboardTeam).wins} Wins</>
          ) : (
            <>@{(item as LeaderboardPlayer).username}</>
          )}
        </span>
        
        {/* Metric */}
        <div className="mt-2.5 pt-1.5 border-t border-white/5 w-full">
          {isTeam ? (
            <>
              <span className="block text-[6px] uppercase tracking-widest text-white/35 font-bold">Points</span>
              <span className="font-display text-xs text-white font-extrabold">
                {(item as LeaderboardTeam).wins * 3 + (item as LeaderboardTeam).draws}
              </span>
            </>
          ) : (
            <>
              <span className="block text-[6px] uppercase tracking-widest text-white/35 font-bold">OVR</span>
              <span className="font-display text-xs text-[#C6FF00] font-extrabold">
                {(item as LeaderboardPlayer).overall}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
