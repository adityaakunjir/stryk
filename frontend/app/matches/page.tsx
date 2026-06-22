"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Calendar, MapPin, Users, Loader2, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Match {
  id: string;
  title: string;
  location: string;
  dateTime: string;
  maxPlayers: number;
  status: string;
  creatorId: string;
  createdAt: string;
  players: number;
  spotsLeft: number;
  participants: any[];
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "upcoming" | "nearby">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Create match modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createDateTime, setCreateDateTime] = useState("");
  const [createMaxPlayers, setCreateMaxPlayers] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Join loading states
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Toast state removed in favor of sonner

  // Sync profile to get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await fetch("/api/profile/me");
        const data = await res.json();
        if (data.success && data.player) {
          setCurrentUserId(data.player.id);
        }
      } catch {
        // Fallback handled gracefully
      }
    };
    fetchUserId();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      let url = "/api/matches";
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("filter", filter);
      }
      if (searchQuery.trim()) {
        params.append("location", searchQuery.trim());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMatches(data);
      } else if (data.success && Array.isArray(data.data)) {
        setMatches(data.data);
      } else {
        setMatches([]);
      }
    } catch {
      // Ignored: empty state UI handles no matches
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchQuery]);

  const handleJoinMatch = async (matchId: string) => {
    setJoiningId(matchId);
    try {
      const res = await fetch("/api/matches/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Successfully joined the match lobby!");
        await fetchMatches();
      } else {
        toast.error(data.message || "Failed to join match");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeaveMatch = async (matchId: string) => {
    setJoiningId(matchId);
    try {
      const res = await fetch("/api/matches/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Successfully left the match lobby!");
        await fetchMatches();
      } else {
        toast.error(data.message || "Failed to leave match");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch(`/api/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: createTitle,
          location: createLocation,
          date_time: createDateTime,
          max_players: parseInt(createMaxPlayers, 10) || 22
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setCreateTitle("");
        setCreateLocation("");
        setCreateDateTime("");
        setCreateMaxPlayers("22");
        
        // Optimistically update matches list
        setMatches([data, ...matches]);
      } else {
        setCreateError(typeof data.detail === "string" ? data.detail : "Failed to create match");
      }
    } catch {
      setCreateError("An error occurred. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Helper to format Date nicely
  const formatMatchDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="stryk-mobile-shell bg-[#E5DCC5] min-h-[100dvh] text-[#151515]">
      {/* Premium Marble Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/create_card_bg.webp')" }}
      />

      <div className="relative h-full flex flex-col px-6 pt-6 pb-8 max-w-md mx-auto z-10 w-full overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-5 relative">
          <button 
            onClick={() => router.push("/home")} 
            className="w-12 h-12 rounded-full shadow-sm bg-[#EBE3D1] flex items-center justify-center cursor-pointer hover:bg-[#E5DCC5] transition relative z-10 border-none"
            type="button"
          >
            <ArrowLeft size={20} className="text-[#A28B52]" strokeWidth={2} />
          </button>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img src="/logo.webp" alt="STRYK Logo" className="h-[44px] w-auto drop-shadow-sm" />
          </div>

          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-12 h-12 rounded-full bg-[#151515] shadow-md border border-[#A28B52]/40 flex items-center justify-center cursor-pointer hover:bg-black transition relative z-10"
            title="Create Match"
          >
            <Plus size={22} strokeWidth={2} className="text-[#D4F829]" />
          </button>
        </header>

        {/* Title */}
        <div className="mb-5 pl-1">
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#A28B52] mb-1">
            DISCOVER LOBBIES
          </div>
          <h1 className="font-display text-[2.75rem] uppercase tracking-[-0.05em] italic font-black leading-none drop-shadow-sm whitespace-nowrap">
            <span className="text-[#151515]">LOBBIES &amp; </span>
            <span className="bg-gradient-to-b from-[#E8C878] to-[#8A6A28] text-transparent bg-clip-text pr-2">MATCHES</span>
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative w-full h-[50px] rounded-full bg-[#151515] shadow-[0_8px_24px_rgba(0,0,0,0.15)] flex items-center px-5 mb-5 border border-[#A28B52]/10 focus-within:ring-1 focus-within:ring-[#D4F829]/50 focus-within:border-[#D4F829]/50 transition duration-300">
          <Search size={18} className="text-[#A28B52]/70 shrink-0" />
          <input
            type="text"
            placeholder="Search by turf or city (e.g. Phoenix)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full bg-transparent border-none outline-none pl-3 text-[14px] text-[#EFE8D6] placeholder:text-[#666666] font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-[#666666] hover:text-[#EFE8D6] transition"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-none shrink-0 pl-1">
          {(["all", "open", "upcoming", "nearby"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`h-[38px] px-6 rounded-full text-[11px] uppercase tracking-widest font-bold transition duration-300 shrink-0 cursor-pointer relative overflow-hidden ${
                filter === t
                  ? "bg-gradient-to-b from-[#E5C16C] to-[#C09A45] text-[#151515] font-black shadow-[0_4px_12px_rgba(162,139,82,0.3)]"
                  : "bg-[#151515] text-[#EFE8D6] hover:bg-[#2A2824] shadow-[0_4px_10px_rgba(0,0,0,0.15)] border border-[#A28B52]/5"
              }`}
            >
              {t === "all" ? "All Lobbies" : t === "open" ? "Open" : t === "upcoming" ? "Upcoming" : "Nearby"}
              {/* Refined Neon Green Bottom Glow */}
              {filter === t && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#D4F829] shadow-[0_0_8px_rgba(212,248,41,0.8)] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Matches Feed */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="size-8 text-[#A28B52] animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center py-12 pb-14 border border-[#A28B52]/20 rounded-[1.5rem] bg-[#151515] shadow-[0_12px_32px_rgba(0,0,0,0.3)] px-6 overflow-hidden">
            
            {/* Elegant Golden Radar Circles */}
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
               <div className="w-[180px] h-[180px] rounded-full border border-[#A28B52]/5" />
            </div>
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
               <div className="w-[100px] h-[100px] rounded-full border border-[#A28B52]/10" />
            </div>

            <div className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Calendar size={32} strokeWidth={1.5} className="text-[#A28B52] drop-shadow-sm" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="text-[22px] font-display uppercase tracking-tight text-center drop-shadow-sm">
                <span className="text-[#E5DCC5] font-black">NO MATCHES </span>
                <span className="text-[#A28B52] font-black italic">FOUND</span>
              </div>
              {/* Elegant Flare */}
              <div className="w-[80px] h-[2px] mt-1.5 bg-gradient-to-r from-transparent via-[#A28B52] to-transparent shadow-[0_0_8px_rgba(162,139,82,0.5)]" />
            </div>
            
            <p className="relative z-10 text-[13px] text-[#A0A0A0] text-center mt-5 max-w-[220px] leading-relaxed mb-5">
              Be the first to organize a lobby at your local turf!
            </p>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="relative z-10 h-[46px] px-10 rounded-full bg-[#D4F829] text-[#151515] text-[12px] uppercase font-black tracking-[0.15em] hover:bg-[#cbf026] transition shadow-[0_0_16px_rgba(212,248,41,0.25)]"
            >
              Organize Match
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {matches.map((match) => {
              const isJoined = currentUserId && (match.creatorId === currentUserId || match.participants?.some(p => p.userId === currentUserId));
              const currentPlayers = match.players || match.participants?.length || 1;
              const maxPlayers = match.maxPlayers || 22;
              const isFull = currentPlayers >= maxPlayers;
              const fillPct = Math.min(100, (currentPlayers / maxPlayers) * 100);
              const spotsLeft = maxPlayers - currentPlayers;

              return (
                <div 
                  key={match.id}
                  className="p-5 rounded-[2rem] border border-[#A28B52]/20 bg-[#151515] flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-[#A28B52]/50 transition duration-300 relative overflow-hidden group/card"
                >
                  {/* Status Badge */}
                  <div className="absolute top-5 right-5 flex items-center gap-1.5">
                    <span className={`px-3 py-1 rounded-[0.5rem] text-[9px] uppercase tracking-[0.2em] font-bold shadow-sm ${
                      isFull 
                        ? "bg-red-500/10 border border-red-500/20 text-red-500"
                        : "bg-gradient-to-r from-[#A28B52]/20 to-[#A28B52]/5 border border-[#A28B52]/30 text-[#A28B52]"
                    }`}>
                      {isFull ? "FULL" : "OPEN"}
                    </span>
                  </div>

                  {/* Turf Info & Schedule (Clickable) */}
                  <div 
                    onClick={() => router.push(`/matches/${match.id}`)}
                    className="cursor-pointer group"
                  >
                    {/* Turf Info */}
                    <div className="pr-16 mb-5">
                      <h3 className="text-lg font-bold text-[#E5DCC5] leading-snug truncate group-hover:text-[#A28B52] transition">
                        {match.title || "Untitled Match"}
                      </h3>
                      <div className="flex items-center gap-2 text-[12px] text-[#A0A0A0] mt-1.5 font-medium">
                        <MapPin size={13} className="text-[#A28B52]" />
                        <span className="truncate">{match.location || "TBD"}</span>
                      </div>
                    </div>

                    {/* Date, Time & Players Row */}
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-[1.25rem] bg-[#151515] border border-[#A28B52]/10 mb-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-[#A28B52] mb-1.5 font-bold">Schedule</span>
                        <div className="flex items-center gap-2 text-[12px] text-[#E5DCC5] font-semibold leading-none">
                          <Calendar size={13} className="text-[#A28B52]/80" />
                          <span className="truncate">{match.dateTime ? formatMatchDate(match.dateTime) : "TBD"}</span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-[#A28B52] mb-1.5 font-bold">Squad size</span>
                        <div className="flex items-center gap-2 text-[12px] text-[#E5DCC5] font-semibold leading-none">
                          <Users size={13} className="text-[#A28B52]/80" />
                          <span>{currentPlayers} / {maxPlayers} Players</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spots indicator */}
                  <div className="mb-5 px-1">
                    <div className="h-2 w-full bg-[#151515] rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] border border-[#A28B52]/10">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(162,139,82,0.5)] ${
                          isFull ? "bg-red-500/80 shadow-red-500/50" : "bg-gradient-to-r from-[#A28B52] to-[#FDE69F]"
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-[#A28B52] font-bold">Lobby Progress</span>
                      <span className="text-[10px] text-[#A0A0A0] font-semibold tracking-wide">
                        {isFull ? "No spots left" : `${spotsLeft} spots remaining`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {isJoined ? (
                      <button
                        onClick={() => handleLeaveMatch(match.id)}
                        disabled={joiningId !== null}
                        className="w-full h-12 rounded-[1.25rem] border border-red-500/30 bg-[#151515] text-red-500 text-[11px] uppercase font-bold tracking-[0.15em] hover:bg-red-500/10 transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                        type="button"
                      >
                        {joiningId === match.id ? (
                          <>
                            <Loader2 className="size-4 animate-spin text-red-500" />
                            LEAVING...
                          </>
                        ) : (
                          "LEAVE MATCH"
                        )}
                      </button>
                    ) : isFull ? (
                      <button
                        disabled
                        className="w-full h-12 rounded-[1.25rem] border border-white/5 bg-[#151515] text-white/30 text-[11px] uppercase font-bold tracking-[0.15em] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                        type="button"
                      >
                        LOBBY FULL
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinMatch(match.id)}
                        disabled={joiningId !== null}
                        className="w-full h-12 rounded-[1.25rem] bg-[#D4F829] hover:bg-[#cbf026] text-[#151515] text-[13px] uppercase font-black tracking-[0.15em] transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(212,248,41,0.2)]"
                        type="button"
                      >
                        {joiningId === match.id ? (
                          <>
                            <Loader2 className="size-4 animate-spin text-[#151515]" />
                            JOINING...
                          </>
                        ) : (
                          "JOIN MATCH"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Organize Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151515]/80 backdrop-blur-md px-5">
          <div className="relative w-full max-w-sm rounded-[2rem] border border-[#A28B52]/20 bg-gradient-to-b from-[#151515] to-[#151515] p-7 shadow-[0_24px_60px_rgba(162,139,82,0.15)] flex flex-col max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setShowCreateModal(false); setCreateError(""); }}
              className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-[#151515] border border-[#A28B52]/10 text-[#888888] hover:text-[#A28B52] hover:bg-[#2A2824] transition duration-200 cursor-pointer"
              type="button"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>

            <h3 className="font-display uppercase tracking-[-0.05em] text-[26px] italic font-black text-center mt-3 mb-2 drop-shadow-sm">
              <span className="text-[#EFE8D6]">ORGANIZE </span>
              <span className="bg-gradient-to-b from-[#E8C878] to-[#8A6A28] text-transparent bg-clip-text pr-2">MATCH</span>
            </h3>
            <p className="text-[12px] text-[#A0A0A0] text-center mb-8 font-medium">
              Create a match lobby and invite local players.
            </p>

            <form onSubmit={handleCreateMatch} className="space-y-5">
              <div>
                <label className="text-[11px] tracking-[0.15em] uppercase text-[#A28B52] font-black block mb-2 pl-2 drop-shadow-sm">
                  Match Title
                </label>
                <input
                  type="text"
                  placeholder="Sunday Turf Match"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full h-14 px-5 rounded-[1.25rem] border border-[#A28B52]/10 bg-[#151515] text-[15px] text-[#EFE8D6] placeholder:text-[#666666] outline-none focus:border-[#D4F829]/50 focus:ring-1 focus:ring-[#D4F829]/50 transition duration-300 font-medium shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] tracking-[0.15em] uppercase text-[#A28B52] font-black block mb-2 pl-2 drop-shadow-sm">
                  Turf / Location
                </label>
                <input
                  type="text"
                  placeholder="Phoenix Turf"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  className="w-full h-14 px-5 rounded-[1.25rem] border border-[#A28B52]/10 bg-[#151515] text-[15px] text-[#EFE8D6] placeholder:text-[#666666] outline-none focus:border-[#D4F829]/50 focus:ring-1 focus:ring-[#D4F829]/50 transition duration-300 font-medium shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] tracking-[0.15em] uppercase text-[#A28B52] font-black block mb-2 pl-2 drop-shadow-sm">
                  Match Format (Total Players)
                </label>
                <div className="relative">
                  <select
                    value={createMaxPlayers}
                    onChange={(e) => setCreateMaxPlayers(e.target.value)}
                    className="w-full h-14 px-5 rounded-[1.25rem] border border-[#A28B52]/10 bg-[#151515] text-[15px] text-[#EFE8D6] outline-none focus:border-[#D4F829]/50 focus:ring-1 focus:ring-[#D4F829]/50 transition duration-300 font-medium shadow-inner appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Format</option>
                    <option value="10">5v5 (10 Players)</option>
                    <option value="12">6v6 (12 Players)</option>
                    <option value="14">7v7 (14 Players)</option>
                    <option value="16">8v8 (16 Players)</option>
                    <option value="18">9v9 (18 Players)</option>
                    <option value="22">11v11 (22 Players)</option>
                  </select>
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[#A28B52]/70">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] tracking-[0.15em] uppercase text-[#A28B52] font-black block mb-2 pl-2 drop-shadow-sm">
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={createDateTime}
                  onChange={(e) => setCreateDateTime(e.target.value)}
                  className="w-full h-14 px-5 rounded-[1.25rem] border border-[#A28B52]/10 bg-[#151515] text-[15px] text-[#EFE8D6] outline-none focus:border-[#D4F829]/50 focus:ring-1 focus:ring-[#D4F829]/50 transition duration-300 block font-medium shadow-inner"
                  required
                />
              </div>

              {createError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-400 mt-2">
                  {createError}
                </div>
              )}

              <button
                type="submit"
                disabled={createLoading || !createTitle.trim() || !createLocation.trim() || !createDateTime}
                className="w-full h-[54px] rounded-full bg-[#D4F829] text-[#151515] font-black tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition duration-300 hover:bg-[#cbf026] disabled:opacity-50 text-[13px] mt-6 shadow-[0_8px_20px_rgba(212,248,41,0.25)] uppercase"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    CREATING MATCH...
                  </>
                ) : (
                  "CREATE LOBBY"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
