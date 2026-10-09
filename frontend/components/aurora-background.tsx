/** Static STRYK aurora: no animation loop, SVG noise filter, or full-screen blur. */
export function AuroraBackground() {
  return <div aria-hidden="true" className="fixed inset-0 z-[-1] pointer-events-none" style={{
    background: "radial-gradient(ellipse at 10% 0%, #1A361D66, transparent 55%), radial-gradient(ellipse at 85% 35%, #8E793E25, transparent 50%), radial-gradient(ellipse at 50% 100%, #32451C40, transparent 60%), #050505",
  }} />;
}
