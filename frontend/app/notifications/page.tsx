"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Bell, Check, X, Mail, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: "invite" | "friend_request";
  status: string;
  createdAt: string;
  // For invites
  teamId?: string;
  teamName?: string;
  // For friend requests
  userId?: string;
  userName?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchNotifications = async () => {
    try {
      const [teamRes, friendRes] = await Promise.all([
        fetch("/api/team/invite"),
        fetch("/api/friends")
      ]);
      const teamData = await teamRes.json();
      const friendData = await friendRes.json();

      let allNotifs: Notification[] = [];

      if (teamData.success) {
        const mapped: Notification[] = (teamData.invites || []).map((inv: any) => ({
          id: inv.id,
          type: "invite" as const,
          teamId: inv.teamId,
          teamName: inv.teamName,
          status: inv.status,
          createdAt: inv.createdAt}));
        allNotifs = [...allNotifs, ...mapped];
      }

      if (friendData.success) {
        const mapped: Notification[] = (friendData.incomingRequests || []).map((req: any) => ({
          id: req.id,
          type: "friend_request" as const,
          userId: req.user.id,
          userName: req.user.fullName || req.user.username,
          status: "pending",
          createdAt: req.createdAt}));
        allNotifs = [...allNotifs, ...mapped];
      }

      allNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(allNotifs);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRespond = async (notifId: string, type: "invite" | "friend_request", action: "accept" | "decline") => {
    setActionLoadingId(notifId);
    setFeedback(null);

    try {
      let endpoint = "";
      let method = "";
      let body: any = {};

      if (type === "invite") {
        endpoint = action === "accept" ? "/api/team/accept" : "/api/team/invite";
        method = action === "accept" ? "POST" : "DELETE";
        body = { inviteId: notifId };
      } else {
        endpoint = "/api/friends/respond";
        method = "POST";
        body = { requestId: notifId, action: action === "accept" ? "accept" : "reject" };
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)});

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          msg: action === "accept" 
            ? (type === "invite" ? "Successfully joined the squad!" : "Friend request accepted!") 
            : (type === "invite" ? "Invitation declined." : "Friend request declined.")});
        await fetchNotifications();
      } else {
        setFeedback({ type: "error", msg: data.message || "Action failed." });
      }
    } catch {
      setFeedback({ type: "error", msg: "An error occurred. Please try again." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <main className="stryk-mobile-shell bg-[#151515] min-h-[100dvh] text-white">
      {/* Premium Marble Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        
      />

      <div className="relative h-full flex flex-col px-6 pt-12 pb-8 max-w-md mx-auto z-10 w-full min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 relative">
          <button
            onClick={() => router.push("/home")}
            className="w-10 h-10 rounded-full glass-panel border border-white/10 text-white flex items-center justify-center cursor-pointer hover:border-white/20 transition shadow-lg relative z-10"
            aria-label="Back to home"
            type="button"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        </header>

        <h1 className="font-display text-[2.5rem] font-black italic uppercase tracking-tight mb-1 text-white drop-shadow-sm mt-4 leading-none">
          NOTIFICATIONS
        </h1>
        <p className="text-[10px] font-bold text-[#A28B52] uppercase tracking-widest mb-6">
          {notifications.length} PENDING
        </p>

        {/* Feedback Toast */}
        {feedback && (
          <div
            className={`mb-6 rounded-xl border p-4 text-center text-xs font-semibold shadow-sm ${
              feedback.type === "success"
                ? "border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#2E7A46]"
                : "border-red-500/30 bg-red-500/10 text-red-700"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="size-8 text-white animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="relative flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] glass-panel bg-[#1C1C1C]/40 border-white/5 overflow-hidden mb-safe">
            
            {/* Elegant Golden Badge for Icon */}
            <div className="w-24 h-24 rounded-full border border-white/10 glass-panel bg-white/5 flex items-center justify-center mb-6 relative shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <div className="absolute inset-0 rounded-full bg-[#A28B52]/5 blur-xl" />
              <motion.div
                animate={{ rotate: [0, -8, 8, -6, 6, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatDelay: 3.5,
                  ease: "easeInOut"
                }}
              >
                <Bell size={36} className="text-[#A28B52] relative z-10 drop-shadow-[0_0_15px_rgba(162,139,82,0.35)]" strokeWidth={1.5} />
              </motion.div>
            </div>
            
            <h3 className="font-display text-2xl tracking-[0.15em] text-white font-black mb-3 text-center">
              ALL CAUGHT UP
            </h3>
            
            <p className="text-[13px] text-white/50 text-center max-w-[240px] leading-relaxed font-medium">
              You&apos;re all set. Check back later for new updates and invites.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-5 rounded-[2rem] border border-[#A28B52]/20 glass-panel flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-center gap-4">
                  <div className="relative size-14 rounded-[1.25rem] overflow-hidden border border-[#A28B52]/30 bg-[#050505] flex items-center justify-center shrink-0 shadow-[inset_0_0_15px_rgba(162,139,82,0.05)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#A28B52]/10 to-transparent" />
                    {n.type === "invite" ? (
                      <Users size={22} className="text-[#A28B52] relative z-10 drop-shadow-sm" strokeWidth={1.5} />
                    ) : (
                      <Mail size={22} className="text-[#A28B52] relative z-10 drop-shadow-sm" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-[#E5DCC5] leading-snug">
                      <span className="text-[#A28B52] font-bold">{n.type === "invite" ? n.teamName : n.userName}</span> {n.type === "invite" ? "invited you" : "sent a friend request"}
                    </div>
                    <div className="text-[11px] text-[#A0A0A0] uppercase tracking-wider mt-1 font-medium">
                      {n.type === "invite" ? "Squad Invitation" : "Friend Request"} • {formatTime(n.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    onClick={() => handleRespond(n.id, n.type, "decline")}
                    disabled={actionLoadingId !== null}
                    className="h-11 rounded-[1.25rem] border border-white/10 glass-panel text-[13px] font-bold tracking-widest text-white/70 uppercase hover:glass-panel hover:text-white cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-2"
                    type="button"
                  >
                    {actionLoadingId === n.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <X size={15} strokeWidth={2.5} /> DECLINE
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRespond(n.id, n.type, "accept")}
                    disabled={actionLoadingId !== null}
                    className="h-11 rounded-[1.25rem] bg-gradient-to-r from-[#A28B52] to-[#FDE69F] text-white text-[13px] tracking-widest font-black uppercase hover:opacity-90 cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(162,139,82,0.2)]"
                    type="button"
                  >
                    {actionLoadingId === n.id ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : (
                      <>
                        <Check size={15} strokeWidth={3} /> ACCEPT
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
