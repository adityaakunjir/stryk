"use client";

import { useState } from "react";
import { UserPlus, UserCheck, Clock, Loader2, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted";

interface FriendActionButtonProps {
  targetUserId: string;
  initialStatus: FriendStatus;
  requestId?: string; // Needed if pending_received
}

export function FriendActionButton({ targetUserId, initialStatus, requestId }: FriendActionButtonProps) {
  const [status, setStatus] = useState<FriendStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSendRequest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId })});
      const data = await res.json();
      if (data.success) {
        setStatus("pending_sent");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (action: "accept" | "reject") => {
    if (!requestId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })});
      const data = await res.json();
      if (data.success) {
        setStatus(action === "accept" ? "accepted" : "none");
        if (action === "accept") {
          router.refresh();
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "accepted") {
    return (
      <button disabled className="w-full h-12 rounded-2xl border border-[#C3DF1B]/30 bg-[#C3DF1B]/10 text-[#C3DF1B] font-display tracking-[0.15em] text-xs uppercase flex items-center justify-center gap-2">
        <UserCheck size={16} />
        FRIENDS
      </button>
    );
  }

  if (status === "pending_sent") {
    return (
      <button disabled className="w-full h-12 rounded-2xl border border-white/10 glass-panel text-white/50 font-display tracking-[0.15em] text-xs uppercase flex items-center justify-center gap-2">
        <Clock size={16} />
        REQUEST SENT
      </button>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="flex gap-2 w-full">
        <button
          onClick={() => handleRespond("accept")}
          disabled={isLoading}
          className="flex-1 h-12 rounded-2xl bg-[#C3DF1B] text-white font-display tracking-[0.15em] text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-[#b0c918] transition disabled:opacity-50 shadow-[0_10px_20px_-10px_rgba(195,223,27,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] active:scale-95"
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <UserCheck size={16} />}
          ACCEPT
        </button>
        <button
          onClick={() => handleRespond("reject")}
          disabled={isLoading}
          className="flex-1 h-12 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-display tracking-[0.15em] text-xs uppercase flex items-center justify-center gap-2 hover:bg-red-500/20 transition disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <UserMinus size={16} />}
          DECLINE
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSendRequest}
      disabled={isLoading}
      className="w-full h-12 rounded-2xl bg-[#C3DF1B] text-white font-display tracking-[0.15em] text-xs uppercase font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-[#b0c918] transition duration-200 shadow-[0_15px_30px_-10px_rgba(195,223,27,0.5),inset_0_1px_0_rgba(255,255,255,0.5)] disabled:opacity-50 active:scale-95"
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus size={16} />}
      ADD FRIEND
    </button>
  );
}
