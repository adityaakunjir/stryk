"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronUp, Crown, Grip, Loader2, Save, Shield, Sparkles, Users } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragMoveEvent,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

// --- Types ---
interface Player {
  id: string; // user.id
  participantId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  overall: number;
  position: string | null;
  playStyle: string | null;
  team: string | null; // "Team A", "Team B", or null
  x?: number; // Backend provided X
  y?: number; // Backend provided Y
}

interface PlayerState {
  id: string;
  x: number | null; // null if on bench
  y: number | null; // null if on bench
  team: "A" | "B" | null;
  customLabel: string;
}

interface InlineTeamBuilderProps {
  participants: any[];
  onSaveTeams: (positions: any[]) => Promise<void>;
  isHost: boolean;
  currentUserId: string | null;
  onJoinTeam: (team: "Team A" | "Team B" | null) => Promise<void>;
  onUpdatePosition?: (x: number | null, y: number | null, team: "Team A" | "Team B" | null) => Promise<void>;
  onUpdateTeamNames?: (teamAName?: string, teamBName?: string) => Promise<void>;
  teamAName?: string;
  teamBName?: string;
  matchFormat?: string;
  externalPositionUpdate?: { userId: string; x: number; y: number; team: string | null; ts: number } | null;
}

function TeamChip({ label, value, tone }: { label: string; value: number; tone: "lime" | "gold" }) {
  const active = tone === "lime";
  return (
    <div className="rounded-[1rem] border border-[#151515]/10 bg-[#151515] px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
      <div className={`text-[8px] font-black uppercase tracking-[0.2em] ${active ? "text-[#D4F829]" : "text-[#A28B52]"}`}>
        {label}
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-display text-[22px] font-black italic leading-none text-white">{value}</span>
        <span className={`size-2 rounded-full ${active ? "bg-[#D4F829] shadow-[0_0_10px_rgba(212,248,41,0.8)]" : "bg-[#A28B52]"}`} />
      </div>
    </div>
  );
}

// --- Helpers ---
const getAutoPosition = (x: number, y: number, team: "A" | "B" | null) => {
  const isTeamA = team === "A" || (!team && y <= 50);

  if (isTeamA) {
    // Team A (Home/White) plays upwards towards y=0 (Defends Bottom y=100)
    if (y >= 88) return "GK";
    
    // Defense (y between 68 and 87)
    if (y >= 68) {
      if (x <= 28) return "LB";
      if (x >= 72) return "RB";
      return "CB";
    }
    
    // Midfield (y between 45 and 67)
    if (y >= 45) {
      if (x <= 28) return "LMF";
      if (x >= 72) return "RMF";
      if (y >= 60) return "DMF";
      if (y >= 52) return "CMF";
      return "AMF";
    }
    
    // Attack (y < 45)
    if (x <= 28) return "LWF";
    if (x >= 72) return "RWF";
    if (y >= 25) return "SS";
    return "CF";
    
  } else {
    // Team B (Away/Black) plays downwards towards y=100 (Defends Top y=0)
    if (y <= 12) return "GK";
    
    // Defense (y between 13 and 32)
    if (y <= 32) {
      if (x <= 28) return "LB";
      if (x >= 72) return "RB";
      return "CB";
    }
    
    // Midfield (y between 33 and 55)
    if (y <= 55) {
      if (x <= 28) return "LMF";
      if (x >= 72) return "RMF";
      if (y <= 40) return "DMF";
      if (y <= 48) return "CMF";
      return "AMF";
    }
    
    // Attack (y > 55)
    if (x <= 28) return "LWF";
    if (x >= 72) return "RWF";
    if (y <= 75) return "SS";
    return "CF";
  }
};

const getOvrColor = (ovr: number) => {
  if (ovr >= 80) return "from-[#1F7A38] to-[#4ADE80]";
  if (ovr >= 70) return "from-[#2B8A3E] to-[#9BE15D]";
  if (ovr >= 60) return "from-[#A28B52] to-[#D8B64C]";
  return "from-[#8B3A16] to-[#F97316]";
};

// --- Draggable Token Component ---
function DraggablePlayerToken({ 
  player, 
  state, 
  isDraggable, 
  onLabelClick,
  isLargeSquad = false
}: { 
  player: Player; 
  state: PlayerState; 
  isDraggable: boolean;
  onLabelClick: (player: Player) => void;
  isLargeSquad?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    data: { player, state },
    disabled: !isDraggable,
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 50 : 10,
    ...(state.x !== null && state.y !== null ? {
      position: 'absolute',
      left: `${state.x}%`,
      top: `${state.y}%`,
      transform: transform ? CSS.Translate.toString(transform) : 'translate(-50%, -50%)',
    } : {
      position: 'relative',
      transform: transform ? CSS.Translate.toString(transform) : undefined,
    })
  };

  const label = state.customLabel || player.position || "POS";

  const isOnPitch = state.x !== null;

  if (!isOnPitch) {
    const compactWrapperClass = isLargeSquad ? "w-[44px] md:w-[48px]" : "w-[50px] md:w-[54px]";
    const compactAvatarClass = isLargeSquad ? "h-[32px] w-[32px] md:h-[36px] md:w-[36px]" : "h-[38px] w-[38px] md:h-[42px] md:w-[42px]";
    const compactNameClass = isLargeSquad ? "text-[6px] md:text-[7px] max-w-[40px] md:max-w-[46px]" : "text-[7px] md:text-[8px] max-w-[48px] md:max-w-[54px]";
    const compactBadgeClass = isLargeSquad ? "h-[14px] w-[14px] md:h-[16px] md:w-[16px] text-[6px] md:text-[7px]" : "h-[16px] w-[16px] md:h-[18px] md:w-[18px] text-[7px] md:text-[8px]";

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`relative flex flex-col items-center justify-center shrink-0 group touch-none transition-transform ${compactWrapperClass} ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'}`}
      >
        <div className={`relative mx-auto overflow-hidden rounded-full border-[2px] border-white/10 bg-[#05070B] shadow-[0_4px_10px_rgba(0,0,0,0.5)] group-hover:border-[#D4F829]/50 transition-colors pointer-events-none ${compactAvatarClass}`}>
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover rounded-full pointer-events-none" sizes="44px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/50">
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className={`absolute right-0 top-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2A2A2A] to-black font-black text-white shadow-md border border-white/20 group-hover:border-[#D4F829]/50 transition-colors ${compactBadgeClass} ${getOvrColor(player.overall)}`}>
          {player.overall}
        </div>
        <div
          className="relative mt-1.5 flex flex-col items-center pointer-events-auto cursor-pointer px-1 w-full"
          onPointerDown={(e) => {
            e.stopPropagation();
            onLabelClick(player);
          }}
        >
          <span className={`truncate text-center font-bold tracking-wide text-white/70 group-hover:text-white transition-colors drop-shadow-sm ${compactNameClass}`}>
            {player.username}
          </span>
        </div>
      </div>
    );
  }

  const wrapperClass = isLargeSquad ? "w-[44px] md:w-[48px] h-[64px] md:h-[70px]" : "w-[50px] md:w-[56px] h-[72px] md:h-[80px]";
  const avatarClass = isLargeSquad ? "h-[20px] w-[20px] md:h-[24px] md:w-[24px]" : "h-[24px] w-[24px] md:h-[28px] md:w-[28px]";
  const nameClass = isLargeSquad ? "text-[6px] md:text-[7px] max-w-[40px]" : "text-[8px] md:text-[9px] max-w-[48px]";
  
  const clipPathShape = "polygon(15% 0, 85% 0, 100% 15%, 100% 75%, 50% 100%, 0 75%, 0 15%)";

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        filter: "drop-shadow(0px 6px 10px rgba(0,0,0,0.4))"
      }}
      {...listeners}
      {...attributes}
      className={`relative flex flex-col items-center justify-start shrink-0 group touch-none transition-all ${wrapperClass} ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:-translate-y-1' : 'cursor-default'}`}
    >
      {/* Outer Border Layer */}
      <div 
        className={`absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity ${
          state.team === "A" ? "bg-gradient-to-br from-[#F8FAFC] via-[#CBD5E1] to-[#E2E8F0]" 
                             : "bg-gradient-to-br from-[#EAF7AF] via-[#A28B52] to-[#D4F829]"
        }`}
        style={{ clipPath: clipPathShape }}
      />
      
      {/* Inner Background Layer */}
      <div 
        className={`absolute inset-[1.5px] ${
          state.team === "A" ? "bg-gradient-to-b from-[#FFFFFF] to-[#F1F5F9]" 
                             : "bg-gradient-to-b from-[#1C201A] to-[#0A0D0A]"
        }`}
        style={{ clipPath: clipPathShape }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full h-full pt-1.5 md:pt-2">
        {/* Top Left Stats */}
        <div className="absolute top-1 md:top-1.5 left-1 md:left-1.5 flex flex-col items-center justify-center">
           <span className={`font-black text-[11px] md:text-[13px] leading-none drop-shadow-md tracking-tighter ${state.team === "A" ? "text-slate-800" : "text-white"}`}>
              {player.overall}
           </span>
           <span className={`font-black uppercase text-[6px] md:text-[7px] leading-none mt-[1px] ${state.x !== null ? "block" : "hidden"} ${state.team === "A" ? "text-slate-500" : "text-[#D4F829]"}`}>
              {label}
           </span>
        </div>
        
        {/* Avatar */}
        <div className={`relative ml-auto mr-1 md:mr-1.5 mt-1 md:mt-1.5 overflow-hidden rounded-full border shadow-sm pointer-events-none ${avatarClass} ${state.team === "A" ? "border-slate-300 bg-white" : "border-[#D4F829]/40 bg-[#05070B]"}`}>
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover rounded-full pointer-events-none" sizes="44px" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center text-sm font-bold ${state.team === "A" ? "text-slate-400" : "text-white/50"}`}>
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={`absolute inset-x-0 bottom-0 h-1/2 ${state.team === "A" ? "bg-gradient-to-t from-slate-200/80 to-transparent" : "bg-gradient-to-t from-black/80 to-transparent"}`} />
        </div>
        
        {/* Separator */}
        <div className={`w-[70%] h-[1px] mt-1.5 md:mt-2 ${state.team === "A" ? "bg-gradient-to-r from-transparent via-slate-300 to-transparent" : "bg-gradient-to-r from-transparent via-[#D4F829]/50 to-transparent"}`} />
        
        {/* Name */}
        <div
          className="relative mt-1 flex flex-col items-center pointer-events-auto cursor-pointer px-1 w-full"
          onPointerDown={(e) => {
            e.stopPropagation();
            onLabelClick(player);
          }}
        >
          <span className={`truncate text-center font-black tracking-tight transition-colors drop-shadow-md ${nameClass} ${state.team === "A" ? "text-slate-700 group-hover:text-slate-900" : "text-white/90 group-hover:text-white"}`}>
            {player.username}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Drag Overlay Component ---
function TokenOverlay({ player, state, draggedPos, isLargeSquad = false }: { player: Player; state: PlayerState; draggedPos?: {x: number, y: number} | null; isLargeSquad?: boolean; }) {
  const newTeam = state.team || (draggedPos ? (draggedPos.y <= 50 ? "A" : "B") : "B");
  const label = draggedPos 
    ? getAutoPosition(draggedPos.x, draggedPos.y, newTeam) 
    : (state.customLabel || player.position || "POS");

  const wrapperClass = isLargeSquad ? "w-[44px] md:w-[48px] h-[64px] md:h-[70px]" : "w-[50px] md:w-[56px] h-[72px] md:h-[80px]";
  const avatarClass = isLargeSquad ? "h-[20px] w-[20px] md:h-[24px] md:w-[24px]" : "h-[24px] w-[24px] md:h-[28px] md:w-[28px]";
  const nameClass = isLargeSquad ? "text-[6px] md:text-[7px] max-w-[40px]" : "text-[8px] md:text-[9px] max-w-[48px]";
  
  const clipPathShape = "polygon(15% 0, 85% 0, 100% 15%, 100% 75%, 50% 100%, 0 75%, 0 15%)";

  return (
    <div
      style={{ filter: "drop-shadow(0px 12px 24px rgba(212,248,41,0.25)) drop-shadow(0px 8px 12px rgba(0,0,0,0.6))" }}
      className={`relative flex flex-col items-center justify-start shrink-0 scale-110 z-[100] opacity-95 ${wrapperClass}`}
    >
      <div 
        className={`absolute inset-0 opacity-90 transition-opacity ${
          state.team === "A" ? "bg-gradient-to-br from-[#F8FAFC] via-[#CBD5E1] to-[#E2E8F0]" 
                             : "bg-gradient-to-br from-[#EAF7AF] via-[#A28B52] to-[#D4F829]"
        }`}
        style={{ clipPath: clipPathShape }}
      />
      <div 
        className={`absolute inset-[1.5px] ${
          state.team === "A" ? "bg-gradient-to-b from-[#FFFFFF] to-[#F1F5F9]" 
                             : "bg-gradient-to-b from-[#1C201A] to-[#0A0D0A]"
        }`}
        style={{ clipPath: clipPathShape }}
      />

      <div className="relative z-10 flex flex-col items-center w-full h-full pt-1.5 md:pt-2">
        <div className="absolute top-1 md:top-1.5 left-1 md:left-1.5 flex flex-col items-center justify-center">
           <span className="font-black text-[11px] md:text-[13px] leading-none text-white drop-shadow-md tracking-tighter">
              {player.overall}
           </span>
           <span className={`font-black uppercase text-[6px] md:text-[7px] text-[#D4F829] leading-none mt-[1px] ${state.x !== null ? "block" : "hidden"}`}>
              {label}
           </span>
        </div>
        
        <div className={`relative ml-auto mr-1 md:mr-1.5 mt-1 md:mt-1.5 overflow-hidden rounded-full border border-[#D4F829]/60 bg-[#05070B] shadow-sm ${avatarClass}`}>
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover rounded-full" sizes="44px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/50">
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        
        <div className="w-[70%] h-[1px] bg-gradient-to-r from-transparent via-[#D4F829]/80 to-transparent mt-1.5 md:mt-2" />
        
        <div className="relative mt-1 flex flex-col items-center px-0.5 w-full">
          <span className={`truncate text-center font-black tracking-tight text-white drop-shadow-md ${nameClass}`}>
            {player.username}
          </span>
        </div>
      </div>
    </div>
  );
}


// --- Main Component ---
export function InlineTeamBuilder({ 
  participants, 
  onSaveTeams, 
  isHost, 
  currentUserId, 
  onJoinTeam, 
  onUpdatePosition,
  onUpdateTeamNames, 
  teamAName = "Team A", 
  teamBName = "Team B", 
  matchFormat = "11v11",
  externalPositionUpdate
}: InlineTeamBuilderProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStates, setPlayerStates] = useState<Record<string, PlayerState>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [benchOpen, setBenchOpen] = useState(true);
  
  // Editable Names State
  const [localTeamAName, setLocalTeamAName] = useState(teamAName);
  const [localTeamBName, setLocalTeamBName] = useState(teamBName);
  const [isEditingA, setIsEditingA] = useState(false);
  const [isEditingB, setIsEditingB] = useState(false);
  const [draggedPos, setDraggedPos] = useState<{x: number, y: number} | null>(null);

  const pitchRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Label Edit State
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState("");

  const matchId = participants.length > 0 ? participants[0].matchId : null;

  useEffect(() => {
    if (!participants) return;
    
    const mappedPlayers: Player[] = participants.map((p) => ({
      id: p.user.id,
      participantId: p.id,
      username: p.user.username,
      fullName: p.user.fullName,
      avatarUrl: p.user.avatarUrl,
      overall: p.user.overall || 60,
      position: p.user.position,
      playStyle: p.user.playStyle,
      team: p.team,
      x: p.x ?? undefined,
      y: p.y ?? undefined,
    }));
    
    setPlayers(mappedPlayers);

    // Merge with existing states — don't overwrite positions that
    // the user has just dragged (which are already correct locally).
    setPlayerStates(prev => {
      const newStates: Record<string, PlayerState> = {};
      
      mappedPlayers.forEach((p) => {
        // If we are the host, our local state is the absolute source of truth 
        // after dragging, so we keep it if we already have coordinates.
        // For non-hosts, the API's coordinates are the source of truth for 
        // everyone else's cards (especially when the host moves them).
        const existing = prev[p.id];
        if (isHost && existing && existing.x !== null && existing.y !== null) {
          newStates[p.id] = existing;
          return;
        }

        // Otherwise, initialize from API data
        const team: "A" | "B" | null = 
          (p.team === "Team A" || p.team === "A") ? "A" :
          (p.team === "Team B" || p.team === "B") ? "B" : null;

        if (team && p.x != null && p.y != null) {
          // API provided coordinates — use them and compute correct label
          const label = getAutoPosition(p.x, p.y, team);
          newStates[p.id] = {
            id: p.id,
            x: p.x,
            y: p.y,
            team,
            customLabel: label,
          };
        } else if (team) {
          // Has team but no coordinates — place in default position
          const defaultX = 20 + Math.random() * 60;
          const defaultY = team === "A" ? (15 + Math.random() * 30) : (65 + Math.random() * 30);
          const label = getAutoPosition(defaultX, defaultY, team);
          newStates[p.id] = {
            id: p.id,
            x: defaultX,
            y: defaultY,
            team,
            customLabel: label,
          };
        } else {
          // No team — on the bench
          newStates[p.id] = {
            id: p.id,
            x: null,
            y: null,
            team: null,
            customLabel: p.position || "CMF",
          };
        }
      });

      return newStates;
    });
  }, [participants, matchId]);

  useEffect(() => {
    if (matchId && Object.keys(playerStates).length > 0) {
      localStorage.setItem(`match_${matchId}_squad_state`, JSON.stringify(playerStates));
    }
  }, [playerStates, matchId]);

  // Listen for real-time external updates from other users
  useEffect(() => {
    if (externalPositionUpdate) {
      setPlayerStates(prev => {
        // Do not overwrite if we are not the host and this is our own update (we already have local state)
        if (!isHost && externalPositionUpdate.userId === currentUserId) return prev;
        
        const existing = prev[externalPositionUpdate.userId];
        if (!existing) return prev;

        // If they were benched, coordinates are null
        if (externalPositionUpdate.x === null || externalPositionUpdate.y === null) {
          return {
            ...prev,
            [externalPositionUpdate.userId]: {
              ...existing,
              x: null,
              y: null,
              team: null,
              customLabel: existing.customLabel || "BENCH"
            }
          };
        }

        const autoPos = getAutoPosition(externalPositionUpdate.x, externalPositionUpdate.y, externalPositionUpdate.team as "A" | "B" | null);
        return {
          ...prev,
          [externalPositionUpdate.userId]: {
            ...existing,
            x: externalPositionUpdate.x,
            y: externalPositionUpdate.y,
            team: externalPositionUpdate.team as "A" | "B" | null,
            customLabel: autoPos
          }
        };
      });
    }
  }, [externalPositionUpdate, currentUserId, isHost]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const pId = event.active.id as string;
    if (!isHost && pId !== currentUserId) return;
    setActiveId(pId);
    setDraggedPos(null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active } = event;
    if (!active.rect.current.translated) return;

    const dropCenterX = active.rect.current.translated.left + active.rect.current.translated.width / 2;
    const dropCenterY = active.rect.current.translated.top + active.rect.current.translated.height / 2;
    const pitchRect = pitchRef.current?.getBoundingClientRect();

    if (pitchRect && 
        dropCenterX >= pitchRect.left && dropCenterX <= pitchRect.right &&
        dropCenterY >= pitchRect.top && dropCenterY <= pitchRect.bottom) {
      let percentX = ((dropCenterX - pitchRect.left) / pitchRect.width) * 100;
      let percentY = ((dropCenterY - pitchRect.top) / pitchRect.height) * 100;
      percentX = Math.max(5, Math.min(95, percentX));
      percentY = Math.max(5, Math.min(95, percentY));
      setDraggedPos({ x: percentX, y: percentY });
    } else {
      setDraggedPos(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setDraggedPos(null);
    const { active } = event;
    const pId = active.id as string;
    
    if (!isHost && pId !== currentUserId) return;
    
    if (!active.rect.current.translated) return;

    const dropCenterX = active.rect.current.translated.left + active.rect.current.translated.width / 2;
    const dropCenterY = active.rect.current.translated.top + active.rect.current.translated.height / 2;

    const pitchRect = pitchRef.current?.getBoundingClientRect();

    let droppedOnPitch = false;
    let percentX = 0;
    let percentY = 0;

    if (pitchRect && 
        dropCenterX >= pitchRect.left && dropCenterX <= pitchRect.right &&
        dropCenterY >= pitchRect.top && dropCenterY <= pitchRect.bottom) {
      droppedOnPitch = true;
      percentX = ((dropCenterX - pitchRect.left) / pitchRect.width) * 100;
      percentY = ((dropCenterY - pitchRect.top) / pitchRect.height) * 100;
      percentX = Math.max(5, Math.min(95, percentX));
      percentY = Math.max(5, Math.min(95, percentY));
    }

    const currentTeam = playerStates[pId]?.team;
    let nextState = { ...playerStates };

    if (droppedOnPitch) {
      // Determine team: keep current team if already assigned, otherwise assign based on Y
      const newTeam = currentTeam || (percentY <= 50 ? "A" : "B");
      const autoPos = getAutoPosition(percentX, percentY, newTeam);
      
      nextState = {
        ...nextState,
        [pId]: { 
          ...nextState[pId], 
          x: percentX, 
          y: percentY, 
          team: newTeam,
          customLabel: autoPos
        }
      };

      setPlayerStates(nextState);

      if (currentTeam !== newTeam) {
        handleJoinAction(newTeam === "A" ? "Team A" : "Team B", pId);
      }
      if (!isHost && pId === currentUserId && onUpdatePosition) {
        onUpdatePosition(percentX, percentY, newTeam === "A" ? "Team A" : "Team B");
      }
    } else {
      nextState = {
        ...nextState,
        [pId]: { ...nextState[pId], x: null, y: null, team: null }
      };
      setPlayerStates(nextState);
      if (currentTeam !== null) {
         handleJoinAction(null, pId);
      }
      if (!isHost && pId === currentUserId && onUpdatePosition) {
        onUpdatePosition(null, null, null);
      }
    }

    if (isHost) {
      const positionsPayload = Object.values(nextState).map(s => ({
        id: s.id,
        team: s.team === "A" ? "Team A" : s.team === "B" ? "Team B" : null,
        x: s.x,
        y: s.y
      }));
      setIsSaving(true);
      onSaveTeams(positionsPayload).catch(console.error).finally(() => setIsSaving(false));
    }
  };

  const handleJoinAction = async (team: "Team A" | "Team B" | null, pId: string) => {
    if (!isHost && pId === currentUserId) {
      try {
        await onJoinTeam(team);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLabelEdit = (player: Player) => {
    const currentState = playerStates[player.id];
    setEditLabelValue(currentState?.customLabel || player.position || "");
    setEditingLabelId(player.id);
  };

  const saveLabelEdit = () => {
    if (!editingLabelId) return;
    setPlayerStates(prev => ({
      ...prev,
      [editingLabelId]: { 
        ...prev[editingLabelId], 
        customLabel: editLabelValue.substring(0, 5).toUpperCase()
      }
    }));
    setEditingLabelId(null);
  };

  const toggleTeam = () => {
    if (!editingLabelId) return;
    setPlayerStates(prev => {
      const currentState = prev[editingLabelId];
      if (!currentState) return prev;
      
      const newTeam: "A" | "B" = currentState.team === "A" ? "B" : "A";
      const nextState = {
        ...prev,
        [editingLabelId]: {
          ...currentState,
          team: newTeam,
          customLabel: currentState.x !== null && currentState.y !== null 
            ? getAutoPosition(currentState.x, currentState.y, newTeam)
            : currentState.customLabel
        }
      };
      
      if (isHost) {
        const positionsPayload = Object.values(nextState).map(s => ({
          id: s.id,
          team: s.team === "A" ? "Team A" : s.team === "B" ? "Team B" : null,
          x: s.x,
          y: s.y
        }));
        onSaveTeams(positionsPayload).catch(console.error);
      }
      return nextState;
    });
    setEditingLabelId(null);
  };

  const getTeamStats = (team: "A" | "B") => {
    const teamPlayerIds = Object.values(playerStates).filter(s => s.team === team).map(s => s.id);
    const teamPlayers = players.filter(p => teamPlayerIds.includes(p.id));
    const avgOvr = teamPlayers.length > 0 
      ? Math.round(teamPlayers.reduce((s, p) => s + p.overall, 0) / teamPlayers.length) 
      : 0;
    return { count: teamPlayers.length, avgOvr };
  };

  const statsA = getTeamStats("A");
  const statsB = getTeamStats("B");
  const activePlayer = activeId ? players.find(p => p.id === activeId) : null;
  const activePlayerState = activeId ? playerStates[activeId] : null;
  const benchPlayers = players.filter(p => !playerStates[p.id]?.x);
  
  let pitchHeightClass = "h-[680px] md:h-[760px]";
  if (matchFormat === "3v3") pitchHeightClass = "h-[450px] md:h-[500px]";
  else if (matchFormat === "5v5") pitchHeightClass = "h-[550px] md:h-[600px]";
  else if (matchFormat === "7v7") pitchHeightClass = "h-[700px] md:h-[750px]";
  else if (matchFormat === "11v11") pitchHeightClass = "h-[900px] md:h-[950px]";

  const isLargeSquad = matchFormat === "7v7" || matchFormat === "11v11";

  const handleSaveTeamName = async (team: "A" | "B") => {
    if (team === "A") {
      setIsEditingA(false);
      if (onUpdateTeamNames && localTeamAName !== teamAName) await onUpdateTeamNames(localTeamAName, undefined);
    } else {
      setIsEditingB(false);
      if (onUpdateTeamNames && localTeamBName !== teamBName) await onUpdateTeamNames(undefined, localTeamBName);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Real-time Counters */}
      <div className="grid grid-cols-3 gap-2">
        <TeamChip label={localTeamAName} value={statsA.count} tone="lime" />
        <TeamChip label="Free Pool" value={benchPlayers.length} tone="gold" />
        <TeamChip label={localTeamBName} value={statsB.count} tone="lime" />
      </div>

      <div className={`w-full flex flex-col relative bg-[#080a08] rounded-[1.75rem] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.48)] select-none ${pitchHeightClass} border border-[#D4F829]/15`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_0%,rgba(212,248,41,0.13),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_30%)]" />
      
      {/* Top Header */}
      {isHost && (
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-transparent shrink-0 z-20">
          <div className="min-w-0">
            <div className="font-display text-[20px] italic uppercase leading-none tracking-wide text-white flex items-center gap-2">
              Squad Tactics
              {isSaving && <Loader2 className="animate-spin text-[#D4F829]" size={14} />}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.22em] text-[#A28B52]">
              <Grip size={11} />
              Drag players into shape (Auto-saves)
            </div>
          </div>
        </div>
      )}
      {!isHost && (
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-transparent shrink-0 z-20">
          <div>
            <div className="font-display text-[20px] italic uppercase leading-none tracking-wide text-white">Squad Tactics</div>
            <div className="mt-1 text-[8px] font-black uppercase tracking-[0.22em] text-[#A28B52]">Move your card to join a side</div>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
        <div className="flex flex-col flex-1 overflow-hidden relative bg-transparent">
          {/* The Pitch (Main Content) */}
          <div ref={pitchRef} className="flex-1 relative overflow-hidden" 
               style={{ background: 'radial-gradient(circle at 50% 50%, rgba(212,248,41,0.12), transparent 25%), repeating-linear-gradient(0deg, #31583b, #31583b 52px, #2b5035 52px, #2b5035 104px)' }}>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.12)_58%,rgba(0,0,0,0.32)_100%)]" />
            
            {/* Pitch Lines Wrapper */}
            <div className="absolute inset-4 border-[1.5px] border-white/35 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.18)]" />
            
            {/* Center Line */}
            <div className="absolute top-1/2 left-4 right-4 h-[1.5px] bg-white/40 -translate-y-1/2 pointer-events-none" />
            
            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 w-20 h-20 rounded-full border-[1.5px] border-white/40 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-white/60 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            {/* Top Penalty Box */}
            <div className="absolute top-4 left-1/2 w-40 h-20 border-[1.5px] border-t-0 border-white/40 -translate-x-1/2 pointer-events-none" />
            {/* Top 6-yard Box */}
            <div className="absolute top-4 left-1/2 w-20 h-8 border-[1.5px] border-t-0 border-white/40 -translate-x-1/2 pointer-events-none" />
            {/* Top Penalty Arc */}
            <div className="absolute top-[calc(1rem+20px)] left-1/2 w-16 h-8 border-[1.5px] border-b-0 border-white/40 rounded-t-full -translate-x-1/2 pointer-events-none origin-bottom rotate-180" />

            {/* Bottom Penalty Box */}
            <div className="absolute bottom-4 left-1/2 w-40 h-20 border-[1.5px] border-b-0 border-white/40 -translate-x-1/2 pointer-events-none" />
            {/* Bottom 6-yard Box */}
            <div className="absolute bottom-4 left-1/2 w-20 h-8 border-[1.5px] border-b-0 border-white/40 -translate-x-1/2 pointer-events-none" />
            {/* Bottom Penalty Arc */}
            <div className="absolute bottom-[calc(1rem+20px)] left-1/2 w-16 h-8 border-[1.5px] border-b-0 border-white/40 rounded-t-full -translate-x-1/2 pointer-events-none" />


            {/* Pitch Top Header (Team B) */}
            <div className="absolute top-0 inset-x-0 h-10 flex items-center justify-between px-4 bg-gradient-to-b from-[#080a08]/80 to-transparent z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 text-[#E5DCC5] pointer-events-auto">
                <Shield size={10} className="opacity-70" />
                {isEditingB ? (
                  <input
                    type="text"
                    autoFocus
                    maxLength={15}
                    value={localTeamBName}
                    onChange={(e) => setLocalTeamBName(e.target.value)}
                    onBlur={() => handleSaveTeamName("B")}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTeamName("B")}
                    className="bg-black/50 border border-[#D4F829]/50 text-[9px] font-black uppercase tracking-widest text-[#E5DCC5] rounded px-1 w-24 outline-none"
                  />
                ) : (
                  <span 
                    className="text-[9px] font-black uppercase tracking-widest text-[#E5DCC5] cursor-pointer hover:text-[#D4F829] transition"
                    onClick={() => setIsEditingB(true)}
                    title="Click to edit team name"
                  >
                    {localTeamBName}
                  </span>
                )}
                <span className="ml-1 text-[9px] font-bold text-[#A28B52]">{statsB.count}</span>
              </div>
              <div className="flex items-center gap-2 pointer-events-none">
                <div className="h-4 px-2 rounded-full bg-[#A28B52]/20 border border-[#A28B52]/50 flex items-center justify-center">
                  <span className="text-[9px] font-black text-[#A28B52]">{statsB.avgOvr}</span>
                </div>
              </div>
            </div>

            {/* Pitch Bottom Header (Team A) */}
            <div className="absolute bottom-0 inset-x-0 h-10 flex items-center justify-between px-4 bg-gradient-to-t from-[#080a08]/80 to-transparent z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 text-[#E5DCC5] pointer-events-auto">
                <Shield size={10} className="opacity-70" />
                {isEditingA ? (
                  <input
                    type="text"
                    autoFocus
                    maxLength={15}
                    value={localTeamAName}
                    onChange={(e) => setLocalTeamAName(e.target.value)}
                    onBlur={() => handleSaveTeamName("A")}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTeamName("A")}
                    className="bg-black/50 border border-[#D4F829]/50 text-[9px] font-black uppercase tracking-widest text-[#E5DCC5] rounded px-1 w-24 outline-none"
                  />
                ) : (
                  <span 
                    className="text-[9px] font-black uppercase tracking-widest text-[#E5DCC5] cursor-pointer hover:text-[#D4F829] transition"
                    onClick={() => setIsEditingA(true)}
                    title="Click to edit team name"
                  >
                    {localTeamAName}
                  </span>
                )}
                <span className="ml-1 text-[9px] font-bold text-[#4ADE80]">{statsA.count}</span>
              </div>
              <div className="flex items-center gap-2 pointer-events-none">
                <div className="h-4 px-2 rounded-full bg-[#1F7A38]/20 border border-[#4ADE80]/30 flex items-center justify-center">
                  <span className="text-[9px] font-black text-[#4ADE80]">{statsA.avgOvr}</span>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/14 px-3 py-1 text-[8px] font-black uppercase tracking-[0.24em] text-white/45 backdrop-blur-[2px]">
              <Sparkles size={10} className="text-[#D4F829]/60" />
              tactical view
            </div>

            {/* Players on Pitch */}
            {players.map(p => {
              const state = playerStates[p.id];
              // Render players who have x,y coords
              if (!state || state.x === null || state.y === null) return null;
              
              const isDraggable = isHost || p.id === currentUserId;
              
              return (
                <DraggablePlayerToken 
                  key={p.id} 
                  player={p} 
                  state={state} 
                  isDraggable={isDraggable} 
                  onLabelClick={handleLabelEdit}
                  isLargeSquad={isLargeSquad}
                />
              );
            })}
          </div>

          <div ref={sidebarRef} className={`relative z-20 shrink-0 border-t border-[#D4F829]/15 bg-[#0d0f0d]/98 transition-[height] duration-300 ${benchOpen ? "h-[132px]" : "h-[46px]"}`}>
            <button
              type="button"
              onClick={() => setBenchOpen((open) => !open)}
              className="flex h-[46px] w-full items-center justify-between px-4 text-left"
            >
              <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-white">
                <Users size={13} className="text-[#D4F829]" />
                Free Pool
                <span className="rounded-full bg-[#D4F829] px-2 py-0.5 text-[8px] text-black">{benchPlayers.length}</span>
              </span>
              <span className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/35">
                Drag onto pitch
                <ChevronUp size={14} className={`transition-transform ${benchOpen ? "" : "rotate-180"}`} />
              </span>
            </button>
            {benchOpen && (
              <div className="flex h-[86px] items-start gap-3 overflow-x-auto overflow-y-hidden px-4 pb-3 custom-scrollbar">
                {benchPlayers.map((p) => {
                  const state = playerStates[p.id];
                  if (!state) return null;
                  return (
                    <DraggablePlayerToken
                      key={p.id}
                      player={p}
                      state={state}
                      isDraggable={isHost || p.id === currentUserId}
                      onLabelClick={handleLabelEdit}
                      isLargeSquad={isLargeSquad}
                    />
                  );
                })}
                {benchPlayers.length === 0 && (
                  <div className="flex h-14 w-full items-center justify-center text-[9px] font-black uppercase tracking-widest text-white/25">
                    Everyone is on the pitch
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activePlayer && activePlayerState ? (
            <TokenOverlay player={activePlayer} state={activePlayerState} draggedPos={draggedPos} isLargeSquad={isLargeSquad} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Label Edit Modal */}
      {editingLabelId && (
        <div className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-white/10 rounded-2xl p-5 w-full max-w-[250px] shadow-2xl flex flex-col items-center">
            <Crown size={18} className="mb-2 text-[#A28B52]" />
            <h3 className="text-white text-[10px] font-bold uppercase tracking-widest mb-3">Edit Position Label</h3>
            <input 
              type="text" 
              value={editLabelValue}
              onChange={e => setEditLabelValue(e.target.value)}
              maxLength={3}
              placeholder="e.g. CMF"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveLabelEdit()}
              className="w-full bg-[#111] border border-white/20 rounded-lg px-3 py-2 text-center font-bold text-white uppercase tracking-wider outline-none focus:border-[#D4F829] transition"
            />
            <div className="flex gap-2 w-full mt-4">
              <button 
                onClick={toggleTeam}
                className="flex-1 py-2 bg-[#222] hover:bg-[#333] border border-white/20 rounded-xl text-white text-[9px] font-bold uppercase tracking-widest transition"
              >
                Switch Team
              </button>
            </div>
            <div className="flex gap-2 w-full mt-2">
              <button 
                onClick={() => setEditingLabelId(null)}
                className="flex-1 py-2 bg-[#111] hover:bg-[#222] border border-white/10 rounded-xl text-white/70 text-[10px] font-bold uppercase tracking-widest transition"
              >
                Cancel
              </button>
              <button 
                onClick={saveLabelEdit}
                className="flex-1 py-2 bg-[#D4F829] hover:bg-[#c3e626] text-[#151515] rounded-xl text-[10px] font-bold uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-1"
              >
                <Check size={12} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
