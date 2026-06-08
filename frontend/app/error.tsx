"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log to an error reporting service
    console.error("STRYK Error Boundary:", error);
  }, [error]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white flex items-center justify-center px-6">
      {/* Ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 40%, rgba(239,68,68,0.12) 0%, transparent 60%), #05070B"}}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <AlertTriangle size={32} className="text-red-400" />
        </div>

        <h1 className="font-display text-2xl uppercase tracking-wider">
          Something Went Wrong
        </h1>

        <p className="mt-3 text-sm text-white/50 leading-relaxed">
          An unexpected error occurred. This has been noted and we&apos;re on it.
        </p>

        {error?.digest && (
          <p className="mt-2 text-[10px] text-white/25 uppercase tracking-widest font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          className="mt-8 h-12 px-8 rounded-2xl bg-[#C6FF00] text-black font-display tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#b0e600] transition duration-200"
          style={{
            boxShadow: "0 20px 40px -10px rgba(198,255,0,0.4)"}}
        >
          <RotateCcw size={14} strokeWidth={3} />
          TRY AGAIN
        </button>

        <a
          href="/home"
          className="mt-4 text-xs text-white/40 uppercase tracking-widest hover:text-white/70 transition"
        >
          Back to Home
        </a>
      </div>
    </main>
  );
}
