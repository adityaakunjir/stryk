"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bug, AlertTriangle, Cpu, Globe, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const triggerClientError = () => {
    toast.info("Triggering client-side error...");
    setTimeout(() => {
      throw new Error("Sentry Test Client-Side Crash Exception");
    }, 500);
  };

  const triggerRouteError = async () => {
    setLoading("route");
    setSuccess(null);
    try {
      const res = await fetch("/api/sentry-test");
      if (res.status === 500) {
        setSuccess("Route exception captured! Check Sentry dashboard.");
        toast.success("Exception logged on Next.js Server");
      } else {
        throw new Error(`Unexpected status: ${res.status}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger route error");
    } finally {
      setLoading(null);
    }
  };

  const triggerBackendError = async () => {
    setLoading("backend");
    setSuccess(null);
    try {
      const res = await fetch("/api/sentry-test?backend=true");
      if (res.status === 500) {
        setSuccess("Backend exception captured! Check Sentry dashboard.");
        toast.success("Exception logged on FastAPI Server");
      } else {
        throw new Error(`Unexpected status: ${res.status}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger backend error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="stryk-mobile-shell text-white bg-[#05070B] min-h-screen relative overflow-hidden flex flex-col justify-between">
      {/* Background radial gradients */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(198,255,0,0.06)_0%,transparent_60%),radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(239,68,68,0.05)_0%,transparent_55%),#05070B]" />

      <div className="relative z-10 flex-1 flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button asChild variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
            <Link href="/">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div className="text-[10px] tracking-[0.35em] uppercase text-red-500 font-bold flex items-center gap-1.5">
            <Bug size={10} className="animate-pulse" /> Sentry Diagnostics
          </div>
          <div className="w-9 h-9" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
              <Bug size={32} />
            </div>
            <h1 className="font-display text-2xl uppercase tracking-wider text-white">Sentry SDK Verification</h1>
            <p className="text-xs text-white/50 mt-2 leading-relaxed">
              Verify real-time crash reporting and exceptions logging across the client, server, and backend.
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. Client Error */}
            <motion.div whileHover={{ y: -2 }} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Cpu size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-white">Client-Side Crash</div>
                  <div className="text-[10px] text-white/40 mt-0.5 mb-3">Triggers a javascript runtime error in the React browser engine.</div>
                  <button
                    onClick={triggerClientError}
                    className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-[11px] font-bold uppercase tracking-widest transition cursor-pointer"
                  >
                    Throw JS Exception
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 2. Next.js Route Error */}
            <motion.div whileHover={{ y: -2 }} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Globe size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-white">Next.js API Route Exception</div>
                  <div className="text-[10px] text-white/40 mt-0.5 mb-3">Hits a server-side route handler that throws an error.</div>
                  <button
                    onClick={triggerRouteError}
                    disabled={loading !== null}
                    className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest transition cursor-pointer disabled:opacity-50"
                  >
                    {loading === "route" ? "Sending Request..." : "Trigger Route Error"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 3. FastAPI Backend Error */}
            <motion.div whileHover={{ y: -2 }} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-white">FastAPI Python Exception</div>
                  <div className="text-[10px] text-white/40 mt-0.5 mb-3">Triggers a division-by-zero exception in the Python backend.</div>
                  <button
                    onClick={triggerBackendError}
                    disabled={loading !== null}
                    className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest transition cursor-pointer disabled:opacity-50"
                  >
                    {loading === "backend" ? "Sending Request..." : "Trigger Backend Error"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Success Banner */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-3 rounded-xl border border-[#C6FF00]/20 bg-[#C6FF00]/5 flex items-center gap-2 text-[#C6FF00]"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{success}</span>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="text-[9px] uppercase tracking-widest text-white/20 text-center mt-8 font-bold">
          STRYK Diagnostic Shell v0.1.0
        </div>
      </div>
    </main>
  );
}
