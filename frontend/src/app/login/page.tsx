"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Radio, UserRound, Zap, Loader2, ArrowRight, Sparkles, Mail, Lock } from "lucide-react";
import { SignIn } from "@clerk/nextjs";

import { StrykLogo } from "@/components/stryk-logo";
import { Button } from "@/components/ui/button";

const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Save authentication state
    localStorage.setItem("stryk_demo_auth", "true");
    
    // Check if player profile exists
    const hasProfile = localStorage.getItem("stryk_player_data");
    setLoading(false);
    
    if (hasProfile) {
      router.push("/home");
    } else {
      router.push("/identity");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-white">
      {/* Figma Ambient bg */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 50% 0%, rgba(198,255,0,0.18) 0%, transparent 60%), radial-gradient(70% 50% at 50% 100%, rgba(91,140,255,0.10) 0%, transparent 60%), #05070B",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-56 opacity-[0.12] pointer-events-none"
        style={{
          background:
            "linear-gradient(transparent, rgba(198,255,0,0.5)), repeating-linear-gradient(90deg, transparent 0 30px, rgba(255,255,255,0.5) 30px 31px)",
          transform: "perspective(420px) rotateX(72deg)",
          transformOrigin: "bottom",
        }}
      />

      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 pb-8 pt-7 sm:px-8 lg:px-10 z-10">
        <header className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" size="icon" aria-label="Back to home" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
            <Link href="/">
              <ArrowLeft size={16} />
            </Link>
          </Button>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            {hasClerkKeys ? "Secure Login" : "Guest Mode"}
          </div>
        </header>

        <div className="mx-auto mt-8 flex w-full max-w-[48rem] flex-1 flex-col items-center">
          <div className="flex items-center gap-2 justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#C6FF00] text-black flex items-center justify-center font-display text-base">S</div>
            <div className="font-display tracking-[0.35em] text-base">STRYK</div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#C6FF00] font-bold">Build your legend</p>
            <h1 className="font-display tracking-wide mt-2 text-4xl sm:text-6xl uppercase italic leading-none">
              YOUR FOOTBALL IDENTITY,<br/>
              <span className="text-[#C6FF00]" style={{ textShadow: "0 0 24px rgba(198,255,0,0.25)" }}>UNLOCKED.</span>
            </h1>
            <p className="mt-4 text-[13px] text-white/55 max-w-sm mx-auto leading-relaxed">
              One profile. Every match. Verified stats, growing reputation, a card that evolves with you.
            </p>
          </div>

          {/* Clerk Sign-In Component or Custom Mock Login */}
          <div className="mt-8 flex w-full justify-center">
            {hasClerkKeys ? (
              <SignIn
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full max-w-md",
                    cardBox: "w-full shadow-none",
                    card: "bg-zinc-950/76 border border-[#C6FF00]/25 rounded-[2rem] shadow-[0_24px_90px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl",
                    headerTitle: "text-white text-2xl font-black font-display uppercase tracking-wide",
                    headerSubtitle: "text-zinc-400 text-xs font-semibold",
                    formFieldLabel: "text-zinc-300 font-bold text-xs uppercase tracking-wide",
                    formFieldInput:
                      "bg-white/[0.04] border-white/10 text-white rounded-2xl h-12 pl-5 placeholder:text-zinc-500 focus:border-[#C6FF00]/50 focus:ring-[#C6FF00]/20",
                    formButtonPrimary:
                      "bg-[#C6FF00] text-black font-display tracking-[0.2em] uppercase h-12 rounded-2xl hover:bg-[#b0e600] shadow-[0_12px_24px_rgba(198,255,0,0.35)] transition-all",
                    socialButtonsBlockButton:
                      "border-white/10 bg-white/[0.04] text-white h-12 rounded-2xl hover:bg-white/[0.08] font-bold text-xs uppercase tracking-wider transition",
                    dividerLine: "bg-white/10",
                    dividerText: "text-zinc-500 font-black",
                    footerActionLink:
                      "text-[#C6FF00] font-black hover:text-lime-200",
                    identityPreviewEditButton: "text-[#C6FF00]",
                    formFieldAction: "text-[#C6FF00] font-black",
                  },
                }}
              />
            ) : (
              <form onSubmit={handleDemoLogin} className="w-full max-w-md rounded-[2.2rem] border border-white/8 bg-[#0B1020]/50 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-8">
                <h2 className="text-xl font-display uppercase tracking-wider">Sign In</h2>
                <p className="mt-1 text-xs font-semibold text-white/45">Continue with a guest profile</p>
                
                <div className="mt-6 space-y-3">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/50">Email Address</span>
                    <Field 
                      icon={<Mail size={14} />} 
                      placeholder="Email or phone" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/50">Password</span>
                    <Field 
                      icon={<Lock size={14} />} 
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      required
                    />
                  </div>
                </div>

                <button 
                  className="mt-6 w-full rounded-2xl py-3.5 bg-[#C6FF00] text-black font-display tracking-[0.22em] flex items-center justify-center gap-2 cursor-pointer transition hover:bg-[#b0e600]"
                  style={{ fontSize: "0.95rem", boxShadow: "0 20px 40px -10px rgba(198,255,0,0.55)" }}
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      LOGGING IN...
                    </>
                  ) : (
                    <>
                      CONTINUE <ArrowRight size={16} strokeWidth={3} />
                    </>
                  )}
                </button>

                <div className="relative my-5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <span className="relative bg-[#0B1020]/90 px-3 text-[10px] font-bold uppercase text-white/40">OR</span>
                </div>

                <button 
                  onClick={handleDemoLogin} 
                  className="w-full rounded-2xl py-3 border border-white/10 bg-white/5 text-[11px] tracking-[0.22em] uppercase font-display flex items-center justify-center gap-2 cursor-pointer transition hover:bg-white/10 hover:border-[#C6FF00]/40"
                  type="button"
                >
                  <Sparkles size={13} className="fill-[#C6FF00] text-[#C6FF00]" />
                  Play as Guest
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            <Radio className="size-4 text-[#C6FF00] animate-pulse" />
            Match identity sync ready
            <UserRound className="size-4 text-[#C6FF00]" />
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ icon, placeholder, value, onChange, type = "text", required }: { icon: React.ReactNode; placeholder: string; value: string; onChange: (e: any) => void; type?: string; required?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] h-12 flex items-center px-4 gap-2.5 focus-within:border-[#C6FF00]/50 transition duration-200">
      <span className="text-white/40 shrink-0">{icon}</span>
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        required={required}
        className="bg-transparent outline-none flex-1 text-[13px] placeholder:text-white/40 text-white w-full border-0 focus:ring-0 p-0" 
      />
    </div>
  );
}

