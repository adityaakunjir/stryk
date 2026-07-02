"use client";

import { useState, useEffect, use, useCallback, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Crown, Loader2, LogOut, Mail, MapPin, Swords, Trophy, UserPlus, Users, X, Lock, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPusherClient } from "@/lib/pusher";
import { toast } from "sonner";
import { InlineTeamBuilder } from "@/components/inline-team-builder";
import { StatSubmissionModal } from "@/components/stat-submission-modal";
import { CloseMatchModal } from "@/components/close-match-modal";

interface MatchParticipant {
  id: string;
  matchId: string;
  userId: string;
  team: string | null;
  x?: number | null;
  y?: number | null;
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
  privacy: string;
  teamAName: string;
  teamBName: string;
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
  const [userLoading, setUserLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [externalPositionUpdate, setExternalPositionUpdate] = useState<{userId: string; x: number; y: number; team: string | null; ts: number} | null>(null);
  const [invitingFriendId, setInvitingFriendId] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [showStatSubmission, setShowStatSubmission] = useState(false);
  const [hasSubmittedStats, setHasSubmittedStats] = useState(false);
  const [showPrivateJoinModal, setShowPrivateJoinModal] = useState(false);
  const [privateJoinPassword, setPrivateJoinPassword] = useState("");
  const [viewMode, setViewMode] = useState<"roster" | "tactical">("roster");
  const [contentReady, setContentReady] = useState(false);
  const [viewReady, setViewReady] = useState(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchInFlightRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const hostIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    hostIdRef.current = match?.hostId || null;
  }, [match?.hostId]);

  useEffect(() => {
    setContentReady(false);
    setViewReady(false);
  }, [matchId]);

  useEffect(() => {
    if (loading || userLoading || !match) {
      return;
    }

    let cancelled = false;
    const startedAt = performance.now();
    const avatarUrls = Array.from(new Set(
      match.participants
        .map((participant) => participant.user.avatarUrl)
        .filter((url): url is string => Boolean(url))
    )).slice(0, 24);

    const waitForAvatars = Promise.all(
      avatarUrls.map((url) => new Promise<void>((resolve) => {
        const image = new window.Image();
        image.decoding = "async";
        image.onload = () => {
          image.decode?.().catch(() => undefined).finally(resolve);
        };
        image.onerror = () => resolve();
        image.src = url;
      }))
    );

    const timeout = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 1600);
    });

    Promise.race([waitForAvatars, timeout]).then(() => {
      const remainingMinimum = Math.max(0, 900 - (performance.now() - startedAt));
      window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          if (!cancelled) {
            setContentReady(true);
          }
        });
      }, remainingMinimum);
    });

    return () => {
      cancelled = true;
    };
  }, [loading, userLoading, match, matchId]);

  useEffect(() => {
    if (!contentReady) {
      setViewReady(false);
      return;
    }

    setViewReady(false);
    const delay = viewMode === "tactical" ? 650 : 320;
    const timeout = window.setTimeout(() => {
      window.requestAnimationFrame(() => setViewReady(true));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [contentReady, viewMode]);

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
    if (fetchInFlightRef.current) {
      return;
    }
    fetchInFlightRef.current = true;
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      const data = await res.json();
      if (data.success) {
        setMatch(data.data);
        sessionStorage.setItem(`stryk_match_${matchId}`, JSON.stringify(data.data));
        
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
      fetchInFlightRef.current = false;
      setLoading(false);
    }
  }, [matchId]);

  const scheduleFetchMatchDetails = useCallback((delay = 250) => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchTimeoutRef.current = null;
      fetchMatchDetails();
    }, delay);
  }, [fetchMatchDetails]);

  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const checkPendingVerifications = useCallback(async () => {
    if (!matchId || !currentUserId) return;
    try {
      const res = await fetch(`/api/matches/${matchId}/pending-verifications`);
      const data = await res.json();
      if (data.success && data.data) {
        setPendingVerifications(data.data);
      }
    } catch (err) {
      console.error("Failed to check verifications", err);
    }
  }, [matchId, currentUserId]);

  // Hydrate from cache immediately
  useEffect(() => {
    const cachedMatch = sessionStorage.getItem(`stryk_match_${matchId}`);
    if (cachedMatch) {
      try {
        setMatch(JSON.parse(cachedMatch));
        setLoading(false);
      } catch (e) {}
    }
  }, [matchId]);

  // Sync profile to get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      // No local caching for user ID to prevent ghosting across logins
      try {
        const res = await fetch("/api/profile/me", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.player) {
          setCurrentUserId(data.player.id);
        } else if (data && data.id) {
          setCurrentUserId(data.id);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      } finally {
        setUserLoading(false);
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

  // Auto-update match details every 3 seconds ONLY when viewMode is "tactical" (squad builder view)
  useEffect(() => {
    if (viewMode !== "tactical") return;

    const interval = setInterval(() => {
      fetchMatchDetails();
    }, 3000);

    return () => clearInterval(interval);
  }, [viewMode, fetchMatchDetails]);

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
      scheduleFetchMatchDetails();
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
      scheduleFetchMatchDetails();
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
      scheduleFetchMatchDetails();
    };

    const handleCheckedIn = (data: { userId: string; username: string; fullName: string; participantId: string }) => {
      addNotification(`${data.fullName} has checked in!`, "success");
      scheduleFetchMatchDetails();
    };

    channel.bind("player-joined", handleJoined);
    channel.bind("player-left", handleLeft);
    channel.bind("team-assigned", handleTeamAssigned);
    channel.bind("player-checked-in", handleCheckedIn);
    channel.bind("teams-balanced", () => {
      addNotification("Teams have been auto-balanced by AI!", "success");
      scheduleFetchMatchDetails();
    });
    channel.bind("teams-saved", () => {
      // Only re-fetch for non-host users. The host already has the
      // correct local state — re-fetching would reset all positions.
      const userId = currentUserIdRef.current;
      const hostId = hostIdRef.current;
      if (userId && hostId && userId !== hostId) {
        addNotification("Squad tactics updated", "success");
        scheduleFetchMatchDetails();
      }
    });
    channel.bind("match-closed", () => {
      addNotification("Match has been closed! Opening stats submission...", "warning");
      scheduleFetchMatchDetails(100);
      setTimeout(() => {
        setShowStatSubmission(true);
      }, 1000);
    });
    channel.bind("match-started", () => {
      addNotification("Match has started!", "success");
      scheduleFetchMatchDetails();
    });
    channel.bind("position-updated", (data: { userId: string; x: number; y: number; team: string | null }) => {
      setExternalPositionUpdate({ ...data, ts: Date.now() });
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
      channel.unbind("teams-saved");
      channel.unbind("match-closed");
      channel.unbind("match-started");
      channel.unbind("position-updated");
      channel.unbind("stats-submitted");
      pusher.unsubscribe(channelName);
    };
  }, [matchId, scheduleFetchMatchDetails, addNotification, checkPendingVerifications]);

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
    if (match?.privacy === "private") {
      setShowPrivateJoinModal(true);
      return;
    }
    await executeJoin(null);
  };

  const executeJoin = async (password: string | null) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/matches/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, password })});

      const data = await res.json();
      if (data.success) {
        setShowPrivateJoinModal(false);
        setPrivateJoinPassword("");
        toast.success("Successfully joined the match!");
        await fetchMatchDetails();
      } else {
        toast.error(data.message || data.detail || "Failed to join match");
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

  const handleQuickComplete = async () => {
    if (!confirm("Are you sure you want to instantly complete this match without collecting stats?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/quick-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Match completed successfully!");
        router.push("/history");
      } else {
        toast.error(data.message || "Failed to complete match");
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
      const myParticipant = match?.participants.find((p: MatchParticipant) => p.userId === currentUserId);
      if (!myParticipant) {
        toast.error("Participant not found");
        return;
      }
      
      const teamCode = teamName === "Team A" ? "A" : teamName === "Team B" ? "B" : null;

      const res = await fetch("/api/matches/assign-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          participantId: myParticipant.id,
          team: teamCode
        })
      });

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

  // Verification actions directly from page
  const handleVerifyStats = async (targetId: string, accept: boolean) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlayerId: targetId,
          vote: accept ? 1 : -1,
          disputeReason: accept ? undefined : "Disputed from match lobby"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(accept ? "Stats verified!" : "Stats disputed");
        setPendingVerifications(prev => prev.filter(v => v.userId !== targetId));
      } else {
        toast.error(data.message || "Failed to verify");
      }
    } catch (err) {
      toast.error("Error verifying stats");
    }
  };

  const handleUpdatePosition = async (userId: string, x: number | null, y: number | null, team: "Team A" | "Team B" | null) => {
    try {
      const teamCode = team === "Team A" ? "A" : team === "Team B" ? "B" : null;
      await fetch(`/api/matches/${matchId}/update-position`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, x, y, team: teamCode })
      });
    } catch (err) {
      console.error("Failed to update position:", err);
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

  const handleSaveTeams = async (positions: any[]) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/save-teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions })});

      const data = await res.json();
      if (data.success) {
        addNotification("Teams saved successfully!", "success");
        // Do NOT call fetchMatchDetails() here — the host already has
        // the correct local state. Re-fetching would overwrite the
        // playerStates in inline-team-builder via useEffect, causing
        // all cards to jump to random positions.
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

  const handleCompleteMatch = async () => {
    if (!confirm("Are you sure you want to complete the match? This will record stats for all verified players and finalize the match. Unverified stats will be voided.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Match completed successfully!");
        router.push("/matches");
      } else {
        toast.error(data.message || "Failed to complete match.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
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

  const handleUpdateTeamNames = async (teamAName?: string, teamBName?: string) => {
    try {
      const payload: any = {};
      if (teamAName !== undefined) payload.teamAName = teamAName;
      if (teamBName !== undefined) payload.teamBName = teamBName;
      
      const res = await fetch(`/api/matches/${matchId}/team-names`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchMatchDetails();
      } else {
        toast.error(data.message || "Failed to update team name");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating team name");
    }
  };



  if (loading || userLoading || (match && !contentReady)) {
    return (
      <MatchLobbyLoading
        title={loading || userLoading ? "Loading Match" : "Preparing Lobby"}
        subtitle={loading || userLoading ? "Fetching match details" : "Loading player cards and tactics"}
      />
    );
  }

  if (!match) {
    return (
      <main className="stryk-mobile-shell text-white bg-[#151515] min-h-screen flex flex-col justify-center items-center px-6 text-center">
        <h1 className="text-2xl font-display font-black italic tracking-widest text-white uppercase">Match Not Found</h1>
        <p className="text-sm text-white/60 mt-2 font-semibold">This match may have been cancelled or deleted.</p>
        <button 
          onClick={() => router.push("/matches")}
          className="mt-8 px-6 py-3 rounded-2xl glass-panel text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#2A2824] transition-all"
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
  const teamAPlayers = participants.filter(p => p.team === "A" || p.team === "Team A");
  const teamBPlayers = participants.filter(p => p.team === "B" || p.team === "Team B");
  const unassignedPlayers = participants.filter(p => p.team !== "A" && p.team !== "Team A" && p.team !== "B" && p.team !== "Team B");
  const checkedInCount = participants.filter(p => p.checkedIn).length;
  const hostParticipant = participants.find(p => p.userId === match.hostId);
  const isHost = currentUserId === match.hostId;
  const hostName = hostParticipant?.user?.fullName?.split(" ")[0] || hostParticipant?.user?.username || "Host";
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
    <main className="stryk-mobile-shell bg-[#151515] min-h-[100dvh] text-white">
      {/* Premium Marble Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
      />

      <div data-scroll-panel className="relative flex min-h-0 flex-col px-4 pt-4 pb-6 max-w-md mx-auto z-10 w-full">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between mb-4 z-10 shrink-0">
          <button 
            onClick={() => router.push("/matches")} 
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center cursor-pointer transition hover:scale-105"
            type="button"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          
          <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-[10px] font-black text-[#A28B52]">
            {match.format}
          </div>
        </div>

        {/* Left-Aligned Page Title Block */}
        <div className="shrink-0 mb-4 pl-2 z-10">
          <div className="text-[10px] tracking-[0.2em] font-black uppercase text-[#A28B52] mb-1">
            MATCH LOBBY
          </div>
          <h1 className="font-display font-black italic uppercase text-[36px] tracking-tight text-white leading-none">
            {match.title}
          </h1>
        </div>

        {/* Match Summary Card */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#1A1A1A]/85 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] mb-4 shrink-0 z-10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-[10px] font-black tracking-widest text-[#D4F829] bg-[#D4F829]/10 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 border border-[#D4F829]/10">
              <span className="size-1.5 rounded-full bg-[#D4F829] animate-pulse" />
              {statusLabel}
            </span>
            <span className="text-[10px] font-black tracking-widest text-[#A28B52] bg-[#A28B52]/10 px-3 py-1 rounded-full uppercase border border-[#A28B52]/10">
              {participants.length}/{match.maxPlayers} players
            </span>
          </div>

          <div className="space-y-2 text-[12px] text-white/70 font-medium">
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-[#A28B52] shrink-0" />
              <span className="truncate">{match.turf ? `${match.turf} (${match.location})` : match.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-[#A28B52] shrink-0" />
              <span>{formatDateTime(match.matchDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown size={13} className="text-[#A28B52] shrink-0" />
              <span>
                Host: <span className="font-bold text-white">{hostName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar (Join/Leave, Share) */}
        <div className="shrink-0 flex items-center gap-2 mb-4">
          <div className="flex-1 flex gap-2">
            {!isJoined ? (
              <button 
                onClick={handleJoinMatch}
                disabled={actionLoading || playerFill >= 100}
                className={`flex-1 h-12 rounded-[1.25rem] font-black tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition duration-200 text-[11px] ${
                  actionLoading || playerFill >= 100
                    ? "bg-white/5 text-white/20 border border-white/5 pointer-events-none"
                    : "bg-[#D4F829] text-[#151515] hover:bg-[#cbf026] shadow-[0_8px_20px_rgba(212,248,41,0.25)]"
                }`}
              >
                Join Match
              </button>
            ) : (
              <>
                {/* Host specific actions */}
                {isHost ? (
                  <>
                    {match.status === "open" && (
                      <button 
                        onClick={handleCloseMatch}
                        disabled={actionLoading}
                        className={`flex-[2] h-12 rounded-[1.25rem] font-black tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition duration-200 text-[11px] ${
                          actionLoading
                            ? "bg-white/5 text-white/20 border border-white/5 pointer-events-none"
                            : "bg-[#D4F829] text-[#151515] hover:bg-[#cbf026] shadow-[0_8px_20px_rgba(212,248,41,0.25)]"
                        }`}
                      >
                        Lock Squads
                      </button>
                    )}
                    {match.status === "closed" && (
                      <button 
                        onClick={handleCompleteMatch}
                        disabled={actionLoading}
                        className={`flex-[2] h-12 rounded-[1.25rem] font-black tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition duration-200 text-[11px] ${
                          actionLoading
                            ? "bg-white/5 text-white/20 border border-white/5 pointer-events-none"
                            : "bg-[#D4F829] text-[#151515] hover:bg-[#cbf026] shadow-[0_8px_20px_rgba(212,248,41,0.25)]"
                        }`}
                      >
                        Complete Match
                      </button>
                    )}
                    
                    <button 
                      onClick={handleQuickComplete}
                      disabled={actionLoading}
                      title="End Match (No Stats)"
                      className="w-12 h-12 shrink-0 rounded-[1.25rem] border border-white/10 bg-white/5 text-white hover:bg-[#D4F829]/10 hover:border-[#D4F829]/30 transition flex items-center justify-center cursor-pointer"
                    >
                      <CheckCircle2 size={16} className="text-[#D4F829]" />
                    </button>

                    <button 
                      onClick={handleLeaveMatch}
                      disabled={actionLoading}
                      title="Leave Match"
                      className="w-12 h-12 shrink-0 rounded-[1.25rem] border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition flex items-center justify-center cursor-pointer"
                    >
                      <LogOut size={16} className="text-red-400" />
                    </button>
                  </>
                ) : (
                  /* Participant leave button */
                  <button 
                    onClick={handleLeaveMatch}
                    disabled={actionLoading || match.status !== "open"}
                    className={`flex-1 h-12 rounded-[1.25rem] font-black tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition duration-200 text-[11px] ${
                      actionLoading || match.status !== "open"
                        ? "bg-white/5 text-white/20 border border-white/5 pointer-events-none"
                        : "border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 cursor-pointer"
                    }`}
                  >
                    Leave Match
                  </button>
                )}
              </>
            )}
          </div>
          
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Join ${match.title}`,
                  text: `Join this ${match.format} match at ${match.location}!`,
                  url: window.location.href,
                });
              }
            }}
            className="w-12 h-12 shrink-0 rounded-[1.25rem] border border-white/10 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 hover:border-white/20 hover:text-white transition cursor-pointer"
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Roster / Tactics Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-full bg-[#111] border border-white/5 mb-4 shrink-0">
          <button
            onClick={() => setViewMode("roster")}
            className={`py-2 rounded-full text-[10px] font-black tracking-wider uppercase transition cursor-pointer ${
              viewMode === "roster"
                ? "bg-[#A28B52] text-[#151515] shadow-lg"
                : "text-white/60 hover:text-white"
            }`}
          >
            ROSTER LIST
          </button>
          <button
            onClick={() => setViewMode("tactical")}
            className={`py-2 rounded-full text-[10px] font-black tracking-wider uppercase transition cursor-pointer ${
              viewMode === "tactical"
                ? "bg-[#A28B52] text-[#151515] shadow-lg"
                : "text-white/60 hover:text-white"
            }`}
          >
            TACTICS BOARD
          </button>
        </div>

        {/* Roster List / Tactics Board View Selection */}
        {!viewReady && (
          <MatchViewPreparing label={viewMode === "tactical" ? "Preparing tactics board" : "Preparing roster"} />
        )}

        {viewReady && viewMode === "roster" && (
        <div className="block w-full">
          <div className="shrink-0 flex flex-col gap-3 w-full mb-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Team A Column */}
              <div className="rounded-[1.75rem] border border-white/5 bg-[#1A1A1A]/85 p-4 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/5">
                  <span className="text-[10px] font-black tracking-wider text-white uppercase truncate">
                    {match.teamAName || "TEAM A"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {teamAPlayers.length}
                  </span>
                </div>
                
                {/* Player Slots */}
                <div className="space-y-2 flex-1">
                  {teamAPlayers.map(p => (
                    <div key={p.user.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-[#D4F829]/20 transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative size-6 rounded-full overflow-hidden border border-slate-700/50 bg-[#222]">
                          {p.user.avatarUrl ? (
                            <img src={p.user.avatarUrl} alt={p.user.username} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[9px] font-black text-white/40 flex items-center justify-center h-full w-full">
                              {p.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-white/90 truncate max-w-[80px]">
                          {p.user.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {p.user.overall || 60}
                        </span>
                        {isHost && p.user.id !== currentUserId && (
                          <button
                            onClick={() => handleKickPlayer(p.user.id)}
                            disabled={actionLoading}
                            className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                            title="Kick player"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Empty Slots */}
                  {Array.from({ length: Math.max(0, (match.maxPlayers / 2) - teamAPlayers.length) }).map((_, i) => (
                    <button
                      key={`empty-a-${i}`}
                      onClick={() => handleAssignTeam("Team A")}
                      disabled={actionLoading || !isJoined || match.status === "closed"}
                      className="w-full py-2 rounded-xl border border-dashed border-white/10 hover:border-[#D4F829]/30 text-white/30 hover:text-[#D4F829] text-[9px] font-black tracking-widest uppercase transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      + JOIN
                    </button>
                  ))}
                </div>
              </div>

              {/* Team B Column */}
              <div className="rounded-[1.75rem] border border-white/5 bg-[#1A1A1A]/85 p-4 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/5">
                  <span className="text-[10px] font-black tracking-wider text-white uppercase truncate">
                    {match.teamBName || "TEAM B"}
                  </span>
                  <span className="text-[10px] font-bold text-[#D4F829]">
                    {teamBPlayers.length}
                  </span>
                </div>
                
                {/* Player Slots */}
                <div className="space-y-2 flex-1">
                  {teamBPlayers.map(p => (
                    <div key={p.user.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-[#D4F829]/20 transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative size-6 rounded-full overflow-hidden border border-[#D4F829]/20 bg-[#222]">
                          {p.user.avatarUrl ? (
                            <img src={p.user.avatarUrl} alt={p.user.username} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[9px] font-black text-white/40 flex items-center justify-center h-full w-full">
                              {p.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-white/90 truncate max-w-[80px]">
                          {p.user.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#D4F829]/10 text-[#D4F829]">
                          {p.user.overall || 60}
                        </span>
                        {isHost && p.user.id !== currentUserId && (
                          <button
                            onClick={() => handleKickPlayer(p.user.id)}
                            disabled={actionLoading}
                            className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                            title="Kick player"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Empty Slots */}
                  {Array.from({ length: Math.max(0, (match.maxPlayers / 2) - teamBPlayers.length) }).map((_, i) => (
                    <button
                      key={`empty-b-${i}`}
                      onClick={() => handleAssignTeam("Team B")}
                      disabled={actionLoading || !isJoined || match.status === "closed"}
                      className="w-full py-2 rounded-xl border border-dashed border-white/10 hover:border-[#D4F829]/30 text-white/30 hover:text-[#D4F829] text-[9px] font-black tracking-widest uppercase transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      + JOIN
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Free Pool Roster */}
            {unassignedPlayers.length > 0 && (
              <div className="rounded-[1.5rem] border border-white/5 bg-[#111]/40 p-4">
                <div className="text-[9px] font-black tracking-widest text-white/40 uppercase mb-2">
                  FREE POOL ({unassignedPlayers.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {unassignedPlayers.map(p => (
                    <div key={p.user.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                      <div className="relative size-4 rounded-full overflow-hidden border border-white/10">
                        {p.user.avatarUrl ? (
                          <img src={p.user.avatarUrl} alt={p.user.username} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[8px] font-black text-white/40 flex items-center justify-center h-full w-full">
                            {p.user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-white/70">{p.user.username}</span>
                      <div className="flex items-center gap-1.5 ml-0.5">
                        <span className="text-[9px] font-black text-[#A28B52]">{p.user.overall || 60}</span>
                        {isHost && p.user.id !== currentUserId && (
                          <button
                            onClick={() => handleKickPlayer(p.user.id)}
                            disabled={actionLoading}
                            className="p-0.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                            title="Kick player"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Tactical Pitch Board View */}
        {viewReady && viewMode === "tactical" && (
        <div className="block w-full">
          {match && (
            <div className="shrink-0 mt-1 w-full rounded-[2rem] border border-[#151515]/10 glass-panel p-2 shadow-[0_24px_60px_rgba(0,0,0,0.28)] mb-4">
              <InlineTeamBuilder
                participants={match.participants}
                onSaveTeams={handleSaveTeams}
                isHost={currentUserId === match.hostId}
                currentUserId={currentUserId}
                onJoinTeam={handleAssignTeam}
                onUpdatePosition={handleUpdatePosition}
                onUpdateTeamNames={handleUpdateTeamNames}
                teamAName={match.teamAName}
                teamBName={match.teamBName}
                matchFormat={match.format}
                externalPositionUpdate={externalPositionUpdate}
                isLocked={match.status === "closed"}
              />
            </div>
          )}
        </div>
        )}

        {/* Stats & Verifications Section */}
        {match && match.status === "closed" && (
          <div className="mt-8 mb-12">
            <h2 className="text-[#D4F829] font-black text-[14px] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
              <Trophy size={16} />
              Match Stats & Verification
            </h2>

            {/* My Stats Status */}
            <div className="mb-6 p-5 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] shadow-lg">
              <h3 className="text-white text-sm font-bold mb-2 tracking-wide">Your Match Performance</h3>
              {hasSubmittedStats ? (
                <div className="flex items-center gap-3 text-[#D4F829] text-xs font-medium bg-[#D4F829]/10 p-3 rounded-xl border border-[#D4F829]/20">
                  <CheckCircle2 size={16} />
                  Your stats have been submitted and are undergoing peer review!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-white/50 text-xs">You have not submitted your match stats yet.</p>
                  <button
                    onClick={() => setShowStatSubmission(true)}
                    className="w-full h-12 rounded-[1rem] bg-[#D4F829] hover:bg-[#c3e626] text-[#151515] text-[11px] font-black tracking-[0.12em] uppercase transition duration-200 cursor-pointer flex items-center justify-center shadow-lg"
                  >
                    Submit My Stats
                  </button>
                </div>
              )}
            </div>

            {/* Pending Peer Reviews */}
            {pendingVerifications.length > 0 && (
              <div>
                <h3 className="text-white text-xs font-bold mb-3 uppercase tracking-widest text-white/50 flex items-center justify-between">
                  Pending Peer Reviews
                  <span className="bg-[#D4F829] text-[#151515] px-2 py-0.5 rounded-full text-[9px] font-black">
                    {pendingVerifications.length}
                  </span>
                </h3>
                
                <div className="flex flex-col gap-3">
                  {pendingVerifications.map((v) => (
                    <div key={v.id} className="p-4 rounded-[1.5rem] glass-panel flex flex-col gap-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full glass-panel0 overflow-hidden relative">
                          {v.avatarUrl ? (
                            <img src={v.avatarUrl} alt={v.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50 font-bold uppercase">
                              {v.username.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">@{v.username}</div>
                          <div className="text-white/40 text-[10px] uppercase tracking-wider">Submitted Stats</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.03]">
                        <div className="text-center">
                          <div className="text-[#D4F829] font-black text-lg">{v.goals}</div>
                          <div className="text-white/40 text-[9px] uppercase tracking-widest">GLS</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[#D4F829] font-black text-lg">{v.assists}</div>
                          <div className="text-white/40 text-[9px] uppercase tracking-widest">AST</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[#D4F829] font-black text-lg">{v.tackles}</div>
                          <div className="text-white/40 text-[9px] uppercase tracking-widest">TCK</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[#D4F829] font-black text-lg">{v.saves}</div>
                          <div className="text-white/40 text-[9px] uppercase tracking-widest">SAV</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          onClick={() => handleVerifyStats(v.userId, true)}
                          className="h-10 rounded-xl glass-panel0 hover:bg-[#D4F829] hover:text-[#151515] text-white text-[10px] font-bold tracking-[0.1em] uppercase transition duration-200 flex items-center justify-center"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleVerifyStats(v.userId, false)}
                          className="h-10 rounded-xl glass-panel hover:bg-red-500/20 border border-transparent hover:border-red-500/20 text-white/50 hover:text-red-500 text-[10px] font-bold tracking-[0.1em] uppercase transition duration-200 flex items-center justify-center"
                        >
                          Dispute
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}        {/* Bottom Primary CTAs */}
        <div className="shrink-0 mt-4 w-full mb-4">
          {isJoined ? (
            <div className="relative flex flex-col gap-0 p-5 rounded-[2rem] bg-[#1A1A1A]/85 shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden border border-white/5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4F829]/40 to-transparent" />
              <div className="pointer-events-none absolute left-1/2 -top-10 -translate-x-1/2 size-24 rounded-full bg-[#D4F829]/10 blur-2xl" />
              
              <div className="flex items-start justify-between gap-4 relative z-10 mb-4">
                <div>
                  <h3 className="text-[10px] tracking-[0.2em] font-black uppercase text-[#A28B52]">
                    Action Center
                  </h3>
                  <p className="mt-1.5 text-[12px] font-medium text-white/90">
                    {currentTeam ? (
                      <>Drafted to <span className="font-black text-[#D4F829] uppercase">{currentTeam}</span></>
                    ) : (
                      "Awaiting your check-in"
                    )}
                  </p>
                </div>
                <div className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${isCheckedIn ? "bg-[#D4F829]/10 border-[#D4F829]/30 text-[#D4F829]" : "glass-panel border-white/10 text-white/40"}`}>
                  {isCheckedIn ? "Ready" : "Pending"}
                </div>
              </div>
              
              <div className="space-y-3 relative z-10">
                {!isCheckedIn && (
                  <button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className={`w-full h-12 rounded-[1.25rem] text-[11px] font-black tracking-[0.15em] uppercase transition duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                      actionLoading
                        ? "bg-white/5 text-white/20 border border-white/5 pointer-events-none"
                        : "bg-[#D4F829] text-[#151515] hover:bg-[#c3e626] shadow-[0_8px_20px_rgba(212,248,41,0.2),inset_0_1px_0_rgba(255,255,255,0.6)]"
                    }`}
                  >
                    {actionLoading ? (
                      <Loader2 className="size-4 animate-spin text-[#151515]" />
                    ) : (
                      <>
                        <CheckCircle2 size={16} strokeWidth={2.5} />
                        I am Here (Check In)
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full h-12 rounded-[1.25rem] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-[11px] font-bold tracking-[0.15em] uppercase transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail size={15} className="text-white/60" />
                  Invite Friends
                </button>
                
                <button
                  onClick={handleLeaveMatch}
                  disabled={actionLoading}
                  className="w-full pt-3 pb-1 text-white/30 hover:text-red-400 text-[10px] font-bold tracking-[0.1em] uppercase transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <>
                      <LogOut size={11} />
                      Leave Match
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative p-5 rounded-[2rem] bg-[#1A1A1A]/85 shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden border border-white/5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4F829]/40 to-transparent" />
              <button
                onClick={handleJoinMatch}
                disabled={actionLoading || participants.length >= match.maxPlayers}
                className={`w-full h-12 rounded-[1.25rem] text-[12px] font-black tracking-[0.15em] uppercase transition duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  actionLoading || participants.length >= match.maxPlayers
                    ? "bg-white/5 text-white/20 border border-white/5 pointer-events-none"
                    : "bg-[#D4F829] text-[#151515] hover:bg-[#c3e626] shadow-[0_12px_32px_rgba(212,248,41,0.28),inset_0_1px_0_rgba(255,255,255,0.6)]"
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="size-5 animate-spin text-[#151515]" />
                ) : (
                  <>
                    <UserPlus size={16} strokeWidth={2.5} />
                    {participants.length >= match.maxPlayers ? "Match Full" : "Join Match"}
                  </>
                )}
              </button>
            </div>
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
              className="absolute inset-0 bg-black/60 "
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel border border-[#151515]/10 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl uppercase italic tracking-wide text-white">Invite Friends</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-full hover:glass-panel text-white/50 hover:text-white transition">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {friendsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#A28B52]" /></div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-10 text-white/40 text-sm">No friends found. Add some friends first!</div>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/40 border border-[#151515]/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover border border-[#151515]/10" />
                        <div>
                          <div className="text-sm font-bold text-white">{friend.name}</div>
                          <div className="text-[10px] text-white/50">@{friend.handle}</div>
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
          teamAName={match?.teamAName}
          teamBName={match?.teamBName}
        />
      )}

      {/* Private Join Modal */}
      <AnimatePresence>
        {showPrivateJoinModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-5 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 " onClick={() => setShowPrivateJoinModal(false)} />
            <div className="relative w-full max-w-sm rounded-[2rem] bg-[#111] border border-[#A28B52]/20 shadow-2xl p-6 overflow-hidden">
              <button
                onClick={() => setShowPrivateJoinModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full glass-panel flex items-center justify-center text-white/50 hover:text-white transition z-10 cursor-pointer"
                type="button"
              >
                <X size={16} />
              </button>

              <h3 className="font-display text-2xl uppercase tracking-wide text-white mb-2 italic">
                Private Match
              </h3>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                This match requires a password to join.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeJoin(privateJoinPassword);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-[#A28B52] font-black block mb-2 pl-2 drop-shadow-sm">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter match password"
                    value={privateJoinPassword}
                    onChange={(e) => setPrivateJoinPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-[1.25rem] border border-[#A28B52]/10 glass-panel text-[15px] text-[#EFE8D6] placeholder-white/20 outline-none focus:border-[#D4F829]/50 focus:ring-1 focus:ring-[#D4F829]/50 transition duration-300 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !privateJoinPassword.trim()}
                  className={`w-full h-12 rounded-[1.25rem] font-black tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition duration-300 text-[13px] mt-6 uppercase ${
                    actionLoading || !privateJoinPassword.trim()
                      ? "bg-white/5 text-white/20 border border-white/5 pointer-events-none"
                      : "bg-[#D4F829] text-[#151515] hover:bg-[#cbf026] shadow-[0_8px_20px_rgba(212,248,41,0.25)]"
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Joining...
                    </>
                  ) : (
                    "JOIN MATCH"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function MatchLobbyLoading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <main className="stryk-mobile-shell bg-[#151515] min-h-[100dvh] text-white">
      {/* Premium Marble Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
      />

      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center">
        <div className="mb-5 grid size-16 place-items-center rounded-full border border-[#D4F829]/20 bg-[#D4F829]/8 shadow-[0_0_40px_rgba(212,248,41,0.10)]">
          <Loader2 className="size-7 animate-spin text-[#D4F829]" />
        </div>
        <h2 className="font-display text-2xl font-black italic uppercase tracking-widest text-white">
          {title}
        </h2>
        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/40">
          {subtitle}
        </p>
        <div className="mt-8 h-1 w-44 overflow-hidden rounded-full bg-white/8">
          <div className="h-full w-1/2 animate-[loading-slide_1.1s_ease-in-out_infinite] rounded-full bg-[#D4F829]" />
        </div>
      </div>
    </main>
  );
}

function MatchViewPreparing({ label }: { label: string }) {
  return (
    <div className="mb-4 grid min-h-[260px] w-full place-items-center rounded-[2rem] border border-white/5 bg-[#151515]/70 px-6 text-center">
      <div>
        <Loader2 className="mx-auto mb-3 size-6 animate-spin text-[#D4F829]" />
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
          {label}
        </div>
      </div>
    </div>
  );
}

function MatchMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[1.1rem] border border-[#151515]/10 glass-panel px-3 py-3 text-left shadow-sm ">
      <div className="mb-1.5 flex items-center gap-1.5 text-[#A28B52]">
        {icon}
        <span className="truncate text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="truncate font-display text-[21px] font-black uppercase italic leading-none tracking-wide text-white">
        {value}
      </div>
    </div>
  );
}

export function TeamChip({ label, value, tone }: { label: string; value: number; tone: "lime" | "gold" }) {
  const active = tone === "lime";
  return (
    <div className="rounded-[1rem] border border-[#151515]/10 glass-panel px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
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
