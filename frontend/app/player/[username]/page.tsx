import { notFound } from "next/navigation";
import { PlayerCard } from "@/components/player-card";
import { calculateOvr } from "@/lib/stat-utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { FriendActionButton } from "@/components/friend-action-button";

const BASE_URL_RAW = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const API_BASE_URL = (!BASE_URL_RAW.endsWith("/api/v1") && !BASE_URL_RAW.endsWith("/api/v1/")) 
  ? BASE_URL_RAW.replace(/\/$/, "") + "/api/v1"
  : BASE_URL_RAW;

type Props = {
  params: Promise<{ username: string }>;
};

async function getUserByUsername(username: string) {
  const urls = [
    `${API_BASE_URL}/players/username/${encodeURIComponent(username)}`,
  ];
  
  // If API_BASE_URL has localhost, also try 127.0.0.1 as a fallback due to Windows IPv6 resolution issues in Node.js
  if (API_BASE_URL.includes("localhost")) {
    const ipv4Base = API_BASE_URL.replace("localhost", "127.0.0.1");
    urls.push(`${ipv4Base}/players/username/${encodeURIComponent(username)}`);
  }
  
  // Try search fallback if direct username endpoint fails/isn't found
  urls.push(`${API_BASE_URL}/search?q=${encodeURIComponent(username)}`);
  if (API_BASE_URL.includes("localhost")) {
    const ipv4Base = API_BASE_URL.replace("localhost", "127.0.0.1");
    urls.push(`${ipv4Base}/search?q=${encodeURIComponent(username)}`);
  }

  for (const url of urls) {
    try {
      console.log(`[STRYK Profile] Fetching player profile from: ${url}`);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        console.warn(`[STRYK Profile] Fetch to ${url} failed with status: ${res.status}`);
        continue;
      }
      const data = await res.json();
      
      // If the URL was a search endpoint, it returns an array
      if (Array.isArray(data)) {
        const matched = data.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
        if (matched) {
          console.log(`[STRYK Profile] Successfully found player via search fallback at: ${url}`);
          return matched;
        }
      } else if (data && data.username) {
        // Direct player object
        console.log(`[STRYK Profile] Successfully fetched player via direct endpoint at: ${url}`);
        return data;
      }
    } catch (e) {
      console.error(`[STRYK Profile] Error fetching from ${url}:`, e);
    }
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username).toLowerCase();

  const user = await getUserByUsername(username);

  if (!user) {
    return { title: "Player Not Found | STRYK" };
  }

  return {
    title: `${user.fullName || user.username}'s STRYK Card`,
    description: `Check out ${user.fullName || user.username}'s football identity on STRYK!`};
}

export default async function PublicPlayerPage({ params }: Props) {
  // Determine Friend Status securely at the top to avoid Next.js context loss
  const { userId: clerkId, getToken } = await auth();

  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username).toLowerCase();

  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  // Format data for PlayerCard
  const playerData = {
    id: user.id as any,
    fullName: user.fullName || "PLAYER NAME",
    username: user.username,
    avatar: user.avatarUrl || "",
    position: user.position || "CAM",
    secondaryPosition: "",
    strongFoot: (user.strongFoot as any) || "Left",
    playStyle: (user.playStyle as any) || "Playmaker",
    bio: user.bio || "",
    matchesPlayed: user.matchesPlayed ?? 0,
    wins: user.wins ?? 0,
    draws: user.draws ?? 0,
    losses: user.losses ?? 0,
    goals: user.goals ?? 0,
    assists: user.assists ?? 0,
    tackles: user.tackles ?? 0,
    saves: user.saves ?? 0,
    intercepts: user.intercepts ?? 0,
    rating: user.overall ?? 50};

  playerData.rating = calculateOvr(playerData as any);

  const wins = playerData.wins;
  const draws = playerData.draws;
  const losses = playerData.losses;
  const totalMatches = wins + draws + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const winPercent = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const drawPercent = totalMatches > 0 ? (draws / totalMatches) * 100 : 0;
  const lossPercent = totalMatches > 0 ? (losses / totalMatches) * 100 : 0;

  // Friend Status fetch
  let viewerUserId: string | null = null;
  let friendStatus: "none" | "pending_sent" | "pending_received" | "accepted" = "none";
  let friendRequestId: string | undefined = undefined;

  if (clerkId) {
    try {
      const token = await getToken();
      viewerUserId = clerkId; // We don't have the db id easily, but viewerUserId just needs to be truthy to show the button
      const statusRes = await fetch(`${API_BASE_URL}/friends/status/${user.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: "no-store"
      });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        friendStatus = statusData.status || "none";
        friendRequestId = statusData.requestId;
      }
    } catch (e) {
      console.error("[STRYK Profile] Failed to fetch friend status", e);
    }
  }

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      {/* Ambient bg */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(60% 50% at 50% 25%, rgba(198,255,0,0.18) 0%, transparent 60%), #05070B"}}
      />

      <div className="relative h-full flex flex-col px-5 pt-6 pb-5 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition">
             <Link href="/" className="flex items-center justify-center w-full h-full"><ArrowLeft size={16} /></Link>
          </button>
          <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 font-bold">Public Card</div>
          <div className="w-9 h-9" /> {/* Placeholder for balance */}
        </div>

        {/* Card Display Area */}
        <div className="flex-1 flex items-center justify-center py-6 mt-10">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-52 h-6 rounded-[50%] blur-2xl pointer-events-none"
              style={{ background: "rgba(198,255,0,0.4)" }}
            />
            <div className="scale-[0.95] sm:scale-100">
              <PlayerCard player={playerData as any} size="lg" />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center px-4">
            <div className="text-xl font-display uppercase tracking-wide">{playerData.fullName}</div>
            <div className="text-sm text-[#C6FF00] font-bold mt-1">@{playerData.username}</div>
            <div className="text-sm text-white/50 mt-4 leading-relaxed bg-white/5 rounded-xl p-4 border border-white/10 text-left">
               <div className="text-center pb-2 border-b border-white/5 font-semibold text-xs tracking-wider">
                 <span className="text-white/80 font-bold">{playerData.position}</span> • {playerData.playStyle} • {playerData.rating} OVR
               </div>
               
               {/* Match History Widget */}
               <div className="mt-3">
                 <div className="flex justify-between text-[9px] uppercase tracking-widest text-white/45 font-bold mb-1">
                   <span>Match History</span>
                   <span>{totalMatches} Matches</span>
                 </div>
                 
                 <div className="flex items-center gap-4 mt-2">
                   <div className="flex-1">
                     <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                       <span className="text-[#C6FF00]">{wins} W</span>
                       <span className="text-white/60">{draws} D</span>
                       <span className="text-red-400">{losses} L</span>
                     </div>
                     <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden flex">
                       <div style={{ width: `${winPercent}%` }} className="h-full bg-[#C6FF00]" />
                       <div style={{ width: `${drawPercent}%` }} className="h-full bg-white/20" />
                       <div style={{ width: `${lossPercent}%` }} className="h-full bg-red-500/60" />
                     </div>
                   </div>
                   <div className="shrink-0 text-center bg-white/[0.02] border border-white/5 rounded-lg px-2 py-1 min-w-[3.5rem]">
                     <div className="text-[7px] uppercase tracking-widest text-white/40 font-bold">Win Rate</div>
                     <div className="font-display text-xs text-white font-extrabold mt-0.5">{winRate}%</div>
                   </div>
                 </div>
               </div>
            </div>
        </div>

        <div className="mt-8 block pb-8">
          {viewerUserId && viewerUserId !== user.id ? (
            <FriendActionButton targetUserId={user.id} initialStatus={friendStatus} requestId={friendRequestId} />
          ) : !viewerUserId ? (
            <Link
              href="/identity"
              className="w-full flex items-center justify-center rounded-2xl py-3.5 bg-[#C6FF00] text-black font-display tracking-[0.2em] cursor-pointer hover:bg-[#b0e600] transition duration-200 text-sm shadow-[0_20px_40px_-10px_rgba(198,255,0,0.55),inset_0_1px_0_rgba(255,255,255,0.4)]"
            >
              CREATE YOUR OWN CARD
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
