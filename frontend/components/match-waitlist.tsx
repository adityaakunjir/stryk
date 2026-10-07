"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { featureUI } from "@/lib/feature-ui";

type Queue = { count: number; position: number | null; active: boolean; joined: boolean;
  full: boolean; standbys: { username: string; position: string | null }[] };

export function MatchWaitlist({ matchId, privateGame, revision, onRosterChange }: {
  matchId: string; privateGame: boolean; revision: string; onRosterChange: () => void;
}) {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const lastJoined = useRef<boolean | null>(null);
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/waitlist`, { cache: "no-store" });
      if (!response.ok) throw new Error("Couldn’t load standby. Please retry when connected.");
      const state: Queue = await response.json();
      if (lastJoined.current !== null && state.joined !== lastJoined.current) {
        onRosterChange();
        if (state.joined) setNotice("A spot opened. You’re now in the game—check the roster below.");
      }
      lastJoined.current = state.joined;
      setQueue(state); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t load standby."); }
  }, [matchId, onRosterChange]);
  useEffect(() => {
    lastJoined.current = null; setQueue(null);
    setPassword(""); setConsent(false); setNotice("");
  }, [matchId]);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 15000);
    return () => window.clearInterval(timer);
  }, [load, revision]);
  async function change(join: boolean) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/matches/${matchId}/waitlist`, {
        method: join ? "POST" : "DELETE", headers: { "Content-Type": "application/json" },
        ...(join ? { body: JSON.stringify({ password: password || null }) } : {}),
      });
      const state = await response.json();
      if (!response.ok) throw new Error(typeof state.detail === "string" ? state.detail : "Couldn’t update standby.");
      setQueue(state); setPassword(""); setConsent(false);
      setNotice(join ? "You’re on standby, not in the active roster yet." : "You left standby.");
      onRosterChange();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t update standby."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Waitlist and substitutes" className={`${featureUI.panel} p-5 mb-4 shrink-0`}>
    <p className={featureUI.label}>Next player up</p>
    <h2 className={`${featureUI.sectionHeading} mt-1`}>Standby & substitutes</h2>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}<button onClick={() => { void load(); }} className="block min-h-11 text-[#D4F829]">Refresh standby</button></p>}
    {notice && <p role="status" className="mt-3 text-sm text-[#D4F829]">{notice}</p>}
    {!queue ? <p className="mt-3 text-sm text-white/65">Loading standby…</p> : <>
      <p className="mt-3 text-sm text-white/70">{queue.count} waiting · First come, first served</p>
      {queue.joined ? <p className="mt-2 text-sm text-white/65">You’re in the active roster. If someone leaves before kickoff, the next standby player automatically fills the spot.</p>
        : queue.position ? <>
          <p className="mt-2 text-sm text-[#EFE8D6]">Your queue position: #{queue.position}</p>
          <p className="mt-2 text-sm text-white/65">{queue.active ? "You’ll automatically join if a place opens before kickoff. Stay ready, or leave standby if you can’t play." : "Standby is closed. You were not added to the roster; no automatic replacements happen after kickoff."}</p>
          <button disabled={busy} onClick={() => { void change(false); }} className="mt-3 min-h-12 w-full rounded-full border border-[#A28B52]/40 font-display text-xl uppercase text-[#EFE8D6] disabled:opacity-50">Leave standby</button>
        </> : !queue.active ? <p className="mt-2 text-sm text-white/65">Standby closes at kickoff, when the host starts the game, or when it’s cancelled.</p>
          : !queue.full ? <p className="mt-2 text-sm text-white/65">There’s a spot available—use Join Match to enter the roster.</p> : <>
            <p className="mt-2 text-sm text-white/65">Full game? Be its next substitute. Standby players don’t count toward the roster or match stats.</p>
            {privateGame && <label className={`${featureUI.label} block mt-4`}>Game password (not needed if invited)<input type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} className={featureUI.input} /></label>}
            <label className="mt-3 flex min-h-12 items-center gap-3 text-sm text-white/80"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="size-5 shrink-0 accent-[#D4F829]" />I’m available and agree to automatically join if a spot opens before kickoff.</label>
            <button disabled={busy || !consent} onClick={() => { void change(true); }} className={`${featureUI.primary} mt-3`}>{busy ? "Saving…" : "Join standby"}</button>
          </>}
      {queue.standbys.length > 0 && <ol aria-label="Host standby list" className="mt-4 space-y-2 text-sm text-[#EFE8D6]">{queue.standbys.map((person, index) => <li key={`${person.username}-${index}`} className="rounded-xl bg-white/5 p-3">#{index + 1} · @{person.username}{person.position ? ` · ${person.position}` : ""}</li>)}</ol>}
    </>}
  </section>;
}
