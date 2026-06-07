"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Bell, Check, X, Mail, Users } from "lucide-react";

interface Notification {
  id: string;
  type: "invite";
  teamId: string;
  teamName: string;
  status: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/team/invite");
      const data = await res.json();
      if (data.success) {
        const mapped: Notification[] = (data.invites || []).map((inv: any) => ({
          id: inv.id,
          type: "invite" as const,
          teamId: inv.teamId,
          teamName: inv.teamName,
          status: inv.status,
          createdAt: inv.createdAt,
        }));
        setNotifications(mapped);
      }
    } catch {
      // Silently handle — empty notifications
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRespond = async (inviteId: string, action: "accept" | "decline") => {
    setActionLoadingId(inviteId);
    setFeedback(null);

    try {
      const endpoint = action === "accept" ? "/api/team/accept" : "/api/team/invite";
      const method = action === "accept" ? "POST" : "DELETE";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          msg: action === "accept" ? "Successfully joined the squad!" : "Invitation declined.",
        });
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
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,255,0,0.06),transparent_50%)]" />

      <div data-scroll-panel className="relative h-full flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/home")}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition"
            aria-label="Back to home"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#C6FF00] font-bold">Notifications</div>
          <div className="w-9 h-9" />
        </header>

        <h1 className="font-display text-3xl uppercase tracking-wider mb-2 pl-1 italic">
          Notifications
        </h1>
        <p className="text-[11px] text-white/40 uppercase tracking-widest mb-6 pl-1">
          {notifications.length} pending
        </p>

        {/* Feedback Toast */}
        {feedback && (
          <div
            className={`mb-6 rounded-xl border p-4 text-center text-xs font-semibold ${
              feedback.type === "success"
                ? "border-[#C6FF00]/22 bg-[#C6FF00]/6 text-[#C6FF00]"
                : "border-red-500/22 bg-red-500/7 text-red-400"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="size-8 text-[#C6FF00] animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 border border-white/5 rounded-3xl bg-white/[0.01] px-6">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/25">
              <Bell size={24} />
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-white/70 text-center">
              All caught up!
            </div>
            <p className="text-xs text-white/40 text-center mt-1.5 max-w-[200px]">
              You don&apos;t have any notifications right now. Check back later.
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
                      <span className="text-[#C6FF00] font-bold">{n.teamName}</span> invited you
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                      Squad Invitation • {formatTime(n.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleRespond(n.id, "decline")}
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
                    onClick={() => handleRespond(n.id, "accept")}
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
