"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Users, Loader2, User, LogOut, UserPlus, Sparkles, CheckCircle2, Mail, X, MessageSquare, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPusherClient } from "@/lib/pusher";
import { toast } from "sonner";

interface MatchParticipant {
  id: string;
  matchId: string;
  userId: string;
  team: string | null;
  checkedIn: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
    overall: number;
    position: string | null;
    playStyle: string | null;
  };
}

interface MatchCreator {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  overall: number;
  position: string | null;
}

interface MatchDetails {
  id: string;
  title: string;
  turf?: string;
  location: string;
  matchDate: string;
  maxPlayers: number;
  status: string;
  discordLink?: string;
  hostId: string;
  createdAt: string;
  participants: MatchParticipant[];
  creator: MatchCreator | null;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function MatchDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const matchId = resolvedParams.id;

  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [invitingFriendId, setInvitingFriendId] = useState<string | null>(null);
  const [discordLinkEdit, setDiscordLinkEdit] = useState("");
  const [isEditingDiscord, setIsEditingDiscord] = useState(false);

  const addNotification = useCallback((message: string, type: "info" | "success" | "warning" = "info") => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "warning") {
      toast.warning(message);
    } else {
      toast(message);
    }
  }, []);

  // Fetch match details
  const fetchMatchDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      const data = await res.json();
      if (data.success) {
        setMatch(data.data);
      } else {
        setMatch(null);
      }
    } catch (err) {
      console.error("Failed to fetch match details:", err);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  // Sync profile to get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await fetch("/api/profile/me");
        const data = await res.json();
        if (data.success && data.player) {
          setCurrentUserId(data.player.id);
        } else if (data && data.id) {
          setCurrentUserId(data.id);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    fetchUserId();
    fetchMatchDetails();
  }, [fetchMatchDetails]);

  // Listen for real-time updates via Pusher
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `match-${matchId}`;
    const channel = pusher.subscribe(channelName);

    const handleJoined = (data: { participant: any; isFull: boolean }) => {
      const username = data?.participant?.user?.fullName || data?.participant?.user?.username || "A player";
      addNotification(`${username} joined the lobby!`, data.isFull ? "warning" : "success");
      if (data.isFull) {
        addNotification("Match lobby is now full!", "warning");
      }
      fetchMatchDetails();
    };

    const handleLeft = (data: { userId: string; participantId: string }) => {
      setMatch(prevMatch => {
        if (prevMatch) {
          const leavingPlayer = prevMatch.participants.find(p => p.id === data.participantId);
          const name = leavingPlayer?.user?.fullName || leavingPlayer?.user?.username || "A player";
          addNotification(`${name} left the lobby.`, "info");
        }
        return prevMatch;
      });
      fetchMatchDetails();
    };

    const handleTeamAssigned = (data: { participantId: string; userId: string; team: string | null }) => {
      setMatch(prevMatch => {
        if (prevMatch) {
          const player = prevMatch.participants.find(p => p.id === data.participantId);
          const name = player?.user?.fullName || player?.user?.username || "A player";
          const teamLabel = data.team ? data.team : "unassigned pool";
          addNotification(`${name} drafted to ${teamLabel}`, "info");
        }
        return prevMatch;
      });
      fetchMatchDetails();
    };

    const handleCheckedIn = (data: { userId: string; username: string; fullName: string; participantId: string }) => {
      addNotification(`${data.fullName} has checked in!`, "success");
      fetchMatchDetails();
    };

    channel.bind("player-joined", handleJoined);
    channel.bind("player-left", handleLeft);
    channel.bind("team-assigned", handleTeamAssigned);
    channel.bind("player-checked-in", handleCheckedIn);
    channel.bind("teams-balanced", () => {
      addNotification("Teams have been auto-balanced by AI!", "success");
      fetchMatchDetails();
    });
    channel.bind("match-closed", () => {
      addNotification("Match has been closed! Redirecting to stats submission...", "warning");
      setTimeout(() => {
        router.push("/submit");
      }, 2000);
    });

    return () => {
      channel.unbind("player-joined", handleJoined);
      channel.unbind("player-left", handleLeft);
      channel.unbind("team-assigned", handleTeamAssigned);
      channel.unbind("player-checked-in", handleCheckedIn);
      channel.unbind("teams-balanced");
      channel.unbind("match-closed");
      pusher.unsubscribe(channelName);
    };
  }, [matchId, fetchMatchDetails, addNotification, router]);

  useEffect(() => {
    if (!showInviteModal) return;
    async function fetchFriends() {
      setFriendsLoading(true);
      try {
        const res = await fetch("/api/friends");
        const data = await res.json();
        if (data.success) {
          setFriends(data.friends.map((f: any) => ({
            id: f.user.id,
            name: f.user.fullName || f.user.username,
            handle: f.user.username,
            avatar: f.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.user.username)}`
          })));
        }
      } catch (err) {
        console.error("Failed to fetch friends", err);
      } finally {
        setFriendsLoading(false);
      }
    }
    fetchFriends();
  }, [showInviteModal]);

  const handleInviteFriend = async (friendId: string) => {
    setInvitingFriendId(friendId);
    try {
      const senderName = currentUserId ? (match?.participants.find(p => p.userId === currentUserId)?.user.fullName || "A friend") : "A friend";
      
      const res = await fetch(`/api/matches/${matchId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          receiverId: friendId,
          senderName: senderName,
          matchTitle: match?.title || "a match"
        })
      });
      const data = await res.json();
      if (data.success || data.message === "Already invited") {
        toast.success(data.message === "Already invited" ? "Already invited" : "Invite sent!");
      } else {
        toast.error(data.message || data.detail || "Failed to send invite");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setInvitingFriendId(null);
    }
  };

  const handleJoinMatch = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/matches/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })});

      const data = await res.json();
      if (data.success) {
        await fetchMatchDetails();
      } else {
        toast.error(data.message || "Failed to join match");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveMatch = async () => {
    if (!confirm("Are you sure you want to leave this match lobby?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/matches/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })});

      const data = await res.json();
      if (data.success) {
        await fetchMatchDetails();
      } else {
        toast.error(data.message || "Failed to leave match");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTeam = async (teamName: "Team A" | "Team B" | null) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/matches/assign-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          teamName})});

      const data = await res.json();
      if (data.success) {
        await fetchMatchDetails();
      } else {
        toast.error(data.message || "Failed to assign team");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/matches/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })});

      const data = await res.json();
      if (data.success) {
        addNotification("You have checked in successfully!", "success");
        await fetchMatchDetails();
      } else {
        toast.error(data.message || "Failed to check in");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBalanceTeams = async () => {
    if (!confirm("AI will auto-balance all players into two fair teams based on their OVR ratings. Continue?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/matches/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })});

      const data = await res.json();
      if (data.success) {
        addNotification(
          `Teams balanced! Rating diff: ${data.data.ratingDiff} (Avg A: ${data.data.avgA} vs Avg B: ${data.data.avgB})`,
          "success"
        );
        await fetchMatchDetails();
      } else {
        toast.error(data.message || "Failed to balance teams");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseMatch = async () => {
    if (!confirm("Are you sure you want to close this match lobby? This will trigger stats submission for all players.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/close`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        addNotification("Match closed successfully!", "success");
        // We will rely on the Pusher event to redirect us and others.
      } else {
        toast.error(data.message || "Failed to close match");
        setActionLoading(false); // only disable loader if failed, otherwise wait for redirect
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
      setActionLoading(false);
    }
  };

  const handleUpdateDiscordLink = async (link: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordLink: link }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("Discord link updated!", "success");
        await fetchMatchDetails();
      } else {
        toast.error(data.message || "Failed to update Discord link");
      }
    } catch (err) {
      toast.error("An error occurred.");
    }
  };

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white flex items-center justify-center">
        <Loader2 className="size-10 text-[#C6FF00] animate-spin" />
      </main>
    );
  }

  if (!match) {
    return (
      <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen flex flex-col justify-center items-center px-6 text-center">
        <h1 className="text-xl font-bold text-red-400 uppercase tracking-widest">Match Not Found</h1>
        <p className="text-xs text-white/50 mt-2">This match lobby may have been cancelled or deleted.</p>
        <button 
          onClick={() => router.push("/matches")}
          className="mt-6 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition"
        >
          Back to Matches
        </button>
      </main>
    );
  }

  // Parse participants
  const participants = match.participants || [];
  const isJoined = currentUserId && participants.some(p => p.userId === currentUserId);
  const currentUserParticipant = currentUserId && participants.find(p => p.userId === currentUserId);
  const currentTeam = currentUserParticipant ? currentUserParticipant.team : null;
  const isCheckedIn = currentUserParticipant ? currentUserParticipant.checkedIn : false;

  // Group participants by teams
  const teamAPlayers = participants.filter(p => p.team === "Team A");
  const teamBPlayers = participants.filter(p => p.team === "Team B");
  const unassignedPlayers = participants.filter(p => p.team !== "Team A" && p.team !== "Team B");

  // Helper to format date
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true});
    } catch (err) {
      return dateStr;
    }
  };

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,255,0,0.08),transparent_50%)] pointer-events-none" />



      <div className="relative h-full flex flex-col px-5 pt-6 pb-28 max-w-md mx-auto z-10 w-full overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.push("/matches")} 
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#C6FF00] font-bold">Lobby details</div>
          <div className="w-9 h-9" />
        </header>

        {/* Turf Poster Banner */}
        <div className="w-full h-36 rounded-[2rem] bg-gradient-to-br from-[#151515] to-[#0A0D14] border border-white/10 relative overflow-hidden flex flex-col justify-end p-5 mb-6 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(198,255,0,0.15),transparent_60%)] pointer-events-none" />
          <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/20 text-[#C6FF00] text-[9px] uppercase tracking-widest font-bold">
            {match.status}
          </div>
          <h1 className="font-display text-2xl uppercase tracking-wider italic leading-none truncate">
            {match.title}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-white/50 mt-2">
            <MapPin size={13} className="text-[#C6FF00]" />
            <span className="truncate">{match.turf ? `${match.turf} (${match.location})` : match.location}</span>
          </div>
        </div>

        {/* Schedule & Info */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-[#C6FF00] mt-0.5 shrink-0" />
            <div>
              <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold block mb-0.5">Lobby Schedule</span>
              <span className="text-xs text-white/85 leading-snug">{formatDateTime(match.matchDate)}</span>
            </div>
          </div>

          <div className="border-t border-white/5 my-2" />

          <div className="flex items-start gap-3">
            <Users size={16} className="text-[#C6FF00] mt-0.5 shrink-0" />
            <div>
              <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold block mb-0.5">Capacity</span>
              <span className="text-xs text-white/85 leading-none">
                {participants.length} / {match.maxPlayers} Players joined
              </span>
            </div>
          </div>

          {(match.discordLink || currentUserId === match.hostId) && (
            <>
              <div className="border-t border-white/5 my-2" />
              <div className="flex items-start gap-3">
                <MessageSquare size={16} className="text-[#5865F2] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold block mb-0.5">Discord Lobby</span>
                  {isEditingDiscord ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                        type="url"
                        value={discordLinkEdit}
                        onChange={(e) => setDiscordLinkEdit(e.target.value)}
                        placeholder="https://discord.gg/..."
                        className="w-full bg-[#151515] border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-[#5865F2]"
                      />
                      <button 
                        onClick={() => {
                          handleUpdateDiscordLink(discordLinkEdit);
                          setIsEditingDiscord(false);
                        }}
                        className="p-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white transition"
                      >
                        <Check size={12} />
                      </button>
                      <button 
                        onClick={() => setIsEditingDiscord(false)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      {match.discordLink ? (
                        <a href={match.discordLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#5865F2] hover:underline font-semibold leading-none flex items-center gap-1">
                          Join Voice Channel
                        </a>
                      ) : (
                        <span className="text-xs text-white/50 leading-none">No link added</span>
                      )}
                      
                      {currentUserId === match.hostId && (
                        <button 
                          onClick={() => {
                            setDiscordLinkEdit(match.discordLink || "");
                            setIsEditingDiscord(true);
                          }}
                          className="text-[9px] uppercase font-bold text-white/40 hover:text-white transition tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Captain/Organizer Section */}
        {match.creator && (
          <div className="mb-6">
            <h2 className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-bold mb-3 pl-1">Lobby Captain</h2>
            <div className="p-3 rounded-2xl border border-[#C6FF00]/20 bg-[#C6FF00]/5 flex items-center gap-4">
              <div className="relative size-12 rounded-full overflow-hidden border border-[#C6FF00]/40 bg-[#0A0D15] shrink-0 flex items-center justify-center">
                {match.creator.avatarUrl ? (
                   
                  <img src={match.creator.avatarUrl} alt={match.creator.fullName || match.creator.username} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-[#C6FF00]/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{match.creator.fullName || match.creator.username}</div>
                <div className="text-[10px] text-[#C6FF00] uppercase tracking-wider font-semibold mt-0.5">
                  @{match.creator.username}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end px-2">
                <span className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">OVR</span>
                <span className="font-display text-lg text-white font-bold">{match.creator.overall}</span>
              </div>
            </div>
          </div>
        )}

        {/* Teams Dashboard */}
        <div className="space-y-6">
          {/* AI Balance Button */}
          {isJoined && participants.length >= 2 && match.hostId === currentUserId && (
            <button
              onClick={handleBalanceTeams}
              disabled={actionLoading}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] hover:from-[#6d28d9] hover:to-[#9333ea] text-white text-[10px] font-display tracking-[0.2em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_10px_30px_-8px_rgba(168,85,247,0.5)]"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  BALANCING...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  AI Auto-Balance Teams
                </>
              )}
            </button>
          )}
          {/* Team A */}
          <div className="rounded-3xl border border-white/5 bg-[#151515]/10 p-4 relative">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C6FF00]" />
                <span className="font-display text-sm tracking-widest uppercase">Team A</span>
                <span className="text-[10px] text-white/40 font-semibold">({teamAPlayers.length} players)</span>
              </div>
              {isJoined && currentTeam !== "Team A" && (
                <button
                  onClick={() => handleAssignTeam("Team A")}
                  disabled={actionLoading}
                  className="px-2.5 py-1 rounded-lg bg-[#C6FF00]/10 hover:bg-[#C6FF00]/20 text-[#C6FF00] text-[9px] uppercase font-bold tracking-widest transition flex items-center gap-1 cursor-pointer"
                >
                  Join Team A
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {teamAPlayers.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-white/5 bg-white/[0.01] text-center text-[10px] uppercase tracking-wider text-white/25">
                  No players assigned to Team A
                </div>
              ) : (
                teamAPlayers.map(p => (
                  <PlayerRow key={p.id} participant={p} showJoinedIcon={currentUserId === p.userId} />
                ))
              )}
            </div>
          </div>

          {/* Team B */}
          <div className="rounded-3xl border border-white/5 bg-[#151515]/10 p-4 relative">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#5b8cff]" />
                <span className="font-display text-sm tracking-widest uppercase">Team B</span>
                <span className="text-[10px] text-white/40 font-semibold">({teamBPlayers.length} players)</span>
              </div>
              {isJoined && currentTeam !== "Team B" && (
                <button
                  onClick={() => handleAssignTeam("Team B")}
                  disabled={actionLoading}
                  className="px-2.5 py-1 rounded-lg bg-[#5b8cff]/10 hover:bg-[#5b8cff]/20 text-[#5b8cff] text-[9px] uppercase font-bold tracking-widest transition flex items-center gap-1 cursor-pointer"
                >
                  Join Team B
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {teamBPlayers.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-white/5 bg-white/[0.01] text-center text-[10px] uppercase tracking-wider text-white/25">
                  No players assigned to Team B
                </div>
              ) : (
                teamBPlayers.map(p => (
                  <PlayerRow key={p.id} participant={p} showJoinedIcon={currentUserId === p.userId} />
                ))
              )}
            </div>
          </div>

          {/* Unassigned Pool */}
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-4">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/45 font-bold">Lobby Draft Pool</span>
              {isJoined && currentTeam !== null && (
                <button
                  onClick={() => handleAssignTeam(null)}
                  disabled={actionLoading}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-[9px] uppercase font-bold tracking-widest transition cursor-pointer"
                >
                  Leave Team
                </button>
              )}
            </div>

            <div className="space-y-2">
              {unassignedPlayers.length === 0 ? (
                <div className="py-2 text-center text-[10px] uppercase tracking-wider text-white/20 italic">
                  All players drafted onto teams
                </div>
              ) : (
                unassignedPlayers.map(p => (
                  <PlayerRow key={p.id} participant={p} showJoinedIcon={currentUserId === p.userId} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Primary CTAs */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-[#05070B]/80 backdrop-blur-lg border-t border-white/5 max-w-md mx-auto z-20">
          {isJoined ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full h-11 mb-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[11px] font-display tracking-[0.2em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <Mail size={14} />
                INVITE FRIENDS
              </button>
              {!isCheckedIn && (
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="w-full h-12 rounded-2xl bg-[#C6FF00] hover:bg-[#b0e600] text-black text-[11px] font-display tracking-[0.2em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-[0_20px_40px_-10px_rgba(198,255,0,0.4)] animate-pulse"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-black" />
                      CHECKING IN...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      {"I'M HERE (CHECK IN)"}
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleLeaveMatch}
                disabled={actionLoading}
                className="w-full h-11 rounded-2xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-display tracking-[0.2em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-red-400" />
                    LEAVING...
                  </>
                ) : (
                  <>
                    <LogOut size={14} />
                    LEAVE MATCH LOBBY
                  </>
                )}
              </button>
              {currentUserId === match.hostId && (
                <button
                  onClick={handleCloseMatch}
                  disabled={actionLoading}
                  className="w-full h-11 rounded-2xl border border-[#A28B52]/40 bg-[#151515] hover:bg-white/5 text-[#A28B52] text-[11px] font-display tracking-[0.2em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-[#A28B52]" />
                      CLOSING...
                    </>
                  ) : (
                    <>
                      <X size={14} />
                      CLOSE MATCH LOBBY
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleJoinMatch}
              disabled={actionLoading || participants.length >= match.maxPlayers}
              className="w-full h-12 rounded-2xl bg-[#C6FF00] hover:bg-[#b0e600] text-black text-[11px] font-display tracking-[0.2em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_20px_40px_-10px_rgba(198,255,0,0.4)]"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin text-black" />
                  JOINING...
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  {participants.length >= match.maxPlayers ? "LOBBY FULL" : "JOIN MATCH LOBBY"}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#151515] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl uppercase italic tracking-wide text-white">Invite Friends</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {friendsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#C6FF00]" /></div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-10 text-white/40 text-sm">No friends found. Add some friends first!</div>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        <div>
                          <div className="text-sm font-bold text-white">{friend.name}</div>
                          <div className="text-[10px] text-white/50">@{friend.handle}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInviteFriend(friend.id)}
                        disabled={invitingFriendId === friend.id}
                        className="px-4 py-2 rounded-xl bg-[#C6FF00]/10 text-[#C6FF00] hover:bg-[#C6FF00]/20 text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {invitingFriendId === friend.id ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                        {invitingFriendId === friend.id ? "SENDING" : "INVITE"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function PlayerRow({ participant, showJoinedIcon }: { participant: MatchParticipant; showJoinedIcon?: boolean }) {
  const user = participant.user;
  return (
    <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-center gap-3">
      <div className="relative size-8 rounded-full overflow-hidden border border-white/10 bg-[#151515] shrink-0 flex items-center justify-center">
        {user.avatarUrl ? (
           
          <img src={user.avatarUrl} alt={user.fullName || user.username} className="w-full h-full object-cover" />
        ) : (
          <User size={14} className="text-white/20" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5 animate-fade-in">
          {user.fullName || user.username}
          {showJoinedIcon && (
            <span className="px-1.5 py-0.5 rounded bg-[#C6FF00]/20 text-[#C6FF00] text-[8px] uppercase tracking-wider font-bold">You</span>
          )}
          {participant.checkedIn && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[7px] uppercase tracking-widest font-black flex items-center gap-0.5 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)] scale-[0.9] origin-left shrink-0">
              <CheckCircle2 size={7} className="fill-emerald-400/20" />
              Here
            </span>
          )}
        </div>
        <div className="text-[9px] text-white/40 uppercase font-medium tracking-wide mt-0.5">
          {user.position || "N/A"} &bull; {user.playStyle || "N/A"}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end px-1.5">
        <span className="text-[9px] uppercase tracking-widest text-white/35">OVR</span>
        <span className="font-display text-xs text-white font-bold">{user.overall}</span>
      </div>
    </div>
  );
}
