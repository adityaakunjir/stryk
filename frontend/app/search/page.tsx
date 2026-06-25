"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Loader2, ChevronDown, User, Activity, Shirt } from "lucide-react";
import { usePlayer } from "@/components/player-context";
import { calculateOvr } from "@/lib/stat-utils";
import Image from "next/image";

type SearchResult = {
  id: string;
  fullName: string | null;
  username: string;
  avatarUrl: string | null;
  position: string | null;
  playStyle: string | null;
  overall: number;
};

export default function SearchPage() {
  const router = useRouter();
  const { playerData } = usePlayer();
  
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("");
  const [playStyle, setPlayStyle] = useState("");
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const handleSearch = useCallback(async () => {
    // Need at least one filter
    if (!query && !position && !playStyle) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchError(false);
    
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (position) params.append("pos", position);
      if (playStyle) params.append("style", playStyle);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        let finalData = data;
        if (playerData?.username) {
          finalData = data.filter((p: any) => p.username?.toLowerCase() !== playerData.username?.toLowerCase());
        }
        setResults(finalData);
      } else {
        setResults([]);
      }
    } catch {
      setSearchError(true);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, position, playStyle, playerData?.username]);

  // Debounce search when typing query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query || position || playStyle) {
        handleSearch();
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [query, position, playStyle, handleSearch]);

  const activeFiltersCount = [query, position, playStyle].filter(Boolean).length;

  return (
    <main className="stryk-mobile-shell bg-[#E5DCC5] min-h-[100dvh] text-[#151515]">
      {/* Premium Marble Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/create_card_bg.webp')" }}
      />

      <div className="relative h-full flex flex-col px-5 pt-3 pb-5 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-1 relative z-20">
          <button 
            onClick={() => router.push("/home")} 
            className="w-10 h-10 rounded-full bg-[#151515]/5 border border-[#151515]/10 text-[#151515] flex items-center justify-center cursor-pointer hover:bg-[#151515]/10 transition backdrop-blur-md shadow-sm relative z-10"
            aria-label="Back"
            type="button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Title */}
        <h1 className="font-display text-[2.5rem] font-black italic uppercase tracking-tight text-[#151515] drop-shadow-sm leading-none text-center mb-4 mt-2 relative z-10">
          PLAYER SEARCH
        </h1>

        <div className="space-y-3 mb-4">
          {/* Main Search Input */}
          <div className="relative shadow-[0_8px_30px_rgba(0,0,0,0.15)] rounded-full group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search size={20} className="text-[#D4F829] opacity-70 group-focus-within:opacity-100 transition-opacity" />
            </div>
            <input
              type="text"
              placeholder="Search by name or @username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-[52px] pl-12 pr-5 rounded-full border border-[#151515]/10 bg-[#151515] text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4F829] focus:ring-1 focus:ring-[#D4F829]/50 transition duration-300 shadow-inner"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative shadow-[0_8px_30px_rgba(0,0,0,0.15)] rounded-2xl group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Activity size={16} className="text-[#D4F829] opacity-70 group-focus-within:opacity-100 transition-opacity" />
              </div>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-2xl border border-[#151515]/10 bg-[#151515] text-[11px] font-bold tracking-wider text-white uppercase appearance-none outline-none focus:border-[#D4F829] transition"
              >
                <option value="">ANY POSITION</option>
                <option value="ST">STRIKER (ST)</option>
                <option value="LW">LEFT WING (LW)</option>
                <option value="RW">RIGHT WING (RW)</option>
                <option value="CAM">ATTACKING MID (CAM)</option>
                <option value="CM">CENTER MID (CM)</option>
                <option value="CDM">DEFENSIVE MID (CDM)</option>
                <option value="LM">LEFT MID (LM)</option>
                <option value="RM">RIGHT MID (RM)</option>
                <option value="CB">CENTER BACK (CB)</option>
                <option value="LB">LEFT BACK (LB)</option>
                <option value="RB">RIGHT BACK (RB)</option>
                <option value="GK">GOALKEEPER (GK)</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/50">
                <ChevronDown size={16} />
              </div>
            </div>

            <div className="relative shadow-[0_8px_30px_rgba(0,0,0,0.15)] rounded-2xl group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Shirt size={16} className="text-[#D4F829] opacity-70 group-focus-within:opacity-100 transition-opacity" />
              </div>
              <select
                value={playStyle}
                onChange={(e) => setPlayStyle(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-2xl border border-[#151515]/10 bg-[#151515] text-[11px] font-bold tracking-wider text-white uppercase appearance-none outline-none focus:border-[#D4F829] transition"
              >
                <option value="">ANY STYLE</option>
                <option value="Speedster">SPEEDSTER</option>
                <option value="Playmaker">PLAYMAKER</option>
                <option value="Poacher">POACHER</option>
                <option value="Box-to-Box">BOX-TO-BOX</option>
                <option value="Finisher">FINISHER</option>
                <option value="Destroyer">DESTROYER</option>
                <option value="Target Man">TARGET MAN</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/50">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
          
          {/* Active Filters Divider */}
          <div className="flex items-center gap-4 pt-1 pb-1">
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A6A28]">
               {activeFiltersCount} FILTER(S) ACTIVE
             </span>
             <div className="flex-1 h-px bg-gradient-to-r from-[#A28B52]/50 via-[#A28B52]/20 to-transparent relative">
               {activeFiltersCount > 0 && (
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-px bg-gradient-to-r from-transparent to-[#FDE69F] blur-[1px] shadow-[0_0_8px_#FDE69F]" />
               )}
             </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 flex flex-col">
          {isSearching ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] bg-transparent relative overflow-hidden">
              <Loader2 className="size-12 text-[#151515] animate-spin mb-6" />
              <div className="text-xs text-[#151515]/70 uppercase tracking-widest font-bold">Searching Database...</div>
            </div>
          ) : searchError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] bg-transparent relative overflow-hidden">
              <div className="text-lg text-red-600 mb-2 font-display italic font-black uppercase">Search failed</div>
              <div className="text-xs text-[#151515]/70 text-center font-medium">Check your connection and try again</div>
            </div>
          ) : hasSearched && results.length === 0 ? (
            /* EMPTY STATE - EXACTLY MATCHING REFERENCE */
            <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] bg-transparent border border-[#151515]/10 relative overflow-hidden group">
              {/* Concentric Circles & Icon */}
              <div className="relative size-32 flex items-center justify-center mb-8">
                {/* Outer faint circle */}
                <div className="absolute inset-0 rounded-full border border-[#A28B52]/20 scale-110" />
                {/* Middle circle */}
                <div className="absolute inset-2 rounded-full border border-[#A28B52]/30" />
                {/* Inner glowing circle */}
                <div className="absolute inset-6 rounded-full border border-[#A28B52]/40 shadow-[0_0_30px_rgba(162,139,82,0.15)]" />
                
                {/* Sparkles / dots */}
                <div className="absolute top-2 left-6 size-0.5 bg-[#8A6A28] rounded-full opacity-60" />
                <div className="absolute bottom-4 right-8 size-[3px] bg-[#8A6A28] rounded-full opacity-40" />
                <div className="absolute top-8 right-2 size-0.5 bg-[#A28B52] rounded-full opacity-80" />

                <Search size={40} className="text-[#A28B52] relative z-10" strokeWidth={1.5} />
              </div>

              <h2 className="font-display italic font-black text-2xl text-[#151515] uppercase tracking-wide mb-3 text-center">
                NO PLAYERS FOUND
              </h2>
              <p className="text-xs text-[#151515]/70 text-center max-w-[200px] leading-relaxed font-medium">
                Try adjusting your search or filters to find players.
              </p>
            </div>
          ) : !hasSearched ? (
            /* Initial Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] bg-transparent border border-[#151515]/10 relative overflow-hidden">
               <Search size={32} className="text-[#A28B52] mb-4" strokeWidth={1.5} />
               <div className="text-sm text-[#151515]/70 font-medium text-center">Search for players to build your squad</div>
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              {results.map((player) => (
                <Link
                  key={player.id}
                  href={`/player/${player.username}`}
                  className="block p-4 rounded-[1.5rem] border border-white/5 bg-[#151515] shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:border-[#D4F829]/40 hover:bg-[#1A1A1A] transition duration-300 relative overflow-hidden group"
                >
                  {/* Subtle highlight gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D4F829]/0 via-[#D4F829]/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative size-14 rounded-full overflow-hidden border border-white/10 bg-[#0A0A0A] shrink-0 flex items-center justify-center shadow-inner group-hover:border-[#D4F829]/30 transition-colors">
                      {player.avatarUrl ? (
                        <Image src={player.avatarUrl} alt={player.username} fill className="object-cover" />
                      ) : (
                        <User size={20} className="text-white/30" />
                      )}
                      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-white truncate mb-0.5">
                        {player.fullName || "Player"}
                      </div>
                      <div className="text-[11px] text-[#E5DCC5]/60 font-semibold tracking-wide truncate mb-2">
                        @{player.username}
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2.5 py-1 rounded-[0.4rem] bg-[#D4F829]/10 border border-[#D4F829]/20 text-[9px] uppercase tracking-widest text-[#D4F829] font-bold">
                          {player.position || "N/A"}
                        </span>
                        <span className="px-2.5 py-1 rounded-[0.4rem] bg-[#D4F829]/10 border border-[#D4F829]/20 text-[9px] uppercase tracking-widest text-[#D4F829] font-bold">
                          {player.playStyle || "N/A"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-center justify-center pl-3 border-l border-white/10 group-hover:border-[#D4F829]/20 transition-colors">
                       <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-0.5 font-bold">OVR</span>
                       <span className="font-display text-2xl text-[#D4F829] font-black italic">{calculateOvr(player as any)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

