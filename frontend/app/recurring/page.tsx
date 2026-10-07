"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { featureUI } from "@/lib/feature-ui";

type Occurrence = { id: string; week: number; date: string; status: string; players: number; maxPlayers: number; joined: boolean };
type Schedule = { id: string; title: string; location: string; timezone: string; active: boolean; isHost: boolean; occurrences: Occurrence[] };

export default function RecurringGamesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [requestKey, setRequestKey] = useState("");
  const [stopping, setStopping] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/recurring", { cache: "no-store" });
      if (!response.ok) throw new Error("Couldn’t load your weekly games. Please retry.");
      setSchedules(await response.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t load games."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setRequestKey(crypto.randomUUID());
    void load();
  }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/recurring", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: fields.get("title"), location: fields.get("location"),
          turf: fields.get("turf"), format: fields.get("format"), firstLocal: fields.get("firstLocal"),
          timezone, weeks: Number(fields.get("weeks")), requestKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Check your schedule details and try again.");
      setSchedules(current => [data, ...current.filter(s => s.id !== data.id)]);
      setRequestKey(crypto.randomUUID());
      form.reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t create schedule."); }
    finally { setBusy(false); }
  }

  async function stop(id: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/recurring/${id}/stop`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Couldn’t stop schedule.");
      setSchedules(current => current.map(s => s.id === id ? data : s));
      setStopping(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t stop schedule."); }
    finally { setBusy(false); }
  }

  const inputClass = featureUI.input;
  return <main className={featureUI.screen}>
    <div className="mx-auto max-w-md px-6 pt-8 pb-14 space-y-6">
      <Link href="/matches" aria-label="Back to matches" className={featureUI.back}><ArrowLeft size={18} /></Link>
      <header><p className={`${featureUI.label} mb-2`}>Your squad ritual</p><h1 className={featureUI.heading}>Weekly games</h1><p className="mt-3 text-sm text-white/65">Same squad ritual. A separate roster every week.</p></header>
      {error && <div role="alert" className="rounded-xl border border-red-400/40 p-4 text-sm">{error}<button onClick={load} className="block min-h-11 text-[#C3DF1B]">Retry loading</button></div>}
      <section aria-labelledby="my-schedules"><h2 id="my-schedules" className={`${featureUI.label} mb-3`}>Your schedules</h2>
        {loading ? <p role="status">Loading weekly games…</p> : schedules.length === 0 ? <p className="text-sm text-white/65">No weekly games yet. Create your first schedule below.</p> : schedules.map(schedule => <article key={schedule.id} className={`${featureUI.panel} mb-4 p-5`}>
          <h3 className={featureUI.sectionHeading}>{schedule.title}</h3><p className="mt-1 break-words text-xs text-white/65">{schedule.location} · {schedule.timezone}</p>
          {!schedule.active && <p className="mt-2 text-amber-300 text-sm">Schedule stopped</p>}
          <ul className="mt-3 space-y-2">{schedule.occurrences.map(game => <li key={game.id}><Link href={`/matches/${game.id}`} className="flex min-h-16 justify-between gap-3 rounded-xl bg-white/5 p-3">
            <span><span className="block text-sm font-semibold">Week {game.week} · {new Date(game.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: schedule.timezone })}</span>
              <span className="text-xs text-white/65">{new Date(game.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZone: schedule.timezone })} · {game.players}/{game.maxPlayers} players</span></span>
            <span className="self-center text-xs text-[#C3DF1B]">{game.status === "cancelled" ? "Cancelled" : game.joined ? "Joined →" : "View →"}</span>
          </Link></li>)}</ul>
          <p className="mt-3 text-xs text-white/60">Open a game to invite friends or manage attendance for that week.</p>
          {schedule.isHost && schedule.active && (stopping === schedule.id ? <div className="mt-3 rounded-xl border border-amber-300/30 p-3"><p className="text-sm">Cancel all future, unstarted games? Past games and results stay saved.</p><button disabled={busy} onClick={() => stop(schedule.id)} className="min-h-12 text-amber-300 mr-5">Confirm stop</button><button disabled={busy} onClick={() => setStopping(null)} className="min-h-12">Keep schedule</button></div> : <button onClick={() => setStopping(schedule.id)} className="mt-2 min-h-11 text-sm text-amber-300">Stop future games</button>)}
        </article>)}
      </section>
      <section className={`${featureUI.panel} p-5`}><h2 className={featureUI.sectionHeading}>Create a weekly schedule</h2>
        <p className="mt-2 text-sm text-white/65">Creates 2–12 public games. You join as host; friends choose each week separately.</p>
        <form onSubmit={create} className="mt-5 space-y-5 [&_label]:text-[10px] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-[0.15em] [&_label]:text-[#A28B52]">
          <label className="block text-sm">Game name<input name="title" required maxLength={100} className={inputClass} placeholder="Sunday squad" /></label>
          <label className="block text-sm">Location<input name="location" required maxLength={200} className={inputClass} placeholder="Venue address" /></label>
          <label className="block text-sm">Turf name (optional)<input name="turf" maxLength={100} className={inputClass} /></label>
          <label className="block text-sm">First kickoff<input name="firstLocal" type="datetime-local" required className={inputClass} /></label>
          <label className="block text-sm">Timezone<input value={timezone} onChange={e => setTimezone(e.target.value)} required className={inputClass} /><span className="mt-1 block text-xs text-white/60">Every week at this local time. Example: Asia/Kolkata.</span></label>
          <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Format<select name="format" defaultValue="5v5" className={inputClass}>{["3v3", "5v5", "6v6", "7v7", "11v11"].map(format => <option key={format}>{format}</option>)}</select></label>
          <label className="block text-sm">Weeks<select name="weeks" defaultValue="4" className={inputClass}>{Array.from({ length: 11 }, (_, i) => i + 2).map(n => <option key={n}>{n}</option>)}</select></label></div>
          <button disabled={busy || !requestKey} className={featureUI.primary}>{busy ? "Saving…" : "Create weekly games"}</button>
        </form>
      </section>
    </div>
  </main>;
}
