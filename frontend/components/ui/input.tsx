import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-16 w-full rounded-[1.35rem] border border-white/14 bg-black/18 px-14 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition placeholder:text-zinc-500 focus:border-lime-300/70 focus:bg-black/28 focus:ring-2 focus:ring-lime-300/15 sm:h-[4.35rem] sm:text-lg",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
