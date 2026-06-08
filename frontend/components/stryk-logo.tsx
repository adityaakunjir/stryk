import { cn } from "@/lib/utils";

export function StrykLogo({
  compact = false,
  centered = false}: {
  compact?: boolean;
  centered?: boolean;
}) {
  return (
    <div
      className={cn("flex items-center gap-3", centered && "flex-col gap-2")}
      aria-label="STRYK"
    >
      <div className={cn("relative", compact ? "size-12" : "size-11")}>
        <div className="absolute inset-0 rotate-12 rounded-[10px] bg-lime-300 shadow-[0_0_28px_rgba(190,255,24,0.45)] [clip-path:polygon(54%_0,100%_0,62%_44%,94%_44%,25%_100%,44%_56%,0_56%)]" />
        <div className="absolute inset-1 -rotate-12 rounded-[8px] bg-cyan-400/90 [clip-path:polygon(55%_0,96%_0,59%_42%,88%_42%,21%_100%,42%_56%,4%_56%)]" />
      </div>
      <span
        className={cn(
          "font-black italic tracking-[-0.03em] text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]",
          compact ? "text-4xl" : "text-3xl",
        )}
      >
        STRYK
      </span>
    </div>
  );
}
