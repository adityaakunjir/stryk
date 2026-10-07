"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { featureUI } from "@/lib/feature-ui";

type Game = { id: string; title: string; location: string; date: string; format: string; spotsLeft: number };
type Week = { upcoming: Game[]; available: Game[]; actions: { kind: string; matchId: string; title: string; label: string }[]; pendingInvites: number };

export function PlayThisWeek() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [data, setData] = useState<Week | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in required");
      const response = await fetch("/api/dashboard/week", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Unable to load games");
      setData(await response.json());
    } catch { setError(true); } finally { setLoading(false); }
  }, [getToken]);
  useEffect(() => { if (isLoaded && isSignedIn) void load(); }, [isLoaded, isSignedIn, load]);

  const game = (match: Game, yours: boolean) => (
    <Link key={match.id} href={`/matches/${match.id}`} className="block rounded-2xl border border-white/10 bg-white/5 p-4 min-h-24">
      <p className="font-bold text-sm break-words">{match.title}</p>
      <p className="mt-1 text-xs text-white/70">{new Date(match.date).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
      <p className="mt-1 text-xs text-white/60 break-words">{match.location} · {match.format}</p>
      <p className="mt-2 text-xs font-bold text-[#D4F829]">{yours ? "View your game →" : `${match.spotsLeft} spots left · View game →`}</p>
    </Link>
  );
  return (
    <section aria-label="Play this week" className="mb-6 space-y-3">
      <div className="flex justify-between items-center gap-3">
        <h2 className={featureUI.sectionHeading}>Play this week</h2>
        <Link href="/matches" className="text-xs text-[#D4F829] py-3">All games →</Link>
      </div>
      {loading ? <p role="status" className="text-sm text-white/60">Loading your football week…</p> :
        error ? <div role="alert" className="rounded-2xl border border-white/10 p-4">
          <p className="text-sm text-white/70">Couldn’t load your games. Your profile is safe.</p>
          <button type="button" onClick={load} className="mt-2 min-h-11 text-[#D4F829] text-sm font-bold">Retry</button>
        </div> : data && <>
          {data.pendingInvites > 0 && <Link href="/invites" className="block rounded-xl bg-[#D4F829]/10 p-3 text-sm text-[#D4F829]">{data.pendingInvites} match invitation(s) to respond to →</Link>}
          {data.actions.map(action => <Link key={action.kind + action.matchId} href={`/matches/${action.matchId}`} className="block rounded-xl border border-[#A28B52]/40 p-3 text-sm">
            <span className="block text-[#D4F829]">{action.label} →</span><span className="text-xs text-white/60">{action.title}</span>
          </Link>)}
          <h3 className={featureUI.label}>Your next games</h3>
          {data.upcoming.length ? data.upcoming.map(m => game(m, true)) :
            <p className="text-sm text-white/65">No upcoming game yet. Find a match or organize one with your squad.</p>}
          <h3 className={`${featureUI.label} pt-2`}>Open spots · next 7 days</h3>
          {data.available.length ? data.available.map(m => game(m, false)) :
            <p className="text-sm text-white/65">No public games with open spots this week.</p>}
          <Link href="/matches" className={`${featureUI.primary} flex items-center justify-center`}>Find or create a game</Link>
        </>}
    </section>
  );
}
