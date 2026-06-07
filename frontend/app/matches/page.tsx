"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Calendar, MapPin, Users, Loader2, X } from "lucide-react";

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
  const [createTitle, setCreateTitle] = useState("Sunday Turf Match");
  const [createLocation, setCreateLocation] = useState("Phoenix Turf");
  const [createDateTime, setCreateDateTime] = useState("");
  const [createMaxPlayers, setCreateMaxPlayers] = useState("10");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Join loading states
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Sync profile to get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await fetch("/api/profile/me");
        const data = await res.json();
        if (data.success && data.player) {
          setCurrentUserId(data.player.id);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
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
      if (data.success) {
        setMatches(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [filter, searchQuery]);

  const handleJoinMatch = async (matchId: string) => {
    setJoiningId(matchId);
    setToast(null);
    try {
      const res = await fetch("/api/matches/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });

      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", msg: "Successfully joined the match lobby!" });
        await fetchMatches();
      } else {
        setToast({ type: "error", msg: data.message || "Failed to join match" });
      }
    } catch {
      setToast({ type: "error", msg: "An error occurred. Please try again." });
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeaveMatch = async (matchId: string) => {
    setJoiningId(matchId);
    setToast(null);
    try {
      const res = await fetch("/api/matches/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });

      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", msg: "Successfully left the match lobby!" });
        await fetchMatches();
      } else {
        setToast({ type: "error", msg: data.message || "Failed to leave match" });
      }
    } catch {
      setToast({ type: "error", msg: "An error occurred. Please try again." });
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch("/api/matches/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle,
          location: createLocation,
          dateTime: createDateTime,
          maxPlayers: createMaxPlayers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setCreateTitle("Sunday Turf Match");
        setCreateLocation("Phoenix Turf");
        setCreateDateTime("");
        setCreateMaxPlayers("10");
        await fetchMatches();
      } else {
        setCreateError(data.message || "Failed to create match");
      }
    } catch (err) {
      console.error(err);
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
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      {/* Glow backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,255,0,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative h-full flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto z-10 w-full overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push("/home")} 
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold">Discover Lobbies</div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-9 h-9 rounded-full bg-[#C6FF00] text-black flex items-center justify-center cursor-pointer hover:bg-[#b0e600] transition"
            title="Create Match"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </header>

        {/* Toast notification */}
        {toast && (
          <div
            className={`mb-4 rounded-xl border p-3 text-center text-xs font-semibold ${
              toast.type === "success"
                ? "border-[#C6FF00]/22 bg-[#C6FF00]/6 text-[#C6FF00]"
                : "border-red-500/22 bg-red-500/7 text-red-400"
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Title */}
        <div className="mb-6 pl-1">
          <h1 className="font-display text-3xl uppercase tracking-wider italic">
            Lobbies &amp; Matches
          </h1>
          <p className="text-[11px] text-white/50 uppercase tracking-widest mt-1">
            Airbnb &bull; Discord style matchmaking
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full h-12 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center px-4 mb-5 focus-within:border-[#C6FF00]/40 transition duration-300">
          <Search size={16} className="text-white/40 shrink-0" />
          <input
            type="text"
            placeholder="Search by turf or city (e.g. Phoenix)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full bg-transparent border-none outline-none pl-3 text-sm text-white placeholder:text-white/30"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-none shrink-0 pl-0.5">
          {(["all", "open", "upcoming", "nearby"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`h-9 px-4 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition duration-200 shrink-0 cursor-pointer ${
                filter === t
                  ? "bg-[#C6FF00] border-[#C6FF00] text-black"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t === "all" ? "All Lobbies" : t === "open" ? "Open" : t === "upcoming" ? "Upcoming" : "Nearby"}
            </button>
          ))}
        </div>

        {/* Matches Feed */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="size-8 text-[#C6FF00] animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 border border-white/5 rounded-3xl bg-white/[0.01] px-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/30">
              <Calendar size={22} />
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-white/70 text-center">No Matches Found</div>
            <p className="text-xs text-white/40 text-center mt-1">
              Be the first to organize a lobby at your local turf!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-5 h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 transition"
            >
              Organize Match
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const isJoined = currentUserId && match.participants.some(p => p.userId === currentUserId);
              const isFull = match.players >= match.maxPlayers;
              const fillPct = Math.min(100, (match.players / match.maxPlayers) * 100);

              return (
                <div 
                  key={match.id}
                  className="p-4 rounded-3xl border border-white/8 bg-[#0B1020]/20 backdrop-blur-xl flex flex-col shadow-lg shadow-black/20 hover:border-white/15 transition duration-300 relative overflow-hidden"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold ${
                      isFull 
                        ? "bg-red-500/10 border border-red-500/20 text-red-400"
                        : "bg-[#C6FF00]/10 border border-[#C6FF00]/20 text-[#C6FF00]"
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
                    <div className="pr-16 mb-4">
                      <h3 className="text-base font-bold text-white leading-snug truncate group-hover:text-[#C6FF00] transition">
                        {match.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-white/50 mt-1">
                        <MapPin size={12} className="text-[#C6FF00]" />
                        <span className="truncate">{match.location}</span>
                      </div>
                    </div>

                    {/* Date, Time & Players Row */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 mb-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1 font-bold">Schedule</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-white/85 font-medium leading-none">
                          <Calendar size={11} className="text-[#C6FF00]/70" />
                          <span className="truncate">{formatMatchDate(match.dateTime)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1 font-bold">Squad size</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-white/85 font-medium leading-none">
                          <Users size={11} className="text-[#C6FF00]/70" />
                          <span>{match.players} / {match.maxPlayers} Players</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spots indicator */}
                  <div className="mb-4">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? "bg-red-500/60" : "bg-gradient-to-r from-[#C6FF00]/50 to-[#C6FF00]"
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Lobby Progress</span>
                      <span className="text-[10px] text-white/60 font-semibold">
                        {isFull ? "No spots left" : `${match.spotsLeft} spots remaining`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {isJoined ? (
                      <button
                        onClick={() => handleLeaveMatch(match.id)}
                        disabled={joiningId !== null}
                        className="w-full h-11 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] uppercase font-bold tracking-widest hover:bg-red-500/10 transition duration-200 cursor-pointer flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-200"
                        type="button"
                      >
                        {joiningId === match.id ? (
                          <Loader2 className="size-4 animate-spin text-red-400" />
                        ) : (
                          "LEAVE MATCH"
                        )}
                      </button>
                    ) : isFull ? (
                      <button
                        disabled
                        className="w-full h-11 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400/50 text-[10px] uppercase font-bold tracking-widest"
                        type="button"
                      >
                        LOBBY FULL
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinMatch(match.id)}
                        disabled={joiningId !== null}
                        className="w-full h-11 rounded-2xl bg-[#C6FF00] hover:bg-[#b0e600] text-black text-[10px] uppercase font-bold tracking-widest transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-[0_10px_20px_-5px_rgba(198,255,0,0.2)]"
                        type="button"
                      >
                        {joiningId === match.id ? (
                          <Loader2 className="size-4 animate-spin text-black" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-5">
          <div className="relative w-full max-w-sm rounded-[2rem] border border-[#C6FF00]/30 bg-[#050a0d] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setShowCreateModal(false); setCreateError(""); }}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
              type="button"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-display uppercase tracking-wider text-xl italic text-white text-center mt-2 mb-2">
              Organize Match
            </h3>
            <p className="text-xs text-white/50 text-center mb-6">
              Create a match lobby and invite local players.
            </p>

            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold block mb-1.5 pl-1">
                  Match Title
                </label>
                <input
                  type="text"
                  placeholder="Sunday Turf Match"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/40 outline-none focus:border-[#C6FF00]/50 transition duration-300"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold block mb-1.5 pl-1">
                  Turf / Location
                </label>
                <input
                  type="text"
                  placeholder="Phoenix Turf"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/40 outline-none focus:border-[#C6FF00]/50 transition duration-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold block mb-1.5 pl-1">
                    Squad Size (Max)
                  </label>
                  <input
                    type="number"
                    min="2"
                    placeholder="10"
                    value={createMaxPlayers}
                    onChange={(e) => setCreateMaxPlayers(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/40 outline-none focus:border-[#C6FF00]/50 transition duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold block mb-1.5 pl-1">
                    Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={createDateTime}
                    onChange={(e) => setCreateDateTime(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white outline-none focus:border-[#C6FF00]/50 transition duration-300 block"
                    required
                  />
                </div>
              </div>

              {createError && (
                <div className="rounded-xl border border-red-500/22 bg-red-500/7 p-3 text-center text-xs font-semibold text-red-400">
                  {createError}
                </div>
              )}

              <button
                type="submit"
                disabled={createLoading || !createTitle.trim() || !createLocation.trim() || !createDateTime}
                className="w-full h-12 rounded-xl bg-[#C6FF00] text-black font-display tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600] disabled:opacity-50 text-sm font-bold mt-2"
              >
                {createLoading ? <Loader2 className="size-4 animate-spin" /> : "CREATE LOBBY"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
