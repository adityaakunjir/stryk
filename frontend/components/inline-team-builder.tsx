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
  onSaveTeams: (teamA: string[], teamB: string[]) => Promise<void>;
  isHost: boolean;
  currentUserId: string | null;
  onJoinTeam: (team: "Team A" | "Team B" | null) => Promise<void>;
  onUpdateTeamNames?: (teamAName?: string, teamBName?: string) => Promise<void>;
  teamAName?: string;
  teamBName?: string;
  matchFormat?: string;
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
const getAutoPosition = (x: number, y: number) => {
  if (y <= 50) {
    // Team A (playing down)
    if (y < 10) return "GK";
    if (y < 25) {
      if (x < 30) return "RB";
      if (x > 70) return "LB";
      return "CB";
    }
    if (y < 40) {
      if (x < 30) return "RMF";
      if (x > 70) return "LMF";
      if (y < 32) return "DMF";
      if (y > 36) return "AMF";
      return "CMF";
    }
    if (x < 30) return "RWF";
    if (x > 70) return "LWF";
    if (y < 45) return "SS";
    return "CF";
  } else {
    // Team B (playing up)
    if (y > 90) return "GK";
    if (y > 75) {
      if (x < 30) return "LB";
      if (x > 70) return "RB";
      return "CB";
    }
    if (y > 60) {
      if (x < 30) return "LMF";
      if (x > 70) return "RMF";
      if (y > 68) return "DMF";
      if (y < 64) return "AMF";
      return "CMF";
    }
    if (x < 30) return "LWF";
    if (x > 70) return "RWF";
    if (y > 55) return "SS";
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

  const wrapperClass = isLargeSquad ? "w-[48px] md:w-[54px]" : "w-[58px] md:w-[64px]";
  const innerClass = isLargeSquad ? "w-[44px] md:w-[50px]" : "w-[54px] md:w-[60px]";
  const avatarClass = isLargeSquad ? "h-[28px] w-[28px] md:h-[32px] md:w-[32px]" : "h-[34px] w-[34px] md:h-[40px] md:w-[40px]";
  const badgeClass = isLargeSquad ? "h-[15px] w-[15px] md:h-[17px] md:w-[17px] text-[6px] md:text-[7px]" : "h-[19px] w-[19px] md:h-[21px] md:w-[21px] text-[7px] md:text-[8px]";
  const nameClass = isLargeSquad ? "text-[6px] md:text-[7px] max-w-[40px] md:max-w-[46px]" : "text-[7px] md:text-[8px] max-w-[48px] md:max-w-[54px]";
  const labelClass = isLargeSquad ? "h-[12px] min-w-[26px] px-1 text-[6px]" : "h-[14px] min-w-[31px] px-1 text-[7px]";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex flex-col items-center justify-center shrink-0 group touch-none drop-shadow-xl transition-shadow ${wrapperClass} ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      <div className={`relative rounded-[0.55rem] border border-[#E5DCC5]/70 bg-[#101812]/90 p-[3px] shadow-[0_10px_22px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.12)] ${innerClass}`}>
        <div className="absolute inset-0 rounded-[0.55rem] bg-gradient-to-b from-[#D4F829]/12 via-transparent to-black/25 opacity-0 transition group-hover:opacity-100" />
        <div className={`relative mx-auto overflow-hidden rounded-full border border-[#A28B52]/70 bg-[#05070B] shadow-inner pointer-events-none ${avatarClass}`}>
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover rounded-full pointer-events-none" sizes="44px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/50">
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className={`absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-gradient-to-br font-black text-white shadow-[0_4px_10px_rgba(0,0,0,0.45)] ring-1 ring-[#E5DCC5]/60 ${badgeClass} ${getOvrColor(player.overall)}`}>
          {player.overall}
        </div>
        <div
          className="relative mt-1 flex flex-col items-center pointer-events-auto cursor-pointer"
          onPointerDown={(e) => {
            e.stopPropagation();
            onLabelClick(player);
          }}
        >
          <span className={`truncate text-center font-black lowercase leading-none tracking-tight text-white drop-shadow-md ${nameClass}`}>
            {player.username}
          </span>
          <div className={`mt-1 flex items-center justify-center rounded-[0.25rem] border border-[#D4F829]/25 bg-[#D4F829]/14 font-black uppercase tracking-wider text-[#EAF7AF] ${labelClass} ${state.x !== null ? "flex" : "hidden"}`}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Drag Overlay Component ---
function TokenOverlay({ player, state, isLargeSquad = false }: { player: Player; state: PlayerState; isLargeSquad?: boolean; }) {
  const label = state.customLabel || player.position || "POS";

  const wrapperClass = isLargeSquad ? "w-[48px] md:w-[54px]" : "w-[58px] md:w-[64px]";
  const innerClass = isLargeSquad ? "w-[44px] md:w-[50px]" : "w-[54px] md:w-[60px]";
  const avatarClass = isLargeSquad ? "h-[28px] w-[28px] md:h-[32px] md:w-[32px]" : "h-[34px] w-[34px] md:h-[40px] md:w-[40px]";
  const badgeClass = isLargeSquad ? "h-[15px] w-[15px] md:h-[17px] md:w-[17px] text-[6px] md:text-[7px]" : "h-[19px] w-[19px] md:h-[21px] md:w-[21px] text-[7px] md:text-[8px]";
  const nameClass = isLargeSquad ? "text-[6px] md:text-[7px] max-w-[40px] md:max-w-[46px]" : "text-[7px] md:text-[8px] max-w-[48px] md:max-w-[54px]";
  const labelClass = isLargeSquad ? "h-[12px] min-w-[26px] px-1 text-[6px]" : "h-[14px] min-w-[31px] px-1 text-[7px]";

  return (
    <div className={`relative flex flex-col items-center justify-center shrink-0 scale-110 drop-shadow-2xl z-[100] opacity-95 ${wrapperClass}`}>
      <div className={`relative rounded-[0.55rem] border border-[#D4F829] bg-[#101812]/95 p-[3px] shadow-2xl ${innerClass}`}>
        <div className={`relative mx-auto overflow-hidden rounded-full border border-[#A28B52] bg-[#05070B] ${avatarClass}`}>
        {player.avatarUrl ? (
          <Image src={player.avatarUrl} alt={player.username} fill className="object-cover rounded-full" sizes="44px" />
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center text-white/50 text-sm font-bold">
            {player.username.charAt(0).toUpperCase()}
          </div>
        )}
        </div>
        <div className={`absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-gradient-to-br font-black text-white ring-1 ring-[#E5DCC5]/60 ${badgeClass} ${getOvrColor(player.overall)}`}>
          {player.overall}
        </div>
        <span className={`mt-1 block truncate text-center font-black lowercase leading-none text-white ${nameClass}`}>
          {player.username}
        </span>
        <span className={`mx-auto mt-1 flex items-center justify-center rounded-[0.25rem] bg-[#D4F829] font-black uppercase tracking-wider text-[#151515] ${labelClass} ${state.x !== null ? "flex" : "hidden"}`}>
          {label}
        </span>
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
  onUpdateTeamNames, 
  teamAName = "Team A", 
  teamBName = "Team B", 
  matchFormat = "11v11" 
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
    }));
    
    setPlayers(mappedPlayers);

    // Load states from LocalStorage or initialize
    const savedStatesStr = matchId ? localStorage.getItem(`match_${matchId}_squad_state`) : null;
    const savedStates: Record<string, PlayerState> = savedStatesStr ? JSON.parse(savedStatesStr) : {};

    const newStates: Record<string, PlayerState> = {};
    
    mappedPlayers.forEach((p) => {
      if (savedStates[p.id]) {
        newStates[p.id] = {
          ...savedStates[p.id],
          team: p.team === "Team A" || p.team === "A" ? "A" : p.team === "Team B" || p.team === "B" ? "B" : null,
        };
      } else {
        if (p.team === "Team A" || p.team === "A") {
          newStates[p.id] = {
            id: p.id,
            x: 20 + Math.random() * 60,
            y: 15 + Math.random() * 30, // Top half
            team: "A",
            customLabel: p.position || "CMF",
          };
        } else if (p.team === "Team B" || p.team === "B") {
          newStates[p.id] = {
            id: p.id,
            x: 20 + Math.random() * 60,
            y: 65 + Math.random() * 30, // Bottom half
            team: "B",
            customLabel: p.position || "CMF",
          };
        } else {
          newStates[p.id] = {
            id: p.id,
            x: null,
            y: null,
            team: null,
            customLabel: p.position || "CMF",
          };
        }
      }
    });

    setPlayerStates(newStates);
  }, [participants, matchId]);

  useEffect(() => {
    if (matchId && Object.keys(playerStates).length > 0) {
      localStorage.setItem(`match_${matchId}_squad_state`, JSON.stringify(playerStates));
    }
  }, [playerStates, matchId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const pId = event.active.id as string;
    if (!isHost && pId !== currentUserId) return;
    setActiveId(pId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
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
      const autoPos = getAutoPosition(percentX, percentY);
      // Determine team based on Y
      const newTeam = percentY <= 50 ? "A" : "B";
      
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
    } else {
      nextState = {
        ...nextState,
        [pId]: { ...nextState[pId], x: null, y: null, team: null }
      };
      setPlayerStates(nextState);
      if (currentTeam !== null) {
         handleJoinAction(null, pId);
      }
    }

    if (isHost) {
      const teamAIds = Object.values(nextState).filter(s => s.team === "A").map(s => s.id);
      const teamBIds = Object.values(nextState).filter(s => s.team === "B").map(s => s.id);
      setIsSaving(true);
      onSaveTeams(teamAIds, teamBIds).catch(console.error).finally(() => setIsSaving(false));
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

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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


            {/* Pitch Top Header (Team A) */}
            <div className="absolute top-0 inset-x-0 h-10 flex items-center justify-between px-4 bg-gradient-to-b from-[#080a08]/80 to-transparent z-10 pointer-events-none">
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
                <span className="ml-1 text-[9px] font-bold text-[#A28B52]">{statsA.count}</span>
              </div>
              <div className="flex items-center gap-2 pointer-events-none">
                <div className="h-4 px-2 rounded-full bg-[#1F7A38]/20 border border-[#4ADE80]/30 flex items-center justify-center">
                  <span className="text-[9px] font-black text-[#4ADE80]">{statsA.avgOvr}</span>
                </div>
              </div>
            </div>

            {/* Pitch Bottom Header (Team B) */}
            <div className="absolute bottom-0 inset-x-0 h-10 flex items-center justify-between px-4 bg-gradient-to-t from-[#080a08]/80 to-transparent z-10 pointer-events-none">
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
                <div className="h-4 px-2 rounded-full bg-[#1F7A38]/20 border border-[#4ADE80]/30 flex items-center justify-center">
                  <span className="text-[9px] font-black text-[#4ADE80]">{statsB.avgOvr}</span>
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
        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
          {activePlayer && activePlayerState ? (
            <TokenOverlay player={activePlayer} state={activePlayerState} isLargeSquad={isLargeSquad} />
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
