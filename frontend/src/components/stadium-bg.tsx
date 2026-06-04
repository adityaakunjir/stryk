export function StadiumBg() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(198,255,0,0.10) 0%, transparent 60%), radial-gradient(80% 60% at 50% 100%, rgba(91,140,255,0.06) 0%, transparent 60%), #05070B",
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      {/* Stadium lights */}
      <div className="absolute top-0 left-1/4 w-px h-40 bg-gradient-to-b from-[#C6FF00]/40 to-transparent" />
      <div className="absolute top-0 right-1/4 w-px h-40 bg-gradient-to-b from-[#C6FF00]/40 to-transparent" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#C6FF00] blur-md opacity-60" />
      {/* Subtle grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-64 opacity-[0.08]"
        style={{
          background:
            "linear-gradient(transparent, rgba(198,255,0,0.4)), repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,0.4) 40px 41px), repeating-linear-gradient(0deg, transparent 0 40px, rgba(255,255,255,0.4) 40px 41px)",
          transform: "perspective(600px) rotateX(70deg)",
          transformOrigin: "bottom",
        }}
      />
    </div>
  );
}
