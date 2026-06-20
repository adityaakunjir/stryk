"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Bell, Check, X, Mail, Users } from "lucide-react";

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
    <main className="stryk-mobile-shell bg-[#E5DCC5] min-h-[100dvh] text-[#1A1A1A]">
      {/* Premium Marble Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/create_card_bg.webp')" }}
      />

      <div data-scroll-panel className="relative h-full flex flex-col px-6 pt-12 pb-8 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 relative">
          <button
            onClick={() => router.push("/home")}
            className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center cursor-pointer hover:bg-black/5 transition relative z-10 bg-transparent shadow-sm"
            aria-label="Back to home"
            type="button"
          >
            <ArrowLeft size={18} className="text-[#1A1A1A]" />
          </button>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
            <img src="/logo.webp" alt="STRYK" className="h-10 w-auto object-contain drop-shadow-sm" />
          </div>
          
          <div className="w-10 h-10" />
        </header>

        <h1 className="font-display text-[2.5rem] font-bold italic uppercase tracking-tight mb-1 text-[#1A1A1A] drop-shadow-sm mt-4">
          NOTIFICATIONS
        </h1>
        <p className="text-[10px] font-bold text-[#8A7038] uppercase tracking-widest mb-6">
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
            <Loader2 className="size-8 text-[#A88028] animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="relative flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] bg-[#0A0A0A] shadow-2xl border border-white/5 overflow-hidden mb-safe">
            
            {/* Elegant Golden Badge for Icon */}
            <div className="w-24 h-24 rounded-full border border-[#D8A53B]/20 bg-gradient-to-br from-[#D8A53B]/5 to-transparent flex items-center justify-center shadow-[inset_0_0_20px_rgba(216,165,59,0.05)] mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-[#D8A53B]/5 blur-xl" />
              <Bell size={36} className="text-[#D8A53B] relative z-10 drop-shadow-[0_2px_8px_rgba(216,165,59,0.3)]" strokeWidth={1.5} />
            </div>
            
            <h3 className="font-display text-2xl tracking-[0.15em] text-[#E5DCC5] font-medium mb-3 text-center">
              ALL CAUGHT UP
            </h3>
            
            <p className="text-[13px] text-[#A0A0A0] text-center max-w-[240px] leading-relaxed">
              You're all set. Check back later for new updates and invites.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-3xl border border-white/8 bg-[#0B1020]/30 backdrop-blur-xl flex flex-col gap-4 shadow-lg shadow-black/30"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative size-12 rounded-2xl overflow-hidden border border-[#C6FF00]/20 bg-[#0A0E17] flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#C6FF00]/10 to-transparent" />
                    {n.type === "invite" ? (
                      <Users size={20} className="text-[#C6FF00]/75 relative z-10" />
                    ) : (
                      <Mail size={20} className="text-[#C6FF00]/75 relative z-10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white leading-snug">
                      <span className="text-[#C6FF00] font-bold">{n.type === "invite" ? n.teamName : n.userName}</span> {n.type === "invite" ? "invited you" : "sent a friend request"}
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                      {n.type === "invite" ? "Squad Invitation" : "Friend Request"} • {formatTime(n.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleRespond(n.id, n.type, "decline")}
                    disabled={actionLoadingId !== null}
                    className="h-10 rounded-2xl border border-white/10 bg-white/5 text-xs font-display tracking-widest text-white/80 uppercase hover:bg-white/10 hover:text-white cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    type="button"
                  >
                    {actionLoadingId === n.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <X size={13} /> Decline
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRespond(n.id, n.type, "accept")}
                    disabled={actionLoadingId !== null}
                    className="h-10 rounded-2xl bg-[#C6FF00] text-black text-xs font-display tracking-widest font-bold uppercase hover:bg-[#b0e600] cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-[0_10px_20px_-5px_rgba(198,255,0,0.3)]"
                    type="button"
                  >
                    {actionLoadingId === n.id ? (
                      <Loader2 className="size-3.5 animate-spin text-black" />
                    ) : (
                      <>
                        <Check size={13} strokeWidth={3} /> Accept
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
