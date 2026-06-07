"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Users, Loader2, User, LogOut, UserPlus, Sparkles, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getPusherClient } from "@/lib/pusher";

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
  location: string;
  dateTime: string;
  maxPlayers: number;
  status: string;
  creatorId: string;
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

  interface Notification {
    id: string;
    message: string;
    type: "info" | "success" | "warning";
  }
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: "info" | "success" | "warning" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
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

    return () => {
      channel.unbind("player-joined", handleJoined);
      channel.unbind("player-left", handleLeft);
      channel.unbind("team-assigned", handleTeamAssigned);
      channel.unbind("player-checked-in", handleCheckedIn);
      channel.unbind("teams-balanced");
      pusher.unsubscribe(channelName);
    };
  }, [matchId, fetchMatchDetails, addNotification]);

  const handleJoinMatch = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/matches/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchMatchDetails();
      } else {
        alert(data.message || "Failed to join match");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
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
        body: JSON.stringify({ matchId }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchMatchDetails();
      } else {
        alert(data.message || "Failed to leave match");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
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
          teamName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchMatchDetails();
      } else {
        alert(data.message || "Failed to assign team");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
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
        body: JSON.stringify({ matchId }),
      });

      const data = await res.json();
      if (data.success) {
        addNotification("You have checked in successfully!", "success");
        await fetchMatchDetails();
      } else {
        alert(data.message || "Failed to check in");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
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
        body: JSON.stringify({ matchId }),
      });

      const data = await res.json();
      if (data.success) {
        addNotification(
          `Teams balanced! Rating diff: ${data.data.ratingDiff} (Avg A: ${data.data.avgA} vs Avg B: ${data.data.avgB})`,
          "success"
        );
        await fetchMatchDetails();
      } else {
        alert(data.message || "Failed to balance teams");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
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
        hour12: true,
      });
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,255,0,0.08),transparent_50%)] pointer-events-none" />

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 left-4 z-50 flex flex-col gap-2 max-w-sm mx-auto pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`p-3.5 rounded-2xl border backdrop-blur-md shadow-lg pointer-events-auto flex items-center gap-2.5 ${
                n.type === "success"
                  ? "bg-[#C6FF00]/10 border-[#C6FF00]/20 text-[#C6FF00]"
                  : n.type === "warning"
                  ? "bg-[#FFB300]/10 border-[#FFB300]/20 text-[#FFB300]"
                  : "bg-white/10 border-white/10 text-white"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                n.type === "success" ? "bg-[#C6FF00]" : n.type === "warning" ? "bg-[#FFB300]" : "bg-white"
              }`} />
              <span className="text-xs font-semibold tracking-wide">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
        <div className="w-full h-36 rounded-[2rem] bg-gradient-to-br from-[#0B1020] to-[#0A0D14] border border-white/10 relative overflow-hidden flex flex-col justify-end p-5 mb-6 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(198,255,0,0.15),transparent_60%)] pointer-events-none" />
          <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/20 text-[#C6FF00] text-[9px] uppercase tracking-widest font-bold">
            {match.status}
          </div>
          <h1 className="font-display text-2xl uppercase tracking-wider italic leading-none truncate">
            {match.title}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-white/50 mt-2">
            <MapPin size={13} className="text-[#C6FF00]" />
            <span className="truncate">{match.location}</span>
          </div>
        </div>

        {/* Schedule & Info */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-[#C6FF00] mt-0.5 shrink-0" />
            <div>
              <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold block mb-0.5">Lobby Schedule</span>
              <span className="text-xs text-white/85 leading-snug">{formatDateTime(match.dateTime)}</span>
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
        </div>

        {/* Captain/Organizer Section */}
        {match.creator && (
          <div className="mb-6">
            <h2 className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-bold mb-3 pl-1">Lobby Captain</h2>
            <div className="p-3 rounded-2xl border border-[#C6FF00]/20 bg-[#C6FF00]/5 flex items-center gap-4">
              <div className="relative size-12 rounded-full overflow-hidden border border-[#C6FF00]/40 bg-[#0A0D15] shrink-0 flex items-center justify-center">
                {match.creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
          {isJoined && participants.length >= 2 && match.creatorId === currentUserId && (
            <button
              onClick={handleBalanceTeams}
              disabled={actionLoading}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] hover:from-[#6d28d9] hover:to-[#9333ea] text-white text-[10px] font-display tracking-[0.2em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_10px_30px_-8px_rgba(168,85,247,0.5)]"
            >
              <Sparkles size={14} />
              AI Auto-Balance Teams
            </button>
          )}
          {/* Team A */}
          <div className="rounded-3xl border border-white/5 bg-[#0B1020]/10 p-4 relative">
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
          <div className="rounded-3xl border border-white/5 bg-[#0B1020]/10 p-4 relative">
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
              {!isCheckedIn && (
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="w-full h-12 rounded-2xl bg-[#C6FF00] hover:bg-[#b0e600] text-black text-[11px] font-display tracking-[0.2em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-[0_20px_40px_-10px_rgba(198,255,0,0.4)] animate-pulse"
                >
                  <CheckCircle2 size={14} />
                  {"I'M HERE (CHECK IN)"}
                </button>
              )}
              <button
                onClick={handleLeaveMatch}
                disabled={actionLoading}
                className="w-full h-11 rounded-2xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-display tracking-[0.2em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut size={14} />
                LEAVE MATCH LOBBY
              </button>
            </div>
          ) : (
            <button
              onClick={handleJoinMatch}
              disabled={actionLoading || participants.length >= match.maxPlayers}
              className="w-full h-12 rounded-2xl bg-[#C6FF00] hover:bg-[#b0e600] text-black text-[11px] font-display tracking-[0.2em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_20px_40px_-10px_rgba(198,255,0,0.4)]"
            >
              <UserPlus size={14} />
              {participants.length >= match.maxPlayers ? "LOBBY FULL" : "JOIN MATCH LOBBY"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function PlayerRow({ participant, showJoinedIcon }: { participant: MatchParticipant; showJoinedIcon?: boolean }) {
  const user = participant.user;
  return (
    <div className="p-2.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-center gap-3">
      <div className="relative size-8 rounded-full overflow-hidden border border-white/10 bg-[#0B1020] shrink-0 flex items-center justify-center">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
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
