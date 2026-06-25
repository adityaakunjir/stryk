"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Users, Loader2, Save, Edit3, Check, ChevronLeft, ChevronRight, Shield } from "lucide-react";
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
  if (ovr >= 80) return "bg-green-600";
  if (ovr >= 70) return "bg-green-500";
  if (ovr >= 60) return "bg-yellow-500";
  return "bg-orange-600";
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
      className={`relative flex flex-col items-center justify-center shrink-0 group touch-none drop-shadow-xl transition-shadow w-[50px] md:w-[60px] ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      {/* Avatar Circle */}
      <div className="relative w-[36px] h-[36px] md:w-[44px] md:h-[44px] rounded-full border-[1.5px] border-white/40 shadow-lg bg-[#2a3036]">
        {player.avatarUrl ? (
          <Image src={player.avatarUrl} alt={player.username} fill className="object-cover rounded-full" sizes="44px" />
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center text-white/50 text-sm font-bold">
            {player.username.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* OVR Badge Overlap */}
        <div className={`absolute -bottom-1 -right-1 w-[16px] h-[16px] md:w-[20px] md:h-[20px] rounded-full flex items-center justify-center text-[7px] md:text-[8px] font-black text-white border border-white/20 shadow-sm ${getOvrColor(player.overall)}`}>
          {player.overall}
        </div>
      </div>
      
      {/* Name and Position */}
      <div 
        className="mt-1 flex flex-col items-center pointer-events-auto cursor-pointer"
        onPointerDown={(e) => {
          e.stopPropagation();
          onLabelClick(player);
        }}
      >
        <span className="text-[8px] md:text-[9px] font-bold text-white tracking-tight truncate max-w-[50px] md:max-w-[60px] text-center drop-shadow-md">
          {player.username}
        </span>
        <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white/80 mt-[1px] bg-black/40 px-1 rounded-sm border border-white/10 ${state.x !== null ? "block" : "hidden"}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

// --- Drag Overlay Component ---
function TokenOverlay({ player, state }: { player: Player; state: PlayerState }) {
  const label = state.customLabel || player.position || "POS";

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0 w-[50px] md:w-[60px] scale-110 drop-shadow-2xl z-[100] opacity-95">
      <div className="relative w-[36px] h-[36px] md:w-[44px] md:h-[44px] rounded-full border-[1.5px] border-white shadow-xl bg-[#2a3036]">
        {player.avatarUrl ? (
          <Image src={player.avatarUrl} alt={player.username} fill className="object-cover rounded-full" sizes="44px" />
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center text-white/50 text-sm font-bold">
            {player.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={`absolute -bottom-1 -right-1 w-[16px] h-[16px] md:w-[20px] md:h-[20px] rounded-full flex items-center justify-center text-[7px] md:text-[8px] font-black text-white border border-white/20 shadow-sm ${getOvrColor(player.overall)}`}>
          {player.overall}
        </div>
      </div>
      <div className="mt-1 flex flex-col items-center">
        <span className="text-[8px] md:text-[9px] font-bold text-white tracking-tight truncate max-w-[50px] md:max-w-[60px] text-center drop-shadow-md">
          {player.username}
        </span>
        <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white mt-[1px] bg-black/60 px-1 rounded-sm border border-white/20 ${state.x !== null ? "block" : "hidden"}`}>
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

  return (
    <div className="w-full flex flex-col relative bg-[#151515] rounded-[2rem] overflow-hidden shadow-2xl select-none h-[750px] md:h-[850px]">
      
      {/* Top Header */}
      {isHost && (
        <div className="flex items-center justify-end p-3 bg-transparent shrink-0 z-20">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#D4F829] hover:bg-[#c3e626] text-black rounded-[1.25rem] font-black tracking-widest uppercase text-[9px] transition disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
            SAVE FORMATION
          </button>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-row flex-1 overflow-hidden relative bg-transparent">
          
          {/* Left Sidebar (Lobby / Substitutes) */}
          <div ref={sidebarRef} className="w-[80px] md:w-[90px] bg-[#1a1a1a] shrink-0 flex flex-col z-20 shadow-md">
            <div className="p-3 bg-transparent flex flex-col items-center">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Lobby</span>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center py-3 gap-4">
              {players.filter(p => !playerStates[p.id]?.x).map(p => {
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
                <div className="text-[9px] uppercase tracking-widest text-white/30 italic text-center px-2 py-4">
                  Empty
                </div>
              )}
            </div>
          </div>

          {/* The Pitch (Main Content) */}
          <div ref={pitchRef} className="flex-1 relative overflow-hidden" 
               style={{ background: 'repeating-linear-gradient(0deg, #4d6d53, #4d6d53 50px, #48664e 50px, #48664e 100px)' }}>
            
            {/* Pitch Lines Wrapper */}
            <div className="absolute inset-4 border-[1.5px] border-white/40 pointer-events-none" />
            
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
            <div className="absolute top-0 left-0 right-0 bg-black/40 h-8 flex items-center justify-between px-3 pointer-events-none z-10 backdrop-blur-[2px]">
              <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Shield size={12} className="text-white/50" /> Team A
              </span>
              <span className="text-[10px] font-black text-white bg-green-700/80 px-2 py-0.5 rounded-sm">{statsA.avgOvr * 10}</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-black/40 h-8 flex items-center justify-between px-3 pointer-events-none z-10 backdrop-blur-[2px]">
              <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Shield size={12} className="text-white/50" /> Team B
              </span>
              <span className="text-[10px] font-black text-white bg-green-700/80 px-2 py-0.5 rounded-sm">{statsB.avgOvr * 10}</span>
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
