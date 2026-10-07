"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { featureUI } from "@/lib/feature-ui";

type Reminder = { id: string; matchId: string; message: string; read: boolean };
type Inbox = { enabled: boolean; pushAvailable: boolean; publicKey: string; items: Reminder[] };

export function MatchReminders() {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  async function load() {
    setError("");
    try {
      const res = await fetch("/api/reminders", { cache: "no-store" });
      if (!res.ok) throw new Error("Couldn’t load match reminders. Retry when connected.");
      setInbox(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t load reminders."); }
  }
  useEffect(() => {
    void load();
    if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistration("/").then(async reg => {
      if (reg && "pushManager" in reg) setSubscribed(Boolean(await reg.pushManager.getSubscription()));
    }).catch(() => {});
  }, []);
  async function toggle() {
    if (!inbox) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/reminders/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !inbox.enabled }) });
      if (!res.ok) throw new Error("Couldn’t save your preference.");
      setInbox({ ...inbox, enabled: !inbox.enabled });
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t save preference."); }
    finally { setBusy(false); }
  }
  async function phoneNotifications() {
    if (!inbox) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) throw new Error("Phone push isn’t available here. On iPhone, install STRYK on your Home Screen and open it there.");
      if (!subscribed && !inbox.pushAvailable) throw new Error("Phone push is not configured yet. In-app reminders still work.");
      if (!subscribed && await Notification.requestPermission() !== "granted") throw new Error("Notifications are not allowed. Change this in browser or phone settings; in-app reminders still work.");
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (subscribed && subscription) {
        const res = await fetch("/api/reminders/devices/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
        if (!res.ok) throw new Error("Couldn’t disable phone notifications. Please retry.");
        await subscription.unsubscribe();
        setSubscribed(false); setMessage("Phone notifications disabled for this device.");
      } else {
        const raw = atob(inbox.publicKey.replace(/-/g, "+").replace(/_/g, "/"));
        const key = Uint8Array.from(raw, char => char.charCodeAt(0));
        subscription = subscription || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        const res = await fetch("/api/reminders/devices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
        if (!res.ok) throw new Error("Couldn’t save this device. Please retry enabling notifications.");
        setSubscribed(true); setMessage("Phone notifications enabled on this device.");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t update phone notifications."); }
    finally { setBusy(false); }
  }
  async function read(id: string) {
    try {
      const res = await fetch(`/api/reminders/${id}/read`, { method: "POST" });
      if (!res.ok) throw new Error();
      setInbox(current => current ? { ...current, items: current.items.map(item => item.id === id ? { ...item, read: true } : item) } : current);
    } catch { setError("Couldn’t mark this reminder read. Please retry."); }
  }
  async function testNotification() {
    setBusy(true); setError(""); setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) throw new Error("Enable phone notifications on this device first.");
      const res = await fetch("/api/reminders/devices/test", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
      const result = await res.json();
      if (!res.ok) throw new Error(typeof result.detail === "string" ? result.detail : "Couldn’t send the test notification.");
      setMessage(result.message);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t send the test notification."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Match reminders" className={`${featureUI.panel} p-5 mb-6 text-[#EFE8D6]`}>
    <p className={`${featureUI.label} mb-1`}>Stay match ready</p>
    <h2 className={featureUI.sectionHeading}>Match reminders</h2>
    <p className="mt-2 text-sm text-white/65">Kickoff within 24 hours and 1 hour, game changes/cancellations, and stat deadlines. Only for games you host or join.</p>
    {error && <div role="alert" className="mt-3 text-sm text-red-300">{error}<button onClick={load} className="block min-h-11 text-[#C3DF1B]">Retry</button></div>}
    {message && <p role="status" className="mt-3 text-sm text-[#C3DF1B]">{message}</p>}
    {!inbox ? <p className="mt-3 text-sm">Loading reminders…</p> : <>
      <button role="switch" aria-checked={inbox.enabled} disabled={busy} onClick={toggle} className="mt-3 flex min-h-12 w-full items-center justify-between rounded-xl border border-white/20 px-3 text-sm disabled:opacity-50"><span>Match reminders</span><span className="text-[#C3DF1B]">{inbox.enabled ? "On" : "Off"}</span></button>
      {inbox.enabled && <><button disabled={busy} onClick={phoneNotifications} className={`${featureUI.primary} mt-3`}>{busy ? "Saving…" : subscribed ? "Disable phone notifications" : "Enable phone notifications"}</button>
        <button disabled={busy} onClick={testNotification} className="mt-3 min-h-12 w-full rounded-full border border-[#A28B52]/40 px-4 font-display text-xl uppercase text-[#EFE8D6] disabled:opacity-50">Send test notification</button>
        <p className="mt-2 text-xs text-white/60">Phone alerts need your permission. On iPhone, open the installed Home Screen app. <Link href="/install" className="text-[#C3DF1B]">Installation guide →</Link></p>
        {!inbox.pushAvailable && <p className="mt-2 text-xs text-amber-300">Phone push setup is pending. In-app reminders are available.</p>}</>}
      <div className="mt-4 space-y-3">{inbox.items.length === 0 ? <p className="text-sm text-white/60">No match reminders yet.</p> : inbox.items.map(item => <article key={item.id} className={`rounded-xl border p-3 ${item.read ? "border-white/10" : "border-[#C3DF1B]/30"}`}>
        <p className="text-sm">{item.message}</p><Link onClick={() => { void read(item.id); }} href={`/matches/${item.matchId}`} className="inline-flex min-h-11 items-center text-sm text-[#C3DF1B]">Open game →</Link>
        {!item.read && <button onClick={() => { void read(item.id); }} className="min-h-11 ml-4 text-xs text-white/60">Mark read</button>}
      </article>)}</div>
    </>}
  </section>;
}
