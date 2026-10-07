"use client";

import { useEffect, useState } from "react";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const mode = window.matchMedia("(display-mode: standalone)");
    const detect = () => setInstalled(mode.matches ||
      !!(navigator as Navigator & { standalone?: boolean }).standalone);
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const complete = () => { setInstalled(true); setPrompt(null); };
    detect();
    mode.addEventListener("change", detect);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    return () => {
      mode.removeEventListener("change", detect);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === "accepted"
        ? "Installation requested. Look for STRYK on your home screen."
        : "You can install later using your browser menu.");
      setPrompt(null);
    } catch {
      setMessage("Use your browser menu to install STRYK instead.");
    } finally { setBusy(false); }
  }

  return (
    <section className="space-y-6">
      {installed ? (
        <p role="status" className="rounded-2xl border border-[#D4F829]/30 p-5 text-[#D4F829]">
          You’re already using STRYK as an app.
        </p>
      ) : (
        <>
          {prompt && <button type="button" onClick={install} disabled={busy}
            className="w-full rounded-full bg-[#D4F829] px-6 py-4 font-bold text-[#151515] disabled:opacity-50">
            {busy ? "Opening install prompt…" : "Install STRYK"}
          </button>}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-3 text-lg font-bold">Android</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-white/75">
              <li>Open stryk.games in Chrome.</li>
              <li>Tap Install STRYK above, or open Chrome’s ⋮ menu.</li>
              <li>Choose “Install app” or “Add to Home screen” and confirm.</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-3 text-lg font-bold">iPhone / iPad</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-white/75">
              <li>Open stryk.games in Safari.</li>
              <li>Tap Share, then “Add to Home Screen” (you may need to scroll).</li>
              <li>If shown, leave “Open as Web App” enabled, then tap Add.</li>
            </ol>
          </div>
        </>
      )}
      {message && <p role="status" className="text-sm text-[#D4F829]">{message}</p>}
      <p className="text-sm leading-relaxed text-white/60">
        Launch STRYK from your home screen for an app-style experience.
        Your existing account and profile stay the same. Sign in if prompted.
        Matches and profile updates require an internet connection.
      </p>
    </section>
  );
}
