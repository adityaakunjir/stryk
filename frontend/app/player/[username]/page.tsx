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
    <main className="stryk-mobile-shell text-white bg-[#0A0A0A] min-h-screen relative overflow-hidden">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 z-0">
        <img src="/create_card_bg.webp" alt="Background" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[20px]" />
      </div>

      <div className="relative h-full flex flex-col px-6 pt-8 pb-5 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition backdrop-blur-md shadow-sm">
             <Link href="/" className="flex items-center justify-center w-full h-full"><ArrowLeft size={18} /></Link>
          </button>
          <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 font-bold drop-shadow-md">STRYK PROFILE</div>
          <div className="w-10 h-10" /> {/* Placeholder for balance */}
        </div>

        {/* Card Display Area */}
        <div className="flex-1 flex items-center justify-center py-2 relative z-20">
          <div className="relative w-[75%] max-w-[320px] flex items-center justify-center">
            {/* Glowing pedestal shadow under the card */}
            <div
              aria-hidden
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%] h-12 rounded-[50%] blur-2xl pointer-events-none"
              style={{ background: "rgba(195,223,27,0.35)" }}
            />
            <PlayerCard player={playerData as any} size="lg" />
          </div>
        </div>

        <div className="mt-8 text-center px-2 relative z-30 flex flex-col items-center">
            <h1 className="text-3xl font-display uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#E8D196] via-[#F5E4B4] to-[#E8D196] drop-shadow-md mb-2">
              {playerData.fullName}
            </h1>
            <div className="bg-[#C3DF1B]/10 border border-[#C3DF1B]/30 px-4 py-1.5 rounded-full inline-flex mb-6 shadow-[0_0_15px_rgba(195,223,27,0.15)]">
              <span className="text-[11px] text-[#C3DF1B] font-bold tracking-widest uppercase">@{playerData.username}</span>
            </div>
            
            {/* Premium Stats Glass Box */}
            <div className="w-full bg-white/[0.03] backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col text-left relative overflow-hidden">
               {/* Subtle top shine */}
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
               
               <div className="text-center pb-4 border-b border-white/10 font-semibold text-xs tracking-[0.2em] uppercase text-white/60">
                 <span className="text-white drop-shadow-md font-extrabold">{playerData.position}</span> 
                 <span className="mx-2 text-[#E8D196] opacity-50">•</span> 
                 <span className="text-white/90">{playerData.playStyle}</span> 
                 <span className="mx-2 text-[#E8D196] opacity-50">•</span> 
                 <span className="text-[#C3DF1B] font-bold drop-shadow-[0_0_8px_rgba(195,223,27,0.4)]">{playerData.rating} OVR</span>
               </div>
               
               {/* Match History Widget */}
               <div className="mt-4">
                 <div className="flex justify-between text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold mb-2">
                   <span>Match History</span>
                   <span className="text-[#E8D196]/80">{totalMatches} Matches</span>
                 </div>
                 
                 <div className="flex items-center gap-4 mt-3">
                   <div className="flex-1">
                     <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                       <span className="text-[#C3DF1B] drop-shadow-sm">{wins} W</span>
                       <span className="text-white/60">{draws} D</span>
                       <span className="text-red-400 drop-shadow-sm">{losses} L</span>
                     </div>
                     <div className="w-full h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden flex shadow-inner">
                       <div style={{ width: `${winPercent}%` }} className="h-full bg-[#C3DF1B] shadow-[0_0_10px_rgba(195,223,27,0.5)]" />
                       <div style={{ width: `${drawPercent}%` }} className="h-full bg-white/20" />
                       <div style={{ width: `${lossPercent}%` }} className="h-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                     </div>
                   </div>
                   <div className="shrink-0 text-center bg-black/40 border border-white/10 rounded-xl px-3 py-2 min-w-[4rem] shadow-lg">
                     <div className="text-[7px] uppercase tracking-widest text-[#E8D196]/60 font-bold">Win Rate</div>
                     <div className="font-display text-sm text-white font-extrabold mt-1">{winRate}%</div>
                   </div>
                 </div>
               </div>
            </div>
        </div>

        <div className="mt-6 block pb-10 relative z-30">
          {viewerUserId && viewerUserId !== user.id ? (
            <FriendActionButton targetUserId={user.id} initialStatus={friendStatus} requestId={friendRequestId} />
          ) : !viewerUserId ? (
            <Link
              href="/identity"
              className="w-full flex items-center justify-center rounded-2xl py-4 bg-[#C3DF1B] text-black font-display tracking-[0.2em] font-bold cursor-pointer hover:bg-[#b0c918] transition duration-200 text-xs shadow-[0_15px_30px_-10px_rgba(195,223,27,0.5),inset_0_1px_0_rgba(255,255,255,0.5)] active:scale-95"
            >
              CREATE YOUR OWN CARD
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
