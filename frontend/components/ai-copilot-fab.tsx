"use client";

import { useState } from "react";
import { Cpu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiCopilotFab() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full",
          "glass-panel  border border-white/10 shadow-[0_4px_24px_rgba(195,223,27,0.15)]",
          "hover:glass-panel0 transition-all duration-300 group",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Cpu className="w-5 h-5 text-[#C3DF1B] group-hover:drop-shadow-[0_0_8px_rgba(195,223,27,0.8)] transition-all" />
      </button>

      {/* Slide-out Panel */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 h-[60dvh] max-w-md mx-auto rounded-t-3xl",
          "glass-panel  border-t border-x border-white/10 shadow-2xl flex flex-col",
          "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#C3DF1B]/10 border border-[#C3DF1B]/30">
              <Cpu className="w-4 h-4 text-[#C3DF1B]" />
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#C3DF1B]" />
            </div>
            <h3 className="font-display text-xl text-white tracking-wide">STRYK AGENT</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:glass-panel rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center mb-4">
            <Cpu className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-400 font-mono mb-2">INITIALIZING RAG SEQUENCE...</p>
          <p className="text-xs text-gray-400">Agent systems offline. Awaiting Phase 2 connection.</p>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40  transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
