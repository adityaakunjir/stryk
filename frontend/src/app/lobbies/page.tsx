"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MapPin, Clock, Users, ArrowLeft } from "lucide-react";

const LOBBIES = [
  {
    id: 1,
    name: "Friday Night League",
    venue: "Turf Yard · Indiranagar",
    time: "Today · 9:00 PM",
    host: "Vikram",
    going: 8,
    total: 10,
    live: true,
  },
  {
    id: 2,
    name: "Sunday Sweat 7s",
    venue: "Goalpoint Arena · HSR",
    time: "Jun 7 · 6:30 PM",
    host: "Kabir",
    going: 6,
    total: 14,
    live: false,
  },
  {
    id: 3,
    name: "Corporate Cup Qualifier",
    venue: "Decathlon Turf · WF",
    time: "Jun 9 · 8:00 PM",
    host: "Rohan",
    going: 11,
    total: 12,
    live: false,
  },
];

export default function LobbiesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLobbies = LOBBIES.filter((l) => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.host.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <main className="stryk-mobile-shell relative min-h-screen text-white overflow-hidden bg-[#05070B]">
      {/* Background gradients */}
      <div
        className="absolute inset-x-0 top-0 h-60 opacity-60 pointer-events-none"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(198,255,0,0.10), transparent 60%)" }}
      />

      <div className="relative min-h-screen flex flex-col px-5 pt-6 pb-4 max-w-md mx-auto z-10">
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
          <button className="w-10 h-10 rounded-full bg-[#C6FF00] text-black flex items-center justify-center cursor-pointer hover:bg-[#b0e600] transition"
            style={{ boxShadow: "0 14px 30px -8px rgba(198,255,0,0.55)" }}>
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center px-3 h-11 focus-within:border-[#C6FF00]/40 transition">
          <Search size={14} className="text-white/50" />
          <input
            placeholder="Search venues, hosts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none px-2 text-xs text-white placeholder:text-white/35 w-full border-0 focus:ring-0 p-0"
          />
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2">
          <Tab active={activeTab === "all"} onClick={() => setActiveTab("all")}>All</Tab>
          <Tab active={activeTab === "my"} onClick={() => setActiveTab("my")}>My Lobbies</Tab>
          <Tab active={activeTab === "friends"} onClick={() => setActiveTab("friends")}>Friends</Tab>
        </div>

        {/* Lobbies List */}
        <div data-scroll-panel className="mt-4 flex-1 space-y-3 pr-0.5">
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
                </div>
                {l.live && (
                  <span className="text-[9px] tracking-[0.25em] uppercase px-2 py-0.5 rounded-full bg-[#C6FF00] text-black font-bold">Live</span>
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
            <div className="text-center py-12 text-white/40 text-sm">
              No lobbies found matching search query.
            </div>
          )}
        </div>
      </div>
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
