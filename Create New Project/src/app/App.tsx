import { PhoneFrame } from "./components/phone-frame";
import { AuthScreen } from "./screens/auth";
import { ProfileCreateScreen } from "./screens/profile-create";
import { HomeScreen } from "./screens/home";
import { CardScreen } from "./screens/card";
import { LobbiesScreen } from "./screens/lobbies";
import { TeamBuilderScreen } from "./screens/team-builder";
import { SubmitScreen } from "./screens/submit";
import { VerifyScreen } from "./screens/verify";

const SCREENS = [
  { index: "01", label: "Sign In", node: <AuthScreen /> },
  { index: "02", label: "Profile · Position", node: <ProfileCreateScreen /> },
  { index: "03", label: "Home Lobby", node: <HomeScreen /> },
  { index: "04", label: "Player Card", node: <CardScreen /> },
  { index: "05", label: "Match Lobbies", node: <LobbiesScreen /> },
  { index: "06", label: "Team Builder", node: <TeamBuilderScreen /> },
  { index: "07", label: "Submit Stats", node: <SubmitScreen /> },
  { index: "08", label: "Verify", node: <VerifyScreen /> },
];

export default function App() {
  return (
    <div
      className="min-h-screen w-full text-white relative"
      style={{
        background:
          "radial-gradient(60% 30% at 50% 0%, rgba(198,255,0,0.06) 0%, transparent 60%), #05070B",
      }}
    >
      {/* Subtle dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.25]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Canvas header */}
      <header className="relative px-8 lg:px-14 pt-10 pb-8 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C6FF00] text-black flex items-center justify-center font-display" style={{ fontSize: "1.1rem" }}>
              S
            </div>
            <div>
              <div className="font-display tracking-[0.3em]" style={{ fontSize: "1rem" }}>STRYK</div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 -mt-0.5">Football Identity</div>
            </div>
          </div>
          <h1 className="font-display tracking-wide mt-6" style={{ fontSize: "3rem", lineHeight: 1.02 }}>
            HIGH-FIDELITY <span style={{ color: "#C6FF00" }}>WIREFRAMES</span>
          </h1>
          <div className="text-white/55 mt-3 max-w-xl leading-relaxed">
            A premium, game-inspired football identity platform — designed mobile-first for the
            grassroots player. Every screen prioritises identity, the player card, and the next match.
          </div>
        </div>

        <div className="flex gap-2.5">
          <Chip>9:16 Mobile</Chip>
          <Chip>Dark · Lime Accent</Chip>
          <Chip>FIFA × Linear</Chip>
        </div>
      </header>

      {/* Screen gallery */}
      <section className="relative pb-16">
        <div className="overflow-x-auto">
          <div className="flex items-start gap-10 px-8 lg:px-14 pb-6 min-w-min">
            {SCREENS.map((s) => (
              <PhoneFrame key={s.index} index={s.index} label={s.label}>
                {s.node}
              </PhoneFrame>
            ))}
          </div>
        </div>

        <div className="px-8 lg:px-14 mt-4 text-[11px] tracking-[0.3em] uppercase text-white/35">
          ← Scroll horizontally to navigate all screens →
        </div>
      </section>

      {/* Design system strip */}
      <section className="relative px-8 lg:px-14 pb-20">
        <div className="text-[10px] tracking-[0.35em] uppercase text-white/45 mb-4">Design System</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Swatch name="Background" hex="#05070B" />
          <Swatch name="Surface" hex="#0B1020" />
          <Swatch name="Accent · Lime" hex="#C6FF00" accent />
          <Swatch name="Text" hex="#FFFFFF" textOnly />
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <TypoCard label="Display" sample="STRYK" font="display" size="2.25rem" />
          <TypoCard label="Headline" sample="Friday League" font="display" size="1.5rem" />
          <TypoCard label="Body" sample="Verify performance with peers." font="sans" size="0.95rem" />
          <TypoCard label="Caption" sample="POST-MATCH · 0:42" font="sans" size="0.7rem" tracking />
        </div>
      </section>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase border border-white/10 bg-white/[0.04] text-white/70">
      {children}
    </span>
  );
}

function Swatch({ name, hex, accent, textOnly }: { name: string; hex: string; accent?: boolean; textOnly?: boolean }) {
  return (
    <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.03]">
      <div
        className="h-20 rounded-xl border border-white/10"
        style={{
          background: hex,
          boxShadow: accent ? "0 20px 40px -10px rgba(198,255,0,0.5)" : undefined,
        }}
      >
        {textOnly && (
          <div className="h-full flex items-center justify-center font-display tracking-[0.2em]" style={{ color: hex, mixBlendMode: "difference" }}>Aa</div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-[11px] tracking-[0.2em] uppercase text-white/70">{name}</div>
        <div className="text-[10px] text-white/40 font-mono">{hex}</div>
      </div>
    </div>
  );
}

function TypoCard({ label, sample, font, size, tracking }: { label: string; sample: string; font: "display" | "sans"; size: string; tracking?: boolean }) {
  return (
    <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.03]">
      <div className="text-[10px] tracking-[0.25em] uppercase text-white/45">{label}</div>
      <div
        className={font === "display" ? "font-display" : ""}
        style={{ fontSize: size, marginTop: "0.5rem", letterSpacing: tracking ? "0.25em" : undefined }}
      >
        {sample}
      </div>
    </div>
  );
}
