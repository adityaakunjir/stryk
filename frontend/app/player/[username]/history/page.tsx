import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Award, Shield, Target } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL_RAW = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const API_BASE_URL = (!BASE_URL_RAW.endsWith("/api/v1") && !BASE_URL_RAW.endsWith("/api/v1/")) 
  ? BASE_URL_RAW.replace(/\/$/, "") + "/api/v1"
  : BASE_URL_RAW;

type Props = {
  params: Promise<{ username: string }>;
};

async function getPlayerHistory(username: string) {
  let url = `${API_BASE_URL}/players/username/${encodeURIComponent(username)}/history`;
  if (API_BASE_URL.includes("localhost")) {
    url = url.replace("localhost", "127.0.0.1");
  }
  
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error("Error fetching match history:", e);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username).toLowerCase();
  return {
    title: `${username}'s Match History | STRYK`,
    description: `View ${username}'s historical match results and performances.`
  };
}

export default async function MatchHistoryPage({ params }: Props) {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username).toLowerCase();

  const history = await getPlayerHistory(username);

  if (!history) {
    notFound();
  }

  return (
    <main className="stryk-mobile-shell bg-[#05070B] text-white min-h-screen relative overflow-hidden">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
        
      />
      <div className="absolute inset-0 bg-[#0a0a0a]/90 z-0" />

      <div className="relative h-full flex flex-col px-6 pt-8 pb-5 max-w-md mx-auto z-10 overflow-y-auto custom-scrollbar w-full min-h-0">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 z-30 shrink-0">
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition backdrop-blur-md shadow-sm">
             <Link href={`/player/${username}`} className="flex items-center justify-center w-full h-full">
               <ArrowLeft size={18} />
             </Link>
          </button>
          <div className="text-[10px] tracking-[0.35em] uppercase text-white/50 font-bold drop-shadow-md">MATCH HISTORY</div>
          <div className="w-10 h-10" />
        </div>

        {/* Title */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl uppercase italic text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            Timeline
          </h1>
          <p className="text-[#C6FF00] font-bold text-xs uppercase tracking-[0.2em] mt-2">
            @{username}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative pl-6 pb-20">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-gradient-to-b from-[#C6FF00]/50 via-white/10 to-transparent z-0" />

          {history.length === 0 ? (
            <div className="text-center py-12 text-white/40 italic uppercase tracking-widest text-sm">
              No verified matches yet
            </div>
          ) : (
            <div className="space-y-10">
              {history.map((match: any, index: number) => {
                const date = new Date(match.matchDate);
                const isWin = match.outcome === "Win";
                const isLoss = match.outcome === "Loss";
                const isDraw = match.outcome === "Draw";

                return (
                  <div key={match.matchId} className="relative z-10 pl-6">
                    {/* Timeline Node */}
                    <div className={`absolute left-[-21px] top-4 w-4 h-4 rounded-full border-2 bg-[#0a0a0a] z-20 ${isWin ? 'border-[#C6FF00] shadow-[0_0_10px_#C6FF00]' : isLoss ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-white/50'}`} />

                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                      {/* Subtle outcome gradient glow */}
                      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none translate-x-1/2 -translate-y-1/2 ${isWin ? 'bg-[#C6FF00]' : isLoss ? 'bg-red-500' : 'bg-white'}`} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-white font-bold text-lg leading-tight uppercase tracking-wide">{match.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-white/40 text-[10px] uppercase tracking-widest font-bold">
                            <Clock size={10} />
                            <span>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="mx-1">•</span>
                            <span>{match.format}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className={`font-display text-xl uppercase italic ${isWin ? 'text-[#C6FF00]' : isLoss ? 'text-red-400' : 'text-white/60'}`}>
                            {match.outcome}
                          </span>
                          {match.teamAScore !== null && match.teamBScore !== null && (
                            <span className="text-xs text-white/60 font-bold font-mono tracking-widest mt-0.5">
                              {match.teamAScore} - {match.teamBScore}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-center">
                          <span className="text-lg font-display text-white">{match.stats.goals}</span>
                          <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest mt-0.5">GLS</span>
                        </div>
                        <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-center">
                          <span className="text-lg font-display text-white">{match.stats.assists}</span>
                          <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest mt-0.5">AST</span>
                        </div>
                        <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-center">
                          <span className="text-lg font-display text-white">{match.stats.tackles}</span>
                          <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest mt-0.5">TKL</span>
                        </div>
                        <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-center">
                          <span className="text-lg font-display text-white">{match.stats.saves}</span>
                          <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest mt-0.5">SAV</span>
                        </div>
                      </div>

                      {/* Accolades & XP */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-1">
                        <div className="flex gap-2">
                          {match.stats.motm && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#A28B52]/10 border border-[#A28B52]/30 text-[#A28B52] shadow-[0_0_10px_rgba(162,139,82,0.1)]">
                              <Award size={12} />
                              <span className="text-[8px] font-bold uppercase tracking-widest">MOTM</span>
                            </div>
                          )}
                          {match.stats.cleanSheet && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                              <Shield size={12} />
                              <span className="text-[8px] font-bold uppercase tracking-widest">Clean Sheet</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-[#C6FF00] font-bold">
                          <span className="text-[10px] uppercase tracking-widest opacity-80">+</span>
                          <span className="font-display text-xl leading-none italic">{match.xpGained}</span>
                          <span className="text-[10px] uppercase tracking-widest opacity-80 ml-0.5">XP</span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
