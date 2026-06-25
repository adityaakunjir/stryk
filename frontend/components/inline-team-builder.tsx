"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, Crown, Grip, Loader2, Save, Shield, Sparkles } from "lucide-react";
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
}

// --- Helpers ---
const getAutoPosition = (x: number, y: number) => {
  if (y <= 50) {
    // Team A (playing down)
    if (y < 10) return "GK";
    if (y < 25) {
      if (x < 30) return "LB";
      if (x > 70) return "RB";
      return "CB";
    }
    if (y < 40) {
      if (x < 30) return "LMF";
      if (x > 70) return "RMF";
      if (y < 32) return "DMF";
      if (y > 36) return "AMF";
      return "CMF";
    }
    if (x < 30) return "LWF";
    if (x > 70) return "RWF";
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
  onLabelClick 
}: { 
  player: Player; 
  state: PlayerState; 
  isDraggable: boolean;
  onLabelClick: (player: Player) => void;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex flex-col items-center justify-center shrink-0 group touch-none drop-shadow-xl transition-shadow w-[58px] md:w-[64px] ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      <div className="relative w-[54px] rounded-[0.55rem] border border-[#E5DCC5]/70 bg-[#101812]/90 p-[3px] shadow-[0_10px_22px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.12)] md:w-[60px]">
        <div className="absolute inset-0 rounded-[0.55rem] bg-gradient-to-b from-[#D4F829]/12 via-transparent to-black/25 opacity-0 transition group-hover:opacity-100" />
        <div className="relative mx-auto h-[34px] w-[34px] overflow-hidden rounded-full border border-[#A28B52]/70 bg-[#05070B] shadow-inner md:h-[40px] md:w-[40px]">
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover rounded-full" sizes="44px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/50">
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className={`absolute -right-1 -top-1 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-gradient-to-br text-[7px] font-black text-white shadow-[0_4px_10px_rgba(0,0,0,0.45)] ring-1 ring-[#E5DCC5]/60 md:h-[21px] md:w-[21px] md:text-[8px] ${getOvrColor(player.overall)}`}>
          {player.overall}
        </div>
        <div
          className="relative mt-1 flex flex-col items-center pointer-events-auto cursor-pointer"
          onPointerDown={(e) => {
            e.stopPropagation();
            onLabelClick(player);
          }}
        >
          <span className="max-w-[48px] truncate text-center text-[7px] font-black lowercase leading-none tracking-tight text-white drop-shadow-md md:max-w-[54px] md:text-[8px]">
            {player.username}
          </span>
          <div className={`mt-1 flex h-[14px] min-w-[31px] items-center justify-center rounded-[0.25rem] border border-[#D4F829]/25 bg-[#D4F829]/14 px-1 text-[7px] font-black uppercase tracking-wider text-[#EAF7AF] ${state.x !== null ? "flex" : "hidden"}`}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Drag Overlay Component ---
function TokenOverlay({ player, state }: { player: Player; state: PlayerState }) {
  const label = state.customLabel || player.position || "POS";

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0 w-[58px] md:w-[64px] scale-110 drop-shadow-2xl z-[100] opacity-95">
      <div className="relative w-[54px] rounded-[0.55rem] border border-[#D4F829] bg-[#101812]/95 p-[3px] shadow-2xl md:w-[60px]">
        <div className="relative mx-auto h-[34px] w-[34px] overflow-hidden rounded-full border border-[#A28B52] bg-[#05070B] md:h-[40px] md:w-[40px]">
        {player.avatarUrl ? (
          <Image src={player.avatarUrl} alt={player.username} fill className="object-cover rounded-full" sizes="44px" />
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center text-white/50 text-sm font-bold">
            {player.username.charAt(0).toUpperCase()}
          </div>
        )}
        </div>
        <div className={`absolute -right-1 -top-1 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-gradient-to-br text-[7px] font-black text-white ring-1 ring-[#E5DCC5]/60 md:h-[21px] md:w-[21px] md:text-[8px] ${getOvrColor(player.overall)}`}>
          {player.overall}
        </div>
        <span className="mt-1 block max-w-[48px] truncate text-center text-[7px] font-black lowercase leading-none text-white md:max-w-[54px] md:text-[8px]">
          {player.username}
        </span>
        <span className={`mx-auto mt-1 flex h-[14px] min-w-[31px] items-center justify-center rounded-[0.25rem] bg-[#D4F829] px-1 text-[7px] font-black uppercase tracking-wider text-[#151515] ${state.x !== null ? "flex" : "hidden"}`}>
          {label}
        </span>
      </div>
    </div>
  );
}


// --- Main Component ---
export function InlineTeamBuilder({ participants, onSaveTeams, isHost, currentUserId, onJoinTeam }: InlineTeamBuilderProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerStates, setPlayerStates] = useState<Record<string, PlayerState>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
          team: p.team === "Team A" ? "A" : p.team === "Team B" ? "B" : null,
        };
      } else {
        if (p.team === "Team A") {
          newStates[p.id] = {
            id: p.id,
            x: 20 + Math.random() * 60,
            y: 15 + Math.random() * 30, // Top half
            team: "A",
            customLabel: p.position || "CMF",
          };
        } else if (p.team === "Team B") {
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

    if (droppedOnPitch) {
      const autoPos = getAutoPosition(percentX, percentY);
      // Determine team based on Y
      const newTeam = percentY <= 50 ? "A" : "B";
      
      setPlayerStates(prev => ({
        ...prev,
        [pId]: { 
          ...prev[pId], 
          x: percentX, 
          y: percentY, 
          team: newTeam,
          customLabel: autoPos
        }
      }));

      if (currentTeam !== newTeam) {
        handleJoinAction(newTeam === "A" ? "Team A" : "Team B", pId);
      }
    } else {
      setPlayerStates(prev => ({
        ...prev,
        [pId]: { ...prev[pId], x: null, y: null, team: null }
      }));
      if (currentTeam !== null) {
         handleJoinAction(null, pId);
      }
    }
  };

  const handleJoinAction = async (team: "Team A" | "Team B" | null, pId: string) => {
    if (pId === currentUserId) {
      try {
        await onJoinTeam(team);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const teamAIds = Object.values(playerStates).filter(s => s.team === "A").map(s => s.id);
      const teamBIds = Object.values(playerStates).filter(s => s.team === "B").map(s => s.id);
      await onSaveTeams(teamAIds, teamBIds);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
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

  return (
    <div className="w-full flex flex-col relative bg-[#111111] rounded-[2rem] overflow-hidden shadow-[0_28px_70px_rgba(0,0,0,0.5)] select-none h-[760px] md:h-[850px] border border-[#E5DCC5]/5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_0%,rgba(212,248,41,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_28%)]" />
      
      {/* Top Header */}
      {isHost && (
        <div className="flex items-center justify-between gap-3 p-4 bg-transparent shrink-0 z-20">
          <div className="min-w-0">
            <div className="font-display text-[18px] italic uppercase leading-none tracking-wide text-white">Squad Board</div>
            <div className="mt-1 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.22em] text-[#A28B52]">
              <Grip size={11} />
              Drag players into shape
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#D4F829] px-5 text-[9px] font-black uppercase tracking-widest text-black shadow-[0_10px_30px_rgba(212,248,41,0.24),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:bg-[#c3e626] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
            SAVE FORMATION
          </button>
        </div>
      )}
      {!isHost && (
        <div className="flex items-center justify-between gap-3 p-4 bg-transparent shrink-0 z-20">
          <div>
            <div className="font-display text-[18px] italic uppercase leading-none tracking-wide text-white">Squad Board</div>
            <div className="mt-1 text-[8px] font-black uppercase tracking-[0.22em] text-[#A28B52]">Move your card to join a side</div>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-row flex-1 overflow-hidden relative bg-transparent">
          
          {/* Left Sidebar (Lobby / Substitutes) */}
          <div ref={sidebarRef} className="w-[94px] md:w-[104px] bg-[#141414]/95 shrink-0 flex flex-col z-20 shadow-[12px_0_30px_rgba(0,0,0,0.25)] border-r border-white/5">
            <div className="p-3 bg-[#0d0d0d]/60 flex flex-col items-center border-b border-white/5">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Lobby</span>
              <span className="mt-1 rounded-full border border-[#A28B52]/30 px-2 py-0.5 text-[8px] font-black text-[#A28B52]">{benchPlayers.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center py-3 gap-4">
              {benchPlayers.map(p => {
                const state = playerStates[p.id];
                if (!state) return null;
                const isDraggable = isHost || p.id === currentUserId;
                return (
                  <DraggablePlayerToken 
                    key={p.id} 
                    player={p} 
                    state={state} 
                    isDraggable={isDraggable} 
                    onLabelClick={handleLabelEdit}
                  />
                );
              })}
              {Object.values(playerStates).filter(s => s.x === null).length === 0 && (
                <div className="mt-8 text-center text-[9px] italic uppercase tracking-widest text-white/30 px-2 py-4">
                  Empty
                </div>
              )}
            </div>
          </div>

          {/* The Pitch (Main Content) */}
          <div ref={pitchRef} className="flex-1 relative overflow-hidden" 
               style={{ background: 'radial-gradient(circle at 50% 50%, rgba(212,248,41,0.08), transparent 24%), repeating-linear-gradient(0deg, #46684d, #46684d 60px, #416247 60px, #416247 120px)' }}>
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


            {/* Headers/Footers OVER the pitch */}
            <div className="absolute top-0 left-0 right-0 bg-[#142819]/78 h-9 flex items-center justify-between px-3 pointer-events-none z-10 backdrop-blur-[5px] border-b border-white/8">
              <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Shield size={12} className="text-white/50" /> Team A <span className="text-[#A28B52]">{statsA.count}</span>
              </span>
              <span className="rounded-md bg-[#139447] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">{statsA.avgOvr ? statsA.avgOvr : 0}</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-[#142819]/78 h-9 flex items-center justify-between px-3 pointer-events-none z-10 backdrop-blur-[5px] border-t border-white/8">
              <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Shield size={12} className="text-white/50" /> Team B <span className="text-[#A28B52]">{statsB.count}</span>
              </span>
              <span className="rounded-md bg-[#139447] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">{statsB.avgOvr ? statsB.avgOvr : 0}</span>
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
                />
              );
            })}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
          {activePlayer && activePlayerState ? (
            <TokenOverlay player={activePlayer} state={activePlayerState} />
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
  );
}
