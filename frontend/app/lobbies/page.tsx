"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MapPin, Clock, Users, ArrowLeft, X } from "lucide-react";

export default function LobbiesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDraftOptions, setShowDraftOptions] = useState(false);

  // Lobbies state - empty by default, loaded from localStorage
  const [lobbies, setLobbies] = useState<{
    id: number;
    name: string;
    venue: string;
    time: string;
    host: string;
    going: number;
    total: number;
    live: boolean;
  }[]>([]);

  // Create lobby form states
  const [newLobbyName, setNewLobbyName] = useState("");
  const [newLobbyVenue, setNewLobbyVenue] = useState("");
  const [newLobbyTime, setNewLobbyTime] = useState("");
  const [newLobbyTotal, setNewLobbyTotal] = useState(10);

  // Sync lobbies from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("stryk_lobbies");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        queueMicrotask(() => {
          setLobbies(parsed);
        });
      } catch {
        queueMicrotask(() => {
          setLobbies([]);
        });
      }
    } else {
      queueMicrotask(() => {
        setLobbies([]); // Empty by default
      });
    }
  }, []);

  const handleCreateLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLobbyName.trim() || !newLobbyVenue.trim() || !newLobbyTime.trim()) return;

    // Retrieve full name of current player for the host field
    let currentHostName = "Player";
    const storedPlayer = localStorage.getItem("stryk_player_data");
    if (storedPlayer) {
      try {
        const parsed = JSON.parse(storedPlayer);
        currentHostName = parsed.fullName || currentHostName;
      } catch {}
    }

    const newLobby = {
      id: Date.now(),
      name: newLobbyName.trim(),
      venue: newLobbyVenue.trim(),
      time: newLobbyTime.trim(),
      host: currentHostName,
      going: 1, // Host is going
      total: Number(newLobbyTotal) || 10,
      live: true,
    };

    const updated = [...lobbies, newLobby];
    setLobbies(updated);
    localStorage.setItem("stryk_lobbies", JSON.stringify(updated));

    // Reset form
    setNewLobbyName("");
    setNewLobbyVenue("");
    setNewLobbyTime("");
    setNewLobbyTotal(10);
    setShowCreateModal(false);
  };

  const filteredLobbies = lobbies.filter((l) => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.host.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "my") {
      // Show lobbies hosted by current user
      let currentHostName = "Player";
      const storedPlayer = localStorage.getItem("stryk_player_data");
      if (storedPlayer) {
        try {
          const parsed = JSON.parse(storedPlayer);
          currentHostName = parsed.fullName || currentHostName;
        } catch {}
      }
      return matchesSearch && l.host === currentHostName;
    }

    return matchesSearch;
  });

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B]">
      {/* Background gradients */}
      <div
        className="absolute inset-x-0 top-0 h-60 opacity-60 pointer-events-none"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(198,255,0,0.10), transparent 60%)" }}
      />

      <div data-scroll-panel className="relative h-full flex flex-col px-5 pt-6 pb-6 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/home")}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/45 font-bold">Match Lobbies</div>
              <div className="font-display tracking-wide text-2xl uppercase">FIND A GAME</div>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 rounded-full bg-[#C6FF00] text-black flex items-center justify-center cursor-pointer hover:bg-[#b0e600] transition"
            style={{ boxShadow: "0 14px 30px -8px rgba(198,255,0,0.55)" }}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center px-3 h-11 focus-within:border-[#C6FF00]/40 transition shrink-0">
          <Search size={14} className="text-white/50" />
          <input
            placeholder="Search venues, hosts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none px-2 text-xs text-white placeholder:text-white/35 w-full border-0 focus:ring-0 p-0"
          />
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2 shrink-0">
          <Tab active={activeTab === "all"} onClick={() => setActiveTab("all")}>All</Tab>
          <Tab active={activeTab === "my"} onClick={() => setActiveTab("my")}>My Lobbies</Tab>
          <Tab active={activeTab === "draft"} onClick={() => setActiveTab("draft")}>Draft Mode</Tab>
        </div>

        {/* Lobbies List */}
        <div className="mt-4 flex-1 space-y-3 pr-0.5">
          {activeTab === "draft" ? (
            <div className="space-y-3">
              <p className="text-xs text-white/50 text-center py-4">Select match size to start draft mode</p>
              {[4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map((size) => (
                <button
                  key={size}
                  onClick={() => router.push(`/lobbies/draft?maxPlayers=${size}`)}
                  className="w-full rounded-2xl p-4 border bg-white/[0.02] transition hover:bg-white/[0.04] hover:border-[#C6FF00]/40 text-left"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="font-display tracking-wide text-lg text-[#C6FF00]">
                    {size / 2}v{size / 2} DRAFT
                  </div>
                  <div className="mt-1.5 text-xs text-white/55">
                    {size} players total • Pick your team on the pitch
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              {filteredLobbies.map((l, i) => (
                <div
                  key={l.id}
                  className="rounded-2xl p-4 border bg-white/[0.02] transition hover:bg-white/[0.04]"
                  style={{
                    borderColor: i === 0 ? "rgba(198,255,0,0.35)" : "rgba(255,255,255,0.08)",
                    background: i === 0 ? "linear-gradient(135deg, rgba(198,255,0,0.10), rgba(198,255,0,0.02))" : undefined,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="font-display tracking-wide truncate text-lg">
                        {l.name.toUpperCase()}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/55">
                        <MapPin size={11} className="shrink-0" /> <span className="truncate">{l.venue}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-white/55">
                        <Clock size={11} className="shrink-0" /> {l.time}
                      </div>
                      <div className="mt-1 text-[10px] text-white/40 uppercase tracking-wider">
                        Host: <span className="text-[#C6FF00]/80 font-bold">{l.host}</span>
                      </div>
                    </div>
                    {l.live && (
                      <span className="text-[9px] tracking-[0.25em] uppercase px-2 py-0.5 rounded-full bg-[#C6FF00] text-black font-bold h-fit shrink-0">Live</span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-white/55 shrink-0" />
                      <div className="text-xs text-white/70">
                        <span className="text-white font-bold">{l.going}</span>/{l.total} going
                      </div>
                      <div className="ml-2 h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-[#C6FF00]" style={{ width: `${(l.going/l.total)*100}%` }} />
                      </div>
                    </div>
                    <button
                      onClick={() => router.push("/team-builder")}
                      className="rounded-full px-4 py-1.5 text-xs font-display tracking-[0.2em] uppercase cursor-pointer transition"
                      style={{
                        background: i === 0 ? "#C6FF00" : "rgba(255,255,255,0.06)",
                        color: i === 0 ? "#05070B" : "#fff",
                        border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {i === 0 ? "Join" : "View"}
                    </button>
                  </div>
                </div>
              ))}

              {filteredLobbies.length === 0 && (
                <div className="text-center py-16 text-white/30 text-xs font-medium border border-dashed border-white/8 rounded-2xl bg-white/[0.01]">
                  No active lobbies found.<br/>Press the + button in the header to host a lobby!
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Lobby Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-5">
          <form onSubmit={handleCreateLobby} className="relative w-full max-w-sm rounded-[2rem] border border-[#C6FF00]/30 bg-[#050a0d] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.8)]">
            <button 
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <MapPin className="mx-auto size-12 text-[#C6FF00]" />
            <h2 className="mt-4 text-2xl font-display uppercase tracking-wider text-center text-white italic">Host Lobby</h2>
            <p className="mt-1.5 text-xs text-white/50 text-center leading-relaxed">
              Create a new match lobby for players to join.
            </p>
            
            <div className="mt-6 space-y-3">
              <input
                placeholder="Lobby Name (e.g. Friday League Match)"
                required
                value={newLobbyName}
                onChange={(e) => setNewLobbyName(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder:text-white/35 outline-none focus:border-[#C6FF00]/50"
              />
              <input
                placeholder="Venue (e.g. Turf Yard · Indiranagar)"
                required
                value={newLobbyVenue}
                onChange={(e) => setNewLobbyVenue(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder:text-white/35 outline-none focus:border-[#C6FF00]/50"
              />
              <div className="grid grid-cols-[1fr_5rem] gap-2">
                <input
                  placeholder="Time (e.g. Today · 9:00 PM)"
                  required
                  value={newLobbyTime}
                  onChange={(e) => setNewLobbyTime(e.target.value)}
                  className="h-11 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder:text-white/35 outline-none focus:border-[#C6FF00]/50"
                />
                <input
                  placeholder="Total Players"
                  type="number"
                  min="2"
                  max="22"
                  required
                  value={newLobbyTotal}
                  onChange={(e) => setNewLobbyTotal(Number(e.target.value))}
                  className="h-11 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder:text-white/35 outline-none focus:border-[#C6FF00]/50 font-bold"
                />
              </div>
              
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#C6FF00] text-black font-display text-sm tracking-wider uppercase cursor-pointer hover:bg-[#b0e600] transition mt-2"
              >
                CREATE LOBBY
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Tab({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 h-8 rounded-full text-[10px] tracking-[0.2em] uppercase cursor-pointer transition duration-200"
      style={{
        background: active ? "#C6FF00" : "transparent",
        color: active ? "#05070B" : "rgba(255,255,255,0.6)",
        border: active ? "none" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {children}
    </button>
  );
}
