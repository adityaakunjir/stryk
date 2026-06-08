"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Invite {
  id: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  status: string;
  createdAt: string;
}

export default function InvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchInvites = async () => {
    try {
      const res = await fetch("/api/team/invite");
      const data = await res.json();
      if (data.success) {
        setInvites(data.invites || []);
      }
    } catch {
      // Handled implicitly by fallback UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleRespond = async (inviteId: string, action: "accept" | "decline") => {
    setActionLoadingId(inviteId);

    try {
      const endpoint = action === "accept" ? "/api/team/accept" : "/api/team/invite";
      const method = action === "accept" ? "POST" : "DELETE";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId })});

      const data = await res.json();
      if (data.success) {
        toast.success(
          action === "accept"
            ? "Successfully joined the squad!"
            : "Invitation declined."
        );
        await fetchInvites();
      } else {
        toast.error(data.message || "Failed to respond to invitation");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,255,0,0.08),transparent_50%)]" />
      
      <div className="relative h-full flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto z-10 w-full overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push("/home")} 
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#C6FF00] font-bold">Invitations</div>
          <div className="w-9 h-9" /> {/* Spacer for centering */}
        </header>

        <h1 className="font-display text-3xl uppercase tracking-wider mb-6 pl-1 italic">
          Notifications
        </h1>



        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="size-8 text-[#C6FF00] animate-spin" />
          </div>
        ) : invites.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 border border-white/5 rounded-3xl bg-white/[0.01] px-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/30">
              <Mail size={22} />
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-white/70 text-center">All caught up!</div>
            <p className="text-xs text-white/40 text-center mt-1">
              You don&apos;t have any pending squad invitations right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <div 
                key={invite.id} 
                className="p-4 rounded-3xl border border-white/8 bg-[#0B1020]/30 backdrop-blur-xl flex flex-col gap-4 shadow-lg shadow-black/30 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative size-12 rounded-2xl overflow-hidden border border-[#C6FF00]/20 bg-[#0A0E17] flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#C6FF00]/10 to-transparent" />
                    <Mail size={20} className="text-[#C6FF00]/75" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white leading-snug">
                      <span className="text-[#C6FF00] font-bold">{invite.teamName}</span> invited you
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                      Squad Invitation
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleRespond(invite.id, "decline")}
                    disabled={actionLoadingId !== null}
                    className="h-10 rounded-2xl border border-white/10 bg-white/5 text-xs font-display tracking-widest text-white/80 uppercase hover:bg-white/10 hover:text-white cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    type="button"
                  >
                    {actionLoadingId === invite.id ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        DECLINING...
                      </>
                    ) : (
                      <>
                        <X size={13} /> Decline
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRespond(invite.id, "accept")}
                    disabled={actionLoadingId !== null}
                    className="h-10 rounded-2xl bg-[#C6FF00] text-black text-xs font-display tracking-widest font-bold uppercase hover:bg-[#b0e600] cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-[0_10px_20px_-5px_rgba(198,255,0,0.3)]"
                    type="button"
                  >
                    {actionLoadingId === invite.id ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin text-black" />
                        JOINING...
                      </>
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
