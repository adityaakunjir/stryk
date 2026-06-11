"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Loader2, SlidersHorizontal, User } from "lucide-react";
import { usePlayer } from "@/components/player-context";

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
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(60% 50% at 50% 15%, rgba(198,255,0,0.1) 0%, transparent 60%), #05070B"}}
      />

      <div className="relative h-full flex flex-col px-5 pt-6 pb-5 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push("/home")} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition">
            <ArrowLeft size={16} />
          </button>
          <div className="text-[10px] tracking-[0.35em] uppercase text-[#C6FF00] font-bold">Player Search</div>
          <div className="w-9 h-9" />
        </div>

        <div className="space-y-4">
          {/* Main Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-white/40" />
            </div>
            <input
              type="text"
              placeholder="Search by name or @username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-14 pl-11 pr-4 rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/40 outline-none focus:border-[#C6FF00]/50 transition duration-300"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full h-12 pl-4 pr-8 rounded-xl border border-white/10 bg-[#0A0E17] text-xs text-white appearance-none outline-none focus:border-[#C6FF00]/50 transition"
              >
                <option value="">Any Position</option>
                <option value="ST">Striker (ST)</option>
                <option value="LW">Left Wing (LW)</option>
                <option value="RW">Right Wing (RW)</option>
                <option value="CAM">Attacking Mid (CAM)</option>
                <option value="CM">Center Mid (CM)</option>
                <option value="CDM">Defensive Mid (CDM)</option>
                <option value="LM">Left Mid (LM)</option>
                <option value="RM">Right Mid (RM)</option>
                <option value="CB">Center Back (CB)</option>
                <option value="LB">Left Back (LB)</option>
                <option value="RB">Right Back (RB)</option>
                <option value="GK">Goalkeeper (GK)</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/30">
                <SlidersHorizontal size={14} />
              </div>
            </div>

            <div className="relative">
              <select
                value={playStyle}
                onChange={(e) => setPlayStyle(e.target.value)}
                className="w-full h-12 pl-4 pr-8 rounded-xl border border-white/10 bg-[#0A0E17] text-xs text-white appearance-none outline-none focus:border-[#C6FF00]/50 transition"
              >
                <option value="">Any Style</option>
                <option value="Speedster">Speedster</option>
                <option value="Playmaker">Playmaker</option>
                <option value="Poacher">Poacher</option>
                <option value="Box-to-Box">Box-to-Box</option>
                <option value="Finisher">Finisher</option>
                <option value="Destroyer">Destroyer</option>
                <option value="Target Man">Target Man</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/30">
                <SlidersHorizontal size={14} />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center px-1">
             <span className="text-[10px] uppercase tracking-wider text-white/40">
               {activeFiltersCount} filter(s) active
             </span>
             {activeFiltersCount < 2 && activeFiltersCount > 0 && (
                <span className="text-[9px] uppercase tracking-wider text-[#C6FF00]/70">
                  Tip: Combine 2 filters for better results
                </span>
             )}
          </div>
        </div>

        {/* Results Area */}
        <div className="mt-8 flex-1">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="size-8 text-[#C6FF00] animate-spin mb-4" />
              <div className="text-xs text-white/50 uppercase tracking-widest">Searching Database</div>
            </div>
          ) : searchError ? (
            <div className="flex flex-col items-center justify-center h-40 border border-dashed border-red-500/20 rounded-3xl bg-red-500/[0.03]">
              <div className="text-sm text-red-400 mb-1 font-bold">Search failed</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider">Check your connection and try again</div>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
              <div className="text-sm text-white/50 mb-1 font-bold">No players found</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider">Try adjusting your filters</div>
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {results.map((player) => (
                <Link
                  key={player.id}
                  href={`/player/${player.username}`}
                  className="block p-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#C6FF00]/30 transition duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative size-14 rounded-full overflow-hidden border border-white/10 bg-[#0B1020] shrink-0 flex items-center justify-center">
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-white/30" />
                      )}
                      <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {player.fullName || "Player"}
                      </div>
                      <div className="text-[11px] text-[#C6FF00] font-medium tracking-wide truncate">
                        @{player.username}
                      </div>
                      <div className="mt-1.5 flex gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] uppercase tracking-wider text-white/60">
                          {player.position || "N/A"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] uppercase tracking-wider text-white/60">
                          {player.playStyle || "N/A"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-center justify-center px-2">
                       <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-0.5">OVR</span>
                       <span className="font-display text-xl text-white">{player.overall ?? 60}</span>
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
