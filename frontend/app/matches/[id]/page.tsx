"use client";

import { useState, useEffect, use, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Crown, Loader2, LogOut, Mail, MapPin, Swords, Trophy, UserPlus, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPusherClient } from "@/lib/pusher";
import { toast } from "sonner";
import { InlineTeamBuilder } from "@/components/inline-team-builder";
import { StatSubmissionModal } from "@/components/stat-submission-modal";
import { CloseMatchModal } from "@/components/close-match-modal";
import { PeerVerificationModal } from "@/components/peer-verification-modal";

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
  format: string;
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
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0);
  const [showStatSubmission, setShowStatSubmission] = useState(false);
  const [hasSubmittedStats, setHasSubmittedStats] = useState(false);

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
        
        // Fetch stats if match is closed
        if (data.data.status === "closed") {
          const statsRes = await fetch(`/api/matches/${matchId}/my-stats`);
          const statsData = await statsRes.json();
          if (statsData.success && statsData.hasSubmitted) {
            setHasSubmittedStats(true);
          } else {
            setHasSubmittedStats(false);
            setShowStatSubmission(true);
          }
        }
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

  const checkPendingVerifications = useCallback(async () => {
    if (!matchId || !currentUserId) return;
    try {
      const res = await fetch(`/api/matches/${matchId}/pending-verifications`);
      const data = await res.json();
      if (data.success && data.data) {
        setPendingVerificationCount(data.data.length);
      }
    } catch (err) {
      console.error("Failed to check verifications", err);
    }
  }, [matchId, currentUserId]);

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

  useEffect(() => {
    if (currentUserId && match?.status === "closed") {
      checkPendingVerifications();
    }
  }, [currentUserId, match?.status, checkPendingVerifications]);

  // Listen for real-time updates via Pusher
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `match-${matchId}`;
    const channel = pusher.subscribe(channelName);

    const handleJoined = (data: { participant: any; isFull: boolean }) => {
      const username = data?.participant?.user?.fullName || data?.participant?.user?.username || "A player";
      addNotification(`${username} joined the match!`, data.isFull ? "warning" : "success");
      if (data.isFull) {
        addNotification("Match is now full!", "warning");
      }
      fetchMatchDetails();
    };

    const handleLeft = (data: { userId: string; participantId: string }) => {
      setMatch(prevMatch => {
        if (prevMatch) {
          const leavingPlayer = prevMatch.participants.find(p => p.id === data.participantId);
          const name = leavingPlayer?.user?.fullName || leavingPlayer?.user?.username || "A player";
          addNotification(`${name} left the match.`, "info");
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
      addNotification("Match has been closed! Opening stats submission...", "warning");
      fetchMatchDetails();
      setTimeout(() => {
        setShowStatSubmission(true);
      }, 1000);
    });
    channel.bind("match-started", () => {
      addNotification("Match has started!", "success");
      fetchMatchDetails();
    });
    channel.bind("stats-submitted", () => {
      // Check if we need to verify them
      checkPendingVerifications();
    });

    return () => {
      channel.unbind("player-joined", handleJoined);
      channel.unbind("player-left", handleLeft);
      channel.unbind("team-assigned", handleTeamAssigned);
      channel.unbind("player-checked-in", handleCheckedIn);
      channel.unbind("teams-balanced");
      channel.unbind("match-closed");
      channel.unbind("match-started");
      channel.unbind("stats-submitted");
      pusher.unsubscribe(channelName);
    };
  }, [matchId, fetchMatchDetails, addNotification, router, checkPendingVerifications]);

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
    if (!confirm("Are you sure you want to leave this match?")) return;
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

  const handleSaveTeams = async (teamA: string[], teamB: string[]) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/save-teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA, teamB })});

      const data = await res.json();
      if (data.success) {
        addNotification("Teams saved successfully!", "success");
        await fetchMatchDetails();
      } else {
        toast.error(data.message || "Failed to save teams");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseMatch = () => {
    setShowCloseModal(true);
  };

  const handleKickPlayer = async (userId: string) => {
    if (!confirm("Are you sure you want to kick this player?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("Player kicked successfully", "success");
        await fetchMatchDetails();
      } else {
        toast.error(data.message || "Failed to kick player");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartMatch = async () => {
    if (!confirm("Are you ready to start the match?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/start`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        addNotification("Match started!", "success");
        await fetchMatchDetails();
      } else {
        toast.error(data.message || "Failed to start match");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };



  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#E5DCC5] flex flex-col items-center justify-center">
        <Loader2 className="size-10 text-[#151515] animate-spin mb-4" />
        <h2 className="text-xl font-display font-black text-[#151515] tracking-widest uppercase italic animate-pulse">Loading Match...</h2>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="stryk-mobile-shell text-[#151515] bg-[#E5DCC5] min-h-screen flex flex-col justify-center items-center px-6 text-center">
        <h1 className="text-2xl font-display font-black italic tracking-widest text-[#151515] uppercase">Match Not Found</h1>
        <p className="text-sm text-[#151515]/60 mt-2 font-semibold">This match may have been cancelled or deleted.</p>
        <button 
          onClick={() => router.push("/matches")}
          className="mt-8 px-6 py-3 rounded-2xl bg-[#151515] text-[#E5DCC5] text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#2A2824] transition-all"
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
  const checkedInCount = participants.filter(p => p.checkedIn).length;
  const hostName = match.creator?.fullName || match.creator?.username || "Host";
  const playerFill = Math.min(100, Math.round((participants.length / Math.max(match.maxPlayers, 1)) * 100));
  const statusLabel = match.status === "open" ? "Open Match" : match.status.replace(/_/g, " ");

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
    <main className="relative min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden overscroll-none bg-[#E5DCC5] bg-[url('/create_card_bg.webp')] bg-cover bg-center bg-fixed bg-no-repeat flex justify-center custom-scrollbar text-[#151515]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(212,248,41,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.55),transparent)]" />

      <div className="relative min-h-[100dvh] flex flex-col px-5 pt-5 pb-28 max-w-md mx-auto z-10 w-full overflow-y-auto">
        {/* Top Header Section */}
        <header className="flex flex-col mb-5 relative">
          <div className="flex items-center justify-between relative z-10">
            <button 
              onClick={() => router.push("/matches")} 
              className="w-11 h-11 rounded-full bg-[#151515]/5 border border-[#151515]/10 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-[#151515]/10 transition shadow-sm"
              type="button"
              aria-label="Back to matches"
            >
              <ArrowLeft size={20} color="#151515" />
            </button>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-display font-bold italic text-[#A28B52] tracking-[0.28em] uppercase text-[10px]">
                Stryk
              </span>
            </div>
            {/* Placeholder for layout balance if needed, or just let justify-between handle it */}
            <div className="w-11 h-11" />
          </div>
          
          <div className="mt-5 flex flex-col items-center text-center">
            <div className="mb-2 flex items-center gap-2 rounded-full bg-[#D4F829] px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#151515] shadow-[0_10px_24px_rgba(212,248,41,0.24),inset_0_1px_0_rgba(255,255,255,0.45)]">
              <span className="size-1.5 rounded-full bg-[#151515]" />
              {statusLabel}
            </div>
            <h1 className="font-display font-black italic uppercase text-[42px] leading-[0.88] tracking-tight text-[#151515] drop-shadow-sm px-2">
              {match.title}
            </h1>
            
            <div className="mt-4 flex max-w-[340px] flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#151515]/82">
                <MapPin size={13} className="text-[#A28B52]" />
                <span>{match.turf ? `${match.turf} (${match.location})` : match.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#151515]/62">
                <Calendar size={13} className="text-[#A28B52]" />
                <span>{formatDateTime(match.matchDate)}</span>
              </div>
            </div>

            <div className="mt-5 grid w-full grid-cols-3 gap-2">
              <MatchMetric icon={<Users size={13} />} label="Players" value={`${participants.length}/${match.maxPlayers}`} />
              <MatchMetric icon={<CheckCircle2 size={13} />} label="Checked" value={`${checkedInCount}`} />
              <MatchMetric icon={<Crown size={13} />} label="Host" value={hostName.split(" ")[0] || "Host"} />
            </div>

            <div className="mt-3 w-full rounded-[1.35rem] border border-[#151515]/10 bg-[#151515]/6 p-3 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.22em] text-[#8A6A28]">
                <span>Lobby Fill</span>
                <span>{playerFill}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#151515]/12">
                <div className="h-full rounded-full bg-[#D4F829] shadow-[0_0_14px_rgba(212,248,41,0.45)]" style={{ width: `${playerFill}%` }} />
              </div>
            </div>
          </div>
        </header>



        {/* Verification Alert */}
        {pendingVerificationCount > 0 && (
          <div className="mb-4 p-4 rounded-[2rem] bg-[#151515] flex items-center justify-between shadow-2xl border border-[#D4F829]/15">
            <div className="flex-1 px-2">
              <h3 className="text-[#D4F829] font-black text-[11px] uppercase tracking-[0.2em]">Action Required</h3>
              <p className="text-white/80 text-[10px] mt-0.5 leading-tight">
                You have {pendingVerificationCount} peer stat submissions to review.
              </p>
            </div>
            <button
              onClick={() => setShowVerificationModal(true)}
              className="ml-3 px-4 h-10 rounded-2xl bg-[#D4F829] text-[#151515] font-bold text-[10px] uppercase tracking-widest hover:bg-[#c3e626] transition shadow-sm"
            >
              Verify
            </button>
          </div>
        )}



        {/* Inline Squad Builder - REPLACES old lists */}
        {match && (
          <div className="mt-2 w-full">
            <div className="mb-3 grid grid-cols-3 gap-2">
              <TeamChip label="Team A" value={teamAPlayers.length} tone="lime" />
              <TeamChip label="Free Pool" value={unassignedPlayers.length} tone="gold" />
              <TeamChip label="Team B" value={teamBPlayers.length} tone="lime" />
            </div>
            <InlineTeamBuilder
              participants={match.participants}
              onSaveTeams={handleSaveTeams}
              isHost={currentUserId === match.hostId}
              currentUserId={currentUserId}
              onJoinTeam={handleAssignTeam}
            />
          </div>
        )}

        {/* Bottom Primary CTAs */}
        <div className="mt-6 w-full pb-8">
          {isJoined ? (
            <div className="relative flex flex-col gap-3 p-5 rounded-[2rem] bg-[#151515] shadow-[0_28px_70px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4F829]/60 to-transparent" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[11px] tracking-[0.3em] uppercase text-[#A28B52] font-black">
                    Match Actions
                  </h3>
                  <p className="mt-1 text-[10px] font-medium text-white/45">
                    {currentTeam ? `You are drafted to ${currentTeam}.` : "Pick a side on the board when ready."}
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white/50">
                  {isCheckedIn ? "Ready" : "Pending"}
                </div>
              </div>
              
              {!isCheckedIn && (
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="w-full h-14 rounded-full bg-[#D4F829] hover:bg-[#c3e626] text-[#151515] text-[12px] font-display tracking-[0.18em] uppercase font-black transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-[0_12px_32px_rgba(212,248,41,0.28),inset_0_1px_0_rgba(255,255,255,0.55)]"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-[#151515]" />
                      CHECKING IN...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      {"I'M HERE (CHECK IN)"}
                    </>
                  )}
                </button>
              )}
              {isCheckedIn && (
                <div className="flex h-14 items-center justify-center gap-2 rounded-full border border-[#D4F829]/30 bg-[#D4F829]/10 text-[11px] font-black uppercase tracking-[0.18em] text-[#D4F829]">
                  <CheckCircle2 size={15} />
                  Checked in
                </div>
              )}
              
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full h-[52px] rounded-full bg-[#1c1c1e] hover:bg-[#242426] text-white text-[11px] font-display tracking-[0.18em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2 border border-white/5"
              >
                <Mail size={14} />
                INVITE FRIENDS
              </button>
              
              {currentUserId === match.hostId && match.status !== "closed" && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleStartMatch}
                    disabled={actionLoading || match.status === "in_progress"}
                    className="w-full h-12 rounded-full bg-[#3f451b] hover:bg-[#4a5220] text-[#D4F829] text-[10px] font-display tracking-[0.16em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Swords size={13} />
                    {match.status === "in_progress" ? "STARTED" : "START MATCH"}
                  </button>
                  <button
                    onClick={handleCloseMatch}
                    disabled={actionLoading}
                    className="w-full h-12 rounded-full bg-[#3a1515] hover:bg-[#4a1b1b] text-[#ff4444] text-[10px] font-display tracking-[0.16em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    CLOSE MATCH
                  </button>
                </div>
              )}
              <button
                onClick={handleLeaveMatch}
                disabled={actionLoading}
                className="w-full h-12 rounded-full border border-red-500/30 bg-transparent hover:bg-red-500/10 text-red-500/80 hover:text-red-500 text-[11px] font-display tracking-[0.18em] uppercase font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-red-500" />
                    LEAVING...
                  </>
                ) : (
                  <>
                    <LogOut size={13} />
                    LEAVE MATCH
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleJoinMatch}
              disabled={actionLoading || participants.length >= match.maxPlayers}
              className="w-full h-14 rounded-full bg-[#D4F829] hover:bg-[#c3e626] text-[#151515] text-[13px] font-display tracking-[0.18em] uppercase font-black transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_12px_32px_rgba(212,248,41,0.28),inset_0_1px_0_rgba(255,255,255,0.55)]"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin text-[#151515]" />
                  JOINING...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  {participants.length >= match.maxPlayers ? "MATCH FULL" : "JOIN MATCH"}
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
              className="relative w-full max-w-md bg-[#E5DCC5] border border-[#151515]/10 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl uppercase italic tracking-wide text-[#151515]">Invite Friends</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-full hover:bg-[#151515]/5 text-[#151515]/50 hover:text-[#151515] transition">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {friendsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#A28B52]" /></div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-10 text-[#151515]/40 text-sm">No friends found. Add some friends first!</div>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/40 border border-[#151515]/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover border border-[#151515]/10" />
                        <div>
                          <div className="text-sm font-bold text-[#151515]">{friend.name}</div>
                          <div className="text-[10px] text-[#151515]/50">@{friend.handle}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInviteFriend(friend.id)}
                        disabled={invitingFriendId === friend.id}
                        className="px-4 py-2 rounded-xl bg-[#D4F829] text-[#151515] hover:bg-[#c3e626] text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
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



      {match && currentUserId && (
        <StatSubmissionModal
          isOpen={showStatSubmission}
          onClose={() => setShowStatSubmission(false)}
          matchId={matchId}
          matchFormat={match.format}
          isGoalkeeper={match.participants.find(p => p.userId === currentUserId)?.user?.position === "GK"}
          onSuccess={() => {
            setHasSubmittedStats(true);
            fetchMatchDetails();
          }}
        />
      )}

      {match && (
        <CloseMatchModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          matchId={matchId}
        />
      )}

      {match && (
        <PeerVerificationModal
          isOpen={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false);
            checkPendingVerifications();
          }}
          matchId={matchId}
        />
      )}
    </main>
  );
}

function MatchMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[1.1rem] border border-[#151515]/10 bg-[#151515]/6 px-3 py-3 text-left shadow-sm backdrop-blur-sm">
      <div className="mb-1.5 flex items-center gap-1.5 text-[#A28B52]">
        {icon}
        <span className="truncate text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="truncate font-display text-[21px] font-black uppercase italic leading-none tracking-wide text-[#151515]">
        {value}
      </div>
    </div>
  );
}

function TeamChip({ label, value, tone }: { label: string; value: number; tone: "lime" | "gold" }) {
  const active = tone === "lime";
  return (
    <div className="rounded-[1rem] border border-[#151515]/10 bg-[#151515] px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
      <div className={`text-[8px] font-black uppercase tracking-[0.2em] ${active ? "text-[#D4F829]" : "text-[#A28B52]"}`}>
        {label}
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-display text-[22px] font-black italic leading-none text-white">{value}</span>
        <span className={`size-2 rounded-full ${active ? "bg-[#D4F829] shadow-[0_0_10px_rgba(212,248,41,0.8)]" : "bg-[#A28B52]"}`} />
      </div>
    </div>
  );
}

