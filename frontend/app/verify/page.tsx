"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const INITIAL_REQUESTS: {
  id: number;
  name: string;
  handle: string;
  ovr: number;
  avatar: string;
  match: string;
  stats: { k: string; v: string }[];
}[] = [];

export default function VerifyPage() {
  const router = useRouter();
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [trustScore, setTrustScore] = useState(98);


  const handleAction = (id: number, isVerified: boolean) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    if (isVerified) {
      setTrustScore((prev) => Math.min(100, prev + 1));
      toast.success("Stats Verified! Trust score increased.");
    } else {
      toast.error("Stats Rejected.");
    }
  };

  return (
    <main className="stryk-mobile-shell text-white glass-panel">
      <div data-scroll-panel className="relative h-full flex flex-col px-5 pt-6 pb-4 max-w-md mx-auto z-10 overflow-y-auto w-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Btn onClick={() => router.push("/home")}><ArrowLeft size={16} /></Btn>
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/45 font-bold">Trust Layer</div>
            <div className="font-display tracking-wide text-sm uppercase">VERIFY STATS</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#C6FF00]/15 border border-[#C6FF00]/30 flex items-center justify-center text-[#C6FF00]">
            <ShieldCheck size={14} />
          </div>
        </div>



        {/* Score Block */}
        <div className="mt-4 rounded-2xl p-4 border border-white/8 bg-white/[0.03] flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/45 font-bold">Your Trust Score</div>
            <div className="font-display text-2xl text-[#C6FF00] mt-0.5">
              {trustScore}
              <span className="text-white/40 text-sm ml-1">/100</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.22em] uppercase text-white/45 font-bold">Pending</div>
            <div className="font-display text-2xl mt-0.5">{requests.length}</div>
          </div>
        </div>

        {/* Pending Requests List */}
        <div className="mt-4 flex-1 space-y-3 pr-0.5">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl p-4 border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-white">
                    {r.name}{" "}
                    <span className="text-white/40 text-xs font-medium">@{r.handle}</span>
                  </div>
                  <div className="text-[10px] text-white/45 truncate mt-0.5 font-semibold">{r.match}</div>
                </div>
                <div className="font-display text-[#C6FF00] text-lg shrink-0">{r.ovr}</div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.stats.map((s) => (
                  <span key={s.k} className="text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full border border-white/8 glass-panel font-semibold">
                    {s.k} · <span className="text-[#C6FF00]">{s.v}</span>
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleAction(r.id, false)}
                  className="rounded-xl py-2 flex items-center justify-center gap-1.5 border border-white/10 text-[10px] tracking-wider uppercase text-white/70 font-display cursor-pointer hover:glass-panel hover:border-white/20 transition"
                >
                  <X size={12} /> Reject
                </button>
                <button 
                  onClick={() => handleAction(r.id, true)}
                  className="rounded-xl py-2 flex items-center justify-center gap-1.5 bg-[#C6FF00] text-white text-[10px] tracking-wider uppercase font-display font-medium cursor-pointer hover:bg-[#b0e600] transition"
                >
                  <Check size={12} strokeWidth={3} /> Verify
                </button>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="text-center py-16">
              <ShieldCheck className="mx-auto size-12 text-[#C6FF00] opacity-40 mb-3" />
              <div className="text-white/60 font-display uppercase tracking-wider text-base">ALL SET!</div>
              <div className="text-xs text-white/40 mt-1">No pending verification requests.</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} className="w-9 h-9 rounded-full glass-panel text-white flex items-center justify-center cursor-pointer hover:glass-panel0">{children}</button>;
}
