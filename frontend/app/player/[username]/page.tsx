import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlayerCard } from "@/components/player-card";
import { calculateOvr } from "@/lib/stat-utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username).toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return { title: "Player Not Found | STRYK" };
  }

  return {
    title: `${user.fullName || user.username}'s STRYK Card`,
    description: `Check out ${user.fullName || user.username}'s football identity on STRYK!`,
  };
}

export default async function PublicPlayerPage({ params }: Props) {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username).toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username },
  });

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
    matchesPlayed: user.matchesPlayed || 0,
    goals: user.goals || 0,
    assists: user.assists || 0,
    tackles: user.tackles || 0,
    saves: user.saves || 0,
    intercepts: user.intercepts || 0,
    rating: user.overall || 60,
  };

  playerData.rating = calculateOvr(playerData as any);

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      {/* Ambient bg */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(60% 50% at 50% 25%, rgba(198,255,0,0.18) 0%, transparent 60%), #05070B",
        }}
      />

      <div className="relative h-full flex flex-col px-5 pt-6 pb-5 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition">
            <ArrowLeft size={16} />
          </Link>
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
            <div className="text-sm text-white/50 mt-4 leading-relaxed bg-white/5 rounded-xl p-4 border border-white/10">
               <span className="text-white/80 font-bold">{playerData.position}</span> • {playerData.playStyle} • {playerData.rating} OVR
               <br/>
               <span className="text-xs uppercase tracking-wider block mt-2 text-white/30">Matches Played: {playerData.matchesPlayed}</span>
            </div>
        </div>

        <div className="mt-8 block pb-8">
          <Link
            href="/identity"
            className="w-full flex items-center justify-center rounded-2xl py-3.5 bg-[#C6FF00] text-black font-display tracking-[0.2em] cursor-pointer hover:bg-[#b0e600] transition duration-200 text-sm shadow-[0_20px_40px_-10px_rgba(198,255,0,0.55),inset_0_1px_0_rgba(255,255,255,0.4)]"
          >
            CREATE YOUR OWN CARD
          </Link>
        </div>
      </div>
    </main>
  );
}
