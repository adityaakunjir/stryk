"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, ShieldCheck, User, X, Settings, Trash2, Award } from "lucide-react";

export default function TeamBuilderPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Role info
  const [userRole, setUserRole] = useState<string | null>(null);

  // Invite states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");

  // Settings states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editTeamName, setEditTeamName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");

  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team/me");
      const data = await res.json();
      if (data.success && data.team) {
        setTeam(data.team);
        setUserRole(data.userRole || null);
      } else {
        setTeam(null);
        setUserRole(null);
      }
    } catch (err) {
      // Handle error implicitly through loading state fallbacks
    } finally {
      setLoading(false);
    }
  };

  const openSettings = () => {
    if (!team) return;
    setEditTeamName(team.name);
    setEditLogoUrl(team.logoUrl || "");
    setSettingsMessage("");
    setSettingsError("");
    setShowSettingsModal(true);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeamName.trim() || !team?.id) return;

    setSettingsLoading(true);
    setSettingsMessage("");
    setSettingsError("");

    try {
      const res = await fetch("/api/team/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          name: editTeamName.trim(),
          logoUrl: editLogoUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSettingsMessage("Team updated successfully!");
        await fetchTeam();
      } else {
        setSettingsError(data.message || "Failed to update team");
      }
    } catch (err) {
      setSettingsError("An error occurred. Please try again.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the squad?`)) return;

    try {
      const res = await fetch("/api/team/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          action: "kick",
          memberId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchTeam();
      } else {
        alert(data.message || "Failed to remove member");
      }
    } catch (err) {
      alert("An error occurred. Please try again.");
    }
  };

  const handleTransferCaptaincy = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to transfer captaincy to ${memberName}? You will lose captain privileges.`)) return;

    setSettingsLoading(true);
    setSettingsMessage("");
    setSettingsError("");

    try {
      const res = await fetch("/api/team/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          action: "transfer-captaincy",
          newCaptainMemberId: memberId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowSettingsModal(false);
        await fetchTeam();
      } else {
        setSettingsError(data.message || "Failed to transfer captaincy");
      }
    } catch (err) {
      setSettingsError("An error occurred. Please try again.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("WARNING: Are you sure you want to disband this team? All members will be removed and this action CANNOT be undone.")) return;

    setSettingsLoading(true);
    setSettingsMessage("");
    setSettingsError("");

    try {
      const res = await fetch(`/api/team/me?teamId=${team.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setShowSettingsModal(false);
        setTeam(null);
        setUserRole(null);
        router.push("/home");
      } else {
        setSettingsError(data.message || "Failed to delete team");
      }
    } catch (err) {
      setSettingsError("An error occurred. Please try again.");
    } finally {
      setSettingsLoading(false);
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
      // Ignored intentionally
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
                {creating ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    CREATING TEAM...
                  </>
                ) : (
                  "CREATE TEAM"
                )}
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
          <div className="flex gap-2">
            {userRole === "captain" && (
              <button 
                onClick={openSettings}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10"
                title="Team Settings"
              >
                <Settings size={16} />
              </button>
            )}
            <button 
              onClick={() => setShowInviteModal(true)}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10"
              title="Invite Player"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Team Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-3xl bg-[#0A0E17] border border-white/10 flex items-center justify-center shadow-2xl shadow-[#C6FF00]/10 relative overflow-hidden mb-5">
             {team.logoUrl ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover relative z-10" />
             ) : (
               <>
                 <div className="absolute inset-0 bg-gradient-to-tr from-[#C6FF00]/20 to-transparent" />
                 <ShieldCheck size={40} className="text-[#C6FF00] relative z-10" />
               </>
             )}
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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={captain.user.avatarUrl} alt={captain.user.fullName || captain.user.username} className="w-full h-full object-cover" />
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
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.user.avatarUrl} alt={m.user.fullName || m.user.username} className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} className="text-white/30" />
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{m.user.fullName || m.user.username}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 font-medium">@{m.user.username}</div>
                     </div>
                     <div className="shrink-0 flex items-center gap-3">
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">OVR</span>
                           <span className="font-display text-sm text-white/80 font-bold">{m.user.overall}</span>
                        </div>
                        {userRole === "captain" && (
                          <button 
                            onClick={() => handleKickMember(m.id, m.user.fullName || m.user.username)}
                            className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center cursor-pointer hover:bg-red-500/20 transition shrink-0"
                            title="Remove Member"
                          >
                            <X size={14} />
                          </button>
                        )}
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
                {inviteLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    SENDING...
                  </>
                ) : (
                  "SEND INVITATION"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-5 overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#050a0d] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.8)] flex flex-col my-8 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
              type="button"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-display uppercase tracking-wider text-xl italic text-white text-center mt-2 mb-2">
              Team Settings
            </h3>
            <p className="text-xs text-white/50 text-center mb-6">
              Update team details, manage roles, or delete the team.
            </p>

            <div className="space-y-6">
              {/* Change Name & Logo */}
              <form onSubmit={handleUpdateTeam} className="space-y-4">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold block mb-1.5 pl-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/40 outline-none focus:border-[#C6FF00]/50 transition duration-300"
                  />
                </div>

                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold block mb-1.5 pl-1">
                    Team Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[#0A0E17] border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0">
                      {editLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editLogoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ShieldCheck size={24} className="text-white/25" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={logoFileInputRef}
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 transition w-full"
                      >
                        Upload Image
                      </button>
                      {editLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditLogoUrl("")}
                          className="text-[9px] uppercase font-bold tracking-widest text-red-400 hover:text-red-300 block text-center w-full"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Or input logo URL manually */}
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Or enter Image URL"
                      value={editLogoUrl}
                      onChange={(e) => setEditLogoUrl(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-white/5 bg-white/[0.02] text-[11px] text-white/70 placeholder:text-white/30 outline-none focus:border-[#C6FF00]/30 transition"
                    />
                  </div>
                </div>

                {settingsMessage && (
                  <div className="rounded-xl border border-[#C6FF00]/22 bg-[#C6FF00]/6 p-3 text-center text-xs font-semibold text-[#C6FF00]">
                    {settingsMessage}
                  </div>
                )}

                {settingsError && (
                  <div className="rounded-xl border border-red-500/22 bg-red-500/7 p-3 text-center text-xs font-semibold text-red-400">
                    {settingsError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={settingsLoading || !editTeamName.trim()}
                  className="w-full h-11 rounded-xl bg-[#C6FF00] text-black font-display tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600] disabled:opacity-50 text-xs font-bold"
                >
                  {settingsLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      SAVING...
                    </>
                  ) : (
                    "SAVE CHANGES"
                  )}
                </button>
              </form>

              <div className="border-t border-white/10 my-4" />

              {/* Transfer Captaincy */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-bold block mb-2 pl-1">
                  Transfer Captaincy
                </label>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {players.length === 0 ? (
                    <p className="text-[10px] text-white/30 italic text-center py-2">
                      No eligible squad members to transfer captaincy to.
                    </p>
                  ) : (
                    players.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 gap-2">
                        <span className="text-[11px] font-bold text-white truncate max-w-[120px]">
                          {p.user.fullName || p.user.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTransferCaptaincy(p.id, p.user.fullName || p.user.username)}
                          disabled={settingsLoading}
                          className="h-7 px-2.5 rounded-lg bg-[#C6FF00]/10 hover:bg-[#C6FF00]/20 text-[#C6FF00] text-[9px] uppercase font-bold tracking-widest transition flex items-center gap-1 shrink-0"
                        >
                          <Award size={10} />
                          Transfer
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 my-4" />

              {/* Disband Team */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-red-400 font-bold block mb-2 pl-1">
                  Danger Zone
                </label>
                <button
                  type="button"
                  onClick={handleDeleteTeam}
                  disabled={settingsLoading}
                  className="w-full h-11 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-display tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition text-xs font-bold"
                >
                  <Trash2 className="size-4" />
                  DISBAND TEAM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
