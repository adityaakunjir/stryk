import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, ShieldCheck, User, Trophy, XCircle, MinusCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const team = await prisma.team.findUnique({
    where: { id }});

  if (!team) {
    return { title: "Team Not Found | STRYK" };
  }

  return {
    title: `${team.name} | STRYK Team Profile`,
    description: `Check out ${team.name}'s squad, roster, and match statistics on STRYK!`};
}

export default async function TeamProfilePage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: true}}}});

  if (!team) {
    notFound();
  }

  const members = team.members || [];
  const captainMember = members.find((m: any) => m.role === "captain");
  const playersList = members.filter((m: any) => m.role !== "captain");

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      {/* Ambient background glow */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(60% 50% at 50% 25%, rgba(198,255,0,0.15) 0%, transparent 60%), #05070B"}}
      />

      <div className="relative h-full flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto z-10 w-full overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link 
            href="/home" 
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Team Profile</div>
          <div className="w-9 h-9" /> {/* Spacer */}
        </header>

        {/* Team Logo and Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-3xl bg-[#0A0E17] border border-white/10 flex items-center justify-center shadow-2xl shadow-[#C6FF00]/10 relative overflow-hidden mb-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#C6FF00]/15 to-transparent pointer-events-none" />
            {team.logoUrl ? (
               
              <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <ShieldCheck size={44} className="text-[#C6FF00]/80" />
            )}
          </div>
          <h1 className="font-display text-4xl uppercase tracking-wider text-center">{team.name}</h1>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold mt-1.5">
            EST. 2026
          </p>
        </div>

        {/* Stats Section */}
        <section className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-[#C6FF00] mb-1">
              <Trophy size={13} />
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Wins</span>
            </div>
            <span className="font-display text-2xl font-bold text-white">{team.wins}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-red-400 mb-1">
              <XCircle size={13} />
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Losses</span>
            </div>
            <span className="font-display text-2xl font-bold text-white">{team.losses}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-white/50 mb-1">
              <MinusCircle size={13} />
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Draws</span>
            </div>
            <span className="font-display text-2xl font-bold text-white">{team.draws}</span>
          </div>
        </section>

        {/* Roster Section */}
        <section className="space-y-6">
          {/* Captain */}
          {captainMember && (
            <div>
              <h2 className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-bold mb-3 pl-1">Captain</h2>
              <Link 
                href={`/player/${captainMember.user.username}`}
                className="p-3.5 rounded-2xl border border-[#C6FF00]/30 bg-[#C6FF00]/5 flex items-center gap-4 hover:bg-[#C6FF00]/8 transition duration-200 block cursor-pointer"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="relative size-12 rounded-full overflow-hidden border border-[#C6FF00]/40 bg-[#0B1020] shrink-0 flex items-center justify-center">
                    {captainMember.user.avatarUrl ? (
                       
                      <img src={captainMember.user.avatarUrl} alt={captainMember.user.fullName || captainMember.user.username} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-[#C6FF00]/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{captainMember.user.fullName || captainMember.user.username}</div>
                    <div className="text-[10px] text-[#C6FF00] uppercase tracking-wider mt-0.5 font-semibold">@{captainMember.user.username}</div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end px-2">
                    <span className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">OVR</span>
                    <span className="font-display text-lg text-white font-bold">{captainMember.user.overall}</span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Members */}
          <div>
            <h2 className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-bold mb-3 pl-1">Players</h2>
            <div className="space-y-2">
              {playersList.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] text-center text-[10px] uppercase tracking-wider text-white/30 font-bold">
                  No other squad members
                </div>
              ) : (
                playersList.map((member: any) => (
                  <Link 
                    key={member.id}
                    href={`/player/${member.user.username}`}
                    className="p-3 rounded-2xl border border-white/8 bg-white/[0.02] flex items-center gap-4 hover:border-white/20 hover:bg-white/[0.04] transition duration-200 block cursor-pointer"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="relative size-10 rounded-full overflow-hidden border border-white/10 bg-[#0B1020] shrink-0 flex items-center justify-center">
                        {member.user.avatarUrl ? (
                           
                          <img src={member.user.avatarUrl} alt={member.user.fullName || member.user.username} className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} className="text-white/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{member.user.fullName || member.user.username}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 font-medium">@{member.user.username}</div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end px-2">
                        <span className="font-display text-sm text-white/80 font-bold">{member.user.overall}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
