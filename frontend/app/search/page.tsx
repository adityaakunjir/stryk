"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Loader2, ChevronDown, User, Activity, Shirt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/components/player-context";
import { cn } from "@/lib/utils";
import Image from "next/image";

const positionsList = [
  { code: "", name: "ANY POSITION" },
  { code: "ST", name: "STRIKER (ST)" },
  { code: "LW", name: "LEFT WING (LW)" },
  { code: "RW", name: "RIGHT WING (RW)" },
  { code: "CAM", name: "ATTACKING MID (CAM)" },
  { code: "CM", name: "CENTER MID (CM)" },
  { code: "CDM", name: "DEFENSIVE MID (CDM)" },
  { code: "LM", name: "LEFT MID (LM)" },
  { code: "RM", name: "RIGHT MID (RM)" },
  { code: "CB", name: "CENTER BACK (CB)" },
  { code: "LB", name: "LEFT BACK (LB)" },
  { code: "RB", name: "RIGHT BACK (RB)" },
  { code: "GK", name: "GOALKEEPER (GK)" },
];

const stylesList = [
  { code: "", name: "ANY STYLE" },
  { code: "Speedster", name: "SPEEDSTER" },
  { code: "Playmaker", name: "PLAYMAKER" },
  { code: "Poacher", name: "POACHER" },
  { code: "Box-to-Box", name: "BOX-TO-BOX" },
  { code: "Finisher", name: "FINISHER" },
  { code: "Destroyer", name: "DESTROYER" },
  { code: "Target Man", name: "TARGET MAN" },
];

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
  const currentUsername = playerData.username;
  
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("");
  const [playStyle, setPlayStyle] = useState("");
  
  const [isPositionOpen, setIsPositionOpen] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  
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
        if (currentUsername) {
          finalData = data.filter((p: SearchResult) => p.username?.toLowerCase() !== currentUsername.toLowerCase());
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
  }, [query, position, playStyle, currentUsername]);

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
    <main className="stryk-mobile-shell bg-[#151515] min-h-[100dvh] text-white">

      <div className="relative h-full flex flex-col px-5 pt-3 pb-5 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-1 relative z-20">
          <button 
            onClick={() => router.push("/home")} 
            className="w-10 h-10 rounded-full bg-[#151515] border border-white/5 text-white flex items-center justify-center cursor-pointer hover:bg-[#202020] transition shadow-sm relative z-10"
            aria-label="Back"
            type="button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Title */}
        <h1 className="font-display text-[2.5rem] font-black italic uppercase tracking-tight text-white drop-shadow-sm leading-none text-center mb-4 mt-2 relative z-10">
          PLAYER SEARCH
        </h1>

        <div className="space-y-3 mb-4">
          {/* Main Search Input */}
          <div className="relative shadow-[0_8px_30px_rgba(0,0,0,0.15)] rounded-full group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search size={20} className="text-[#A28B52] opacity-70 group-focus-within:opacity-100 transition-opacity" />
            </div>
            <input
              type="text"
              placeholder="Search by name or @username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-[52px] pl-12 pr-5 rounded-full border border-white/5 bg-[#151515] text-sm text-white placeholder:text-white/40 outline-none focus:border-[#A28B52] transition duration-300 shadow-inner"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 gap-3 relative z-30">
            {/* Position Selector */}
            <div className="relative shadow-[0_8px_30px_rgba(0,0,0,0.15)] rounded-2xl group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Activity size={16} className="text-[#A28B52] opacity-70 transition-opacity" />
              </div>
              <button
                type="button"
                onClick={() => { setIsPositionOpen(!isPositionOpen); setIsStyleOpen(false); }}
                className="w-full h-11 pl-10 pr-8 rounded-2xl border border-white/5 bg-[#151515] text-[10px] font-bold tracking-wider text-white uppercase text-left flex items-center justify-between cursor-pointer focus:border-[#A28B52] transition"
              >
                <span className="truncate">{position ? positionsList.find(p => p.code === position)?.name : "ANY POSITION"}</span>
              </button>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#A28B52]/50">
                <ChevronDown size={16} className={cn("transition-transform duration-200", isPositionOpen && "rotate-180")} />
              </div>

              <AnimatePresence>
                {isPositionOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    className="absolute top-full mt-1.5 w-full max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-[#151515] p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 custom-scrollbar"
                  >
                    {positionsList.map((p) => (
                      <button 
                        key={p.code} 
                        onClick={() => { setPosition(p.code); setIsPositionOpen(false); }} 
                        className={cn(
                          "block w-full rounded-lg px-3 py-2 text-left text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-colors",
                          position === p.code ? "bg-[#C6FF00]/10 text-[#C6FF00]" : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                        type="button"
                      >
                        {p.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Style Selector */}
            <div className="relative shadow-[0_8px_30px_rgba(0,0,0,0.15)] rounded-2xl group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Shirt size={16} className="text-[#A28B52] opacity-70 transition-opacity" />
              </div>
              <button
                type="button"
                onClick={() => { setIsStyleOpen(!isStyleOpen); setIsPositionOpen(false); }}
                className="w-full h-11 pl-10 pr-8 rounded-2xl border border-white/5 bg-[#151515] text-[10px] font-bold tracking-wider text-white uppercase text-left flex items-center justify-between cursor-pointer focus:border-[#A28B52] transition"
              >
                <span className="truncate">{playStyle ? stylesList.find(s => s.code === playStyle)?.name : "ANY STYLE"}</span>
              </button>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#A28B52]/50">
                <ChevronDown size={16} className={cn("transition-transform duration-200", isStyleOpen && "rotate-180")} />
              </div>

              <AnimatePresence>
                {isStyleOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    className="absolute top-full mt-1.5 w-full max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-[#151515] p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 custom-scrollbar"
                  >
                    {stylesList.map((s) => (
                      <button 
                        key={s.code} 
                        onClick={() => { setPlayStyle(s.code); setIsStyleOpen(false); }} 
                        className={cn(
                          "block w-full rounded-lg px-3 py-2 text-left text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-colors",
                          playStyle === s.code ? "bg-[#C6FF00]/10 text-[#C6FF00]" : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                        type="button"
                      >
                        {s.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
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
              <Loader2 className="size-12 text-white animate-spin mb-6" />
              <div className="text-xs text-white/70 uppercase tracking-widest font-bold">Searching Database...</div>
            </div>
          ) : searchError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] bg-transparent relative overflow-hidden">
              <div className="text-lg text-red-600 mb-2 font-display italic font-black uppercase">Search failed</div>
              <div className="text-xs text-white/70 text-center font-medium">Check your connection and try again</div>
            </div>
          ) : hasSearched && results.length === 0 ? (
            /* EMPTY STATE - EXACTLY MATCHING REFERENCE */
            <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] bg-[#0c0c0c] border border-white/5 relative overflow-hidden group">
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

              <h2 className="font-display italic font-black text-2xl text-white uppercase tracking-wide mb-3 text-center">
                NO PLAYERS FOUND
              </h2>
              <p className="text-xs text-white/70 text-center max-w-[200px] leading-relaxed font-medium">
                Try adjusting your search or filters to find players.
              </p>
            </div>
          ) : !hasSearched ? (
            /* Initial Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] bg-[#0c0c0c] border border-white/5 relative overflow-hidden">
               <Search size={32} className="text-[#A28B52] mb-4" strokeWidth={1.5} />
               <div className="text-sm text-white/70 font-medium text-center">Search for players to build your squad</div>
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              {results.map((player) => (
                <Link
                  key={player.id}
                  href={`/player/${player.username}`}
                  className="block p-4 rounded-[1.5rem] border border-white/5 bg-[#151515] shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:border-[#D4F829]/40 hover:bg-[#1e1e1e] transition duration-300 relative overflow-hidden group"
                >
                  {/* Subtle highlight gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D4F829]/0 via-[#D4F829]/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative size-14 rounded-full overflow-hidden border border-[#A28B52]/30 bg-[#0A0A0A] shrink-0 flex items-center justify-center shadow-inner group-hover:border-[#D4F829]/30 transition-colors">
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
                        <span className="px-2.5 py-1 rounded-[0.4rem] bg-[#A28B52]/10 border border-[#A28B52]/20 text-[9px] uppercase tracking-widest text-[#A28B52] font-bold group-hover:border-[#D4F829]/20 transition-colors">
                          {player.position || "N/A"}
                        </span>
                        <span className="px-2.5 py-1 rounded-[0.4rem] bg-[#A28B52]/10 border border-[#A28B52]/20 text-[9px] uppercase tracking-widest text-[#A28B52] font-bold group-hover:border-[#D4F829]/20 transition-colors">
                          {player.playStyle || "N/A"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-center justify-center pl-3 border-l border-white/10 group-hover:border-[#D4F829]/20 transition-colors">
                       <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-0.5 font-bold">OVR</span>
                       <span className="font-display text-2xl text-[#D4F829] font-black italic">{player.overall ?? 60}</span>
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

