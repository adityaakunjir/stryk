"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragCancelEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FIFAPlayerCard } from "./fifa-player-card";
import { X } from "lucide-react";

export interface PlayerPosition {
  playerId: string;
  x: number;
  y: number;
  playerData?: any;
}

export interface FormationGridProps {
  maxPlayers: number;
  teamPlayers: PlayerPosition[];
  onPlayerDrop: (playerId: string, x: number, y: number) => void;
  onPlayerRemove: (playerId: string) => void;
  pitchColor?: "light" | "dark";
  readOnly?: boolean;
  showZoneLabels?: boolean;
}

// Calculate pitch dimensions based on player count - MOBILE OPTIMIZED
const getPitchDimensions = (maxPlayers: number) => {
  // Mobile-first: use full available width minus padding
  // Standard pitch aspect ratio 105:68 (1.54:1)
  if (typeof window !== 'undefined') {
    const baseWidth = Math.min(window.innerWidth - 40, 340);
    const baseHeight = baseWidth * 0.68;
    return {
      width: baseWidth,
      height: baseHeight,
      maxPlayers,
    };
  }
  
  // Fallback for SSR
  return {
    width: 300,
    height: 204,
    maxPlayers,
  };
};

// Defensive, Midfield, Forward zones
const getZoneLabel = (y: number): string => {
  if (y < 30) return "DEF";
  if (y < 60) return "MID";
  return "FWD";
};

interface DraggablePlayerToken {
  position: PlayerPosition;
  playerData: any;
  isDragging: boolean;
  onRemove: (playerId: string) => void;
  pitchWidth: number;
  pitchHeight: number;
}

function DraggablePlayerToken({
  position,
  playerData,
  isDragging,
  onRemove,
  pitchWidth,
  pitchHeight,
}: DraggablePlayerToken) {
  const [showRemove, setShowRemove] = useState(false);

  const pixelX = (position.x / 100) * pitchWidth;
  const pixelY = (position.y / 100) * pitchHeight;

  return (
    <motion.div
      key={`player-${position.playerId}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isDragging ? 1.1 : 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "absolute",
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseEnter={() => setShowRemove(true)}
      onMouseLeave={() => setShowRemove(false)}
      className="cursor-grab active:cursor-grabbing"
    >
      <div className="relative">
        <FIFAPlayerCard player={playerData} size="sm" draggable />

        {/* Remove button */}
        <AnimatePresence>
          {showRemove && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => onRemove(position.playerId)}
              className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full p-1 shadow-lg z-50"
            >
              <X className="w-3 h-3 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function FormationGrid({
  maxPlayers,
  teamPlayers,
  onPlayerDrop,
  onPlayerRemove,
  pitchColor = "dark",
  readOnly = false,
  showZoneLabels = true,
}: FormationGridProps) {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const dims = getPitchDimensions(maxPlayers);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (readOnly) return;
    setDraggedPlayer(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedPlayer(null);

    if (readOnly || !pitchRef.current) return;

    const pitchRect = pitchRef.current.getBoundingClientRect();
    const clientX = event.delta.x + pitchRect.left;
    const clientY = event.delta.y + pitchRect.top;

    const x = ((clientX - pitchRect.left) / pitchRect.width) * 100;
    const y = ((clientY - pitchRect.top) / pitchRect.height) * 100;

    // Clamp to pitch boundaries
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    onPlayerDrop(event.active.id as string, clampedX, clampedY);
  };

  const handleDragCancel = () => {
    setDraggedPlayer(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Info text */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-white mb-1">
          Team Formation ({teamPlayers.length}/{maxPlayers})
        </h3>
        <p className="text-sm text-gray-400">Drag players onto the pitch</p>
      </div>

      {/* Pitch container */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        <div
          ref={pitchRef}
          className={`relative rounded-lg overflow-hidden shadow-2xl border-4 border-[#C6FF00]/30`}
          style={{
            width: `${dims.width}px`,
            height: `${dims.height}px`,
            backgroundImage:
              pitchColor === "dark"
                ? "linear-gradient(to bottom, rgba(0,200,80,0.1) 0%, rgba(0,200,80,0.15) 50%, rgba(0,200,80,0.1) 100%), repeating-linear-gradient(90deg, transparent, transparent 19%, rgba(198,255,0,0.1) 19%, rgba(198,255,0,0.1) 20%)"
                : "linear-gradient(to bottom, rgba(0,200,80,0.2) 0%, rgba(0,200,80,0.25) 50%, rgba(0,200,80,0.2) 100%)",
            backgroundColor: pitchColor === "dark" ? "rgba(20, 30, 50, 0.8)" : "rgba(100, 200, 80, 0.3)",
          }}
        >
          {/* Horizontal midline */}
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-[#C6FF00] opacity-20" style={{ transform: "translateY(-50%)" }} />

          {/* Center circle outline */}
          <div
            className="absolute left-1/2 top-1/2 border-2 border-[#C6FF00] opacity-20 rounded-full"
            style={{
              width: `${dims.width * 0.3}px`,
              height: `${dims.width * 0.3}px`,
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Center spot */}
          <div
            className="absolute left-1/2 top-1/2 w-1 h-1 bg-[#C6FF00] rounded-full opacity-30"
            style={{
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Zone labels */}
          {showZoneLabels && (
            <>
              <div className="absolute left-2 top-2 text-xs font-bold text-[#C6FF00] opacity-40">DEF</div>
              <div className="absolute left-2 top-1/2 text-xs font-bold text-[#C6FF00] opacity-40" style={{ transform: "translateY(-50%)" }}>
                MID
              </div>
              <div className="absolute left-2 bottom-2 text-xs font-bold text-[#C6FF00] opacity-40">FWD</div>
            </>
          )}

          {/* Goal areas (visual guides) */}
          <div className="absolute left-0 right-0 top-0 h-1/4 border-b border-[#C6FF00] opacity-10" />
          <div className="absolute left-0 right-0 bottom-0 h-1/4 border-t border-[#C6FF00] opacity-10" />

          {/* Players on pitch */}
          <AnimatePresence>
            {teamPlayers.map((position) => (
              <DraggablePlayerToken
                key={`player-${position.playerId}`}
                position={position}
                playerData={position.playerData || { id: position.playerId, username: "Player" }}
                isDragging={draggedPlayer === position.playerId}
                onRemove={onPlayerRemove}
                pitchWidth={dims.width}
                pitchHeight={dims.height}
              />
            ))}
          </AnimatePresence>

          {/* Drag overlay */}
          <DragOverlay>{null}</DragOverlay>
        </div>
      </DndContext>

      {/* Player count indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-center text-sm text-gray-400"
      >
        {teamPlayers.length === maxPlayers ? (
          <span className="text-[#C6FF00] font-bold">✓ Team complete!</span>
        ) : (
          <span>{maxPlayers - teamPlayers.length} players remaining</span>
        )}
      </motion.div>
    </div>
  );
}
