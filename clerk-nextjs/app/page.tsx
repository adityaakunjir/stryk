"use client";

import { useClerk } from "@clerk/nextjs";
import { PlayerCard, Player } from "./components/player-card";
import { User, Users, Shield, TrendingUp } from "lucide-react";

const DEMO_PLAYER: Player = {
  name: "YOUR NAME",
  username: "yourtag",
  position: "CAM",
  ovr: 84,
  style: "Playmaker",
  foot: "L",
  nation: "IND",
  matches: 142,
  stats: { PAC: 80, SHO: 79, PAS: 87, DRI: 85, DEF: 52, PHY: 71 },
  avatarUrl: "",
};

const FEATURES = [
  { icon: User, label: "Player Cards", desc: "Your football identity" },
  { icon: Users, label: "Match Lobbies", desc: "Play with your squad" },
  { icon: Shield, label: "Real Stats", desc: "Verify. Trust. Level up." },
  { icon: TrendingUp, label: "Grow & Earn", desc: "Badges. Titles. Respect." },
];

export default function LandingPage() {
  const { openSignIn, openSignUp } = useClerk();

  function handleLogIn() {
    openSignIn({ afterSignInUrl: "/dashboard" });
  }

  function handleJoinStryk() {
    openSignUp({ afterSignUpUrl: "/onboarding" });
  }

  return (
    <div
      style={{ height: "100dvh", overflow: "hidden", background: "#0A0A0A" }}
      className="flex items-center justify-center"
    >
      {/* Phone frame */}
      <div
        style={{
          width: "100%",
          maxWidth: "390px",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          background: "#05070B",
        }}
        className="flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          {/* STRYK logo */}
          <div className="flex items-center gap-1.5">
            <span className="text-lg">⚡</span>
            <span
              className="text-white font-black uppercase"
              style={{ letterSpacing: "0.3em" }}
            >
              STRYK
            </span>
          </div>

          {/* Log In pill */}
          <button
            onClick={handleLogIn}
            className="border rounded-full text-white text-sm"
            style={{
              borderColor: "rgba(255,255,255,0.20)",
              paddingLeft: "1rem",
              paddingRight: "1rem",
              paddingTop: "0.375rem",
              paddingBottom: "0.375rem",
              letterSpacing: "0.1em",
            }}
          >
            Log In
          </button>
        </div>

        {/* Hero section */}
        <div className="px-5 pt-3 pb-2">
          <p
            className="uppercase mb-2"
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              color: "rgba(198,255,0,0.80)",
            }}
          >
            YOUR FOOTBALL IDENTITY
          </p>
          <h1
            className="font-black leading-tight tracking-tight text-white"
            style={{ fontSize: "1.875rem" }}
          >
            BUILT. PLAYED.
            <br />
            <span style={{ color: "#C6FF00" }}>REMEMBERED.</span>
          </h1>
          <p
            className="mt-2"
            style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.60)" }}
          >
            Real matches. Real stats. Real you. This is your STRYK.
          </p>
        </div>

        {/* PlayerCard preview */}
        <div className="flex items-center justify-center py-2">
          <div className="animate-float">
            <PlayerCard player={DEMO_PLAYER} size="md" />
          </div>
        </div>

        {/* Feature grid */}
        <div className="px-5 py-2">
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="rounded-2xl flex flex-col gap-1"
                style={{
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Icon className="w-5 h-5" style={{ color: "#C6FF00" }} />
                <span
                  className="font-bold text-white"
                  style={{ fontSize: "0.875rem" }}
                >
                  {label}
                </span>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.50)" }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* JOIN STRYK CTA */}
        <div className="px-5 pb-6 pt-2">
          <button
            onClick={handleJoinStryk}
            className="w-full rounded-full flex items-center justify-between font-black"
            style={{
              background: "#C6FF00",
              color: "#000000",
              paddingTop: "1rem",
              paddingBottom: "1rem",
              paddingLeft: "1.5rem",
              paddingRight: "1.5rem",
              letterSpacing: "0.2em",
              fontSize: "0.875rem",
            }}
          >
            <span>JOIN STRYK</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
