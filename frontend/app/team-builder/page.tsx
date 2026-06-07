"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, ShieldCheck, User, X } from "lucide-react";

export default function TeamBuilderPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Invite states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team/me");
      const data = await res.json();
      if (data.success && data.team) {
        setTeam(data.team);
      } else {
        setTeam(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/team/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });
      const data = await res.json();
      if (data.success) {
        // Fetch full populated team info
        await fetchTeam();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim() || !team?.id) return;

    setInviteLoading(true);
    setInviteMessage("");
    setInviteError("");

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          username: inviteUsername.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInviteMessage(`Invitation sent to @${inviteUsername}!`);
        setInviteUsername("");
      } else {
        setInviteError(data.message || "Failed to send invitation");
      }
    } catch (err) {
      console.error(err);
      setInviteError("Something went wrong. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white flex items-center justify-center">
        <Loader2 className="size-10 text-[#C6FF00] animate-spin" />
      </main>
    );
  }

  // If no team, show create team UI
  if (!team) {
    return (
      <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,255,0,0.1),transparent_50%)]" />
        <div className="relative h-full flex flex-col px-5 pt-6 pb-4 max-w-md mx-auto z-10 w-full">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.push("/home")} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10">
              <ArrowLeft size={16} />
            </button>
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/45 font-bold">Team Builder</div>
            <div className="w-9 h-9" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center -mt-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <ShieldCheck size={32} className="text-[#C6FF00]" />
            </div>
            <h1 className="font-display text-3xl uppercase tracking-wide text-center">Start a Club</h1>
            <p className="text-sm text-white/50 text-center mt-2 max-w-[240px]">
              Create your own squad, invite players, and compete in leagues.
            </p>

            <form onSubmit={handleCreateTeam} className="w-full mt-8 space-y-4">
              <input
                type="text"
                placeholder="Team Name (e.g. Phoenix FC)"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full h-14 px-5 rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/40 outline-none focus:border-[#C6FF00]/50 transition duration-300"
              />
              <button
                type="submit"
                disabled={creating || !newTeamName.trim()}
                className="w-full h-14 rounded-2xl bg-[#C6FF00] text-black font-display tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600] disabled:opacity-50"
              >
                {creating ? <Loader2 className="size-5 animate-spin" /> : "CREATE TEAM"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Calculate stats
  const members = team.members || [];
  const captain = members.find((m: any) => m.role === "captain");
  const players = members.filter((m: any) => m.role !== "captain");

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,255,0,0.1),transparent_50%)]" />
      <div className="relative h-full flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto z-10 w-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push("/home")} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10">
            <ArrowLeft size={16} />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#C6FF00] font-bold">Your Squad</div>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Team Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-3xl bg-[#0A0E17] border border-white/10 flex items-center justify-center shadow-2xl shadow-[#C6FF00]/10 relative overflow-hidden mb-5">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#C6FF00]/20 to-transparent" />
             <ShieldCheck size={40} className="text-[#C6FF00] relative z-10" />
          </div>
          <h1 className="font-display text-4xl uppercase tracking-wider text-center">{team.name}</h1>
          <div className="mt-2 flex items-center gap-3">
             <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/60">
               {members.length} Members
             </span>
             <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/60">
               EST. 2026
             </span>
          </div>
        </div>

        {/* Roster Section */}
        <div className="space-y-6">
          {/* Captain */}
          {captain && (
            <div>
              <h2 className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-bold mb-3 pl-1">Captain</h2>
              <div className="p-3 rounded-2xl border border-[#C6FF00]/30 bg-[#C6FF00]/5 flex items-center gap-4">
                 <div className="relative size-12 rounded-full overflow-hidden border border-[#C6FF00]/50 bg-[#0B1020] shrink-0 flex items-center justify-center">
                    {captain.user.avatarUrl ? (
                      <img src={captain.user.avatarUrl} alt={captain.user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-[#C6FF00]/50" />
                    )}
                 </div>
                 <div className="flex-1">
                    <div className="text-sm font-bold text-white truncate">{captain.user.fullName || captain.user.username}</div>
                    <div className="text-[10px] text-[#C6FF00] uppercase tracking-wider mt-0.5">@{captain.user.username}</div>
                 </div>
                 <div className="shrink-0 flex flex-col items-end px-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">OVR</span>
                    <span className="font-display text-lg text-white">{captain.user.overall}</span>
                 </div>
              </div>
            </div>
          )}

          {/* Players */}
          <div>
            <h2 className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-bold mb-3 pl-1">Players</h2>
            <div className="space-y-2">
              {players.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center text-[11px] uppercase tracking-wider text-white/30 font-bold">
                  No other players in squad
                </div>
              ) : (
                players.map((m: any) => (
                  <div key={m.id} className="p-3 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center gap-4">
                     <div className="relative size-10 rounded-full overflow-hidden border border-white/10 bg-[#0B1020] shrink-0 flex items-center justify-center">
                        {m.user.avatarUrl ? (
                          <img src={m.user.avatarUrl} alt={m.user.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} className="text-white/30" />
                        )}
                     </div>
                     <div className="flex-1">
                        <div className="text-sm font-bold text-white truncate">{m.user.fullName || m.user.username}</div>
                     </div>
                     <div className="shrink-0 flex flex-col items-end px-2">
                        <span className="font-display text-sm text-white/80">{m.user.overall}</span>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-5">
          <div className="relative w-full max-w-sm rounded-[2rem] border border-[#C6FF00]/30 bg-[#050a0d] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.8)] flex flex-col">
            <button 
              onClick={() => { setShowInviteModal(false); setInviteUsername(""); setInviteMessage(""); setInviteError(""); }}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
              type="button"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-display uppercase tracking-wider text-xl italic text-white text-center mt-2 mb-2">
              Invite Player
            </h3>
            <p className="text-xs text-white/50 text-center mb-6">
              Enter the player&apos;s username to invite them to your squad.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Username (e.g. rahul123)"
                  value={inviteUsername}
                  onChange={(e) => {
                    setInviteUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                    setInviteMessage("");
                    setInviteError("");
                  }}
                  className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/40 outline-none focus:border-[#C6FF00]/50 transition duration-300"
                />
              </div>

              {inviteMessage && (
                <div className="rounded-xl border border-[#C6FF00]/22 bg-[#C6FF00]/6 p-3 text-center text-xs font-semibold text-[#C6FF00]">
                  {inviteMessage}
                </div>
              )}

              {inviteError && (
                <div className="rounded-xl border border-red-500/22 bg-red-500/7 p-3 text-center text-xs font-semibold text-red-400">
                  {inviteError}
                </div>
              )}

              <button
                type="submit"
                disabled={inviteLoading || !inviteUsername.trim()}
                className="w-full h-12 rounded-xl bg-[#C6FF00] text-black font-display tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600] disabled:opacity-50 text-sm font-bold"
              >
                {inviteLoading ? <Loader2 className="size-4 animate-spin" /> : "SEND INVITATION"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
