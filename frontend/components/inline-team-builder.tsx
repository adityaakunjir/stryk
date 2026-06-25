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
  if (y > 88) return "GK";
  if (y > 65) {
    if (x < 30) return "LB";
    if (x > 70) return "RB";
    return "CB";
  }
  if (y > 45) {
    if (x < 30) return "DMF";
    if (x > 70) return "DMF";
    return "DMF";
  }
  if (y > 20) {
    if (x < 30) return "LMF";
    if (x > 70) return "RMF";
    if (y < 35) return "AMF";
    return "CMF";
  }
  if (x < 30) return "LWF";
  if (x > 70) return "RWF";
  if (y > 10) return "SS";
  return "CF";
};

// eFootball style tier background
const getTierStyles = (ovr: number) => {
  if (ovr >= 95) return "from-[#8B008B] via-[#4B0082] to-[#000000] border-[#DDA0DD] text-[#FFFFFF]"; // Epic/Legendary
  if (ovr >= 85) return "from-[#006400] via-[#2E8B57] to-[#000000] border-[#3CB371] text-[#FFFFFF]"; // Special Green
  if (ovr >= 75) return "from-[#FFD700] via-[#B8860B] to-[#000000] border-[#FFF8DC] text-[#FFD700]"; // Gold
  return "from-[#C0C0C0] via-[#808080] to-[#000000] border-[#E6E6FA] text-[#FFFFFF]"; // Silver/Standard
};

const getRoleColor = (pos: string) => {
  const attackers = ["CF", "SS", "LWF", "RWF"];
  const midfielders = ["AMF", "CMF", "LMF", "RMF", "DMF"];
  const defenders = ["CB", "LB", "RB"];
  const gks = ["GK"];
  
  if (attackers.includes(pos)) return "bg-red-500";
  if (midfielders.includes(pos)) return "bg-green-500";
  if (defenders.includes(pos)) return "bg-blue-500";
  if (gks.includes(pos)) return "bg-yellow-500";
  return "bg-gray-500";
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
  const roleColor = getRoleColor(label);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex flex-col items-center justify-center shrink-0 group touch-none drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] transition-shadow w-[54px] md:w-[64px] ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      <div 
        className={`relative w-full aspect-[3/4] flex flex-col rounded-md overflow-hidden bg-gradient-to-b ${getTierStyles(player.overall)} border-2 shadow-inner`}
      >
        <div className="absolute inset-0 bg-[url('/card-texture.png')] opacity-20 mix-blend-overlay pointer-events-none" />
        
        {/* Top Left OVR & POS */}
        <div className="absolute top-1 left-1 flex flex-col items-center z-10">
          <span className="text-[14px] md:text-[16px] font-black leading-none drop-shadow-md">{player.overall}</span>
          <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-tighter drop-shadow-md">{label}</span>
        </div>

        {/* Player Image */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[120%] h-[80%] flex items-end justify-center">
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover object-bottom drop-shadow-lg" sizes="80px" />
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold mb-2 backdrop-blur-sm border border-white/40">
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Bottom Name Plate */}
        <div className="absolute bottom-0 w-full h-4 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-[7px] md:text-[8px] font-bold uppercase text-white px-1 truncate w-full text-center">
            {player.fullName?.split(' ')[0] || player.username}
          </div>
        </div>
      </div>
      
      {/* Position Label Tag below card */}
      <button 
        onPointerDown={(e) => {
          e.stopPropagation();
          onLabelClick(player);
        }}
        className={`mt-1 px-2 py-0.5 rounded border border-black/40 text-[8px] md:text-[9px] font-bold text-white uppercase flex items-center justify-center gap-1 hover:brightness-110 transition-colors pointer-events-auto min-w-[36px] shadow-sm ${roleColor}`}
      >
        {label}
      </button>
    </div>
  );
}

// --- Drag Overlay Component ---
function TokenOverlay({ player, state }: { player: Player; state: PlayerState }) {
  const label = state.customLabel || player.position || "POS";
  const roleColor = getRoleColor(label);

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0 w-[60px] md:w-[72px] scale-110 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] z-[100] opacity-95">
      <div 
        className={`relative w-full aspect-[3/4] flex flex-col rounded-md overflow-hidden bg-gradient-to-b ${getTierStyles(player.overall)} border-2 shadow-inner`}
      >
        <div className="absolute top-1 left-1 flex flex-col items-center z-10">
          <span className="text-[14px] md:text-[16px] font-black leading-none drop-shadow-md">{player.overall}</span>
          <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-tighter drop-shadow-md">{label}</span>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[120%] h-[80%] flex items-end justify-center">
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover object-bottom drop-shadow-lg" sizes="80px" />
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold mb-2 backdrop-blur-sm border border-white/40">
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 w-full h-4 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-[7px] md:text-[8px] font-bold uppercase text-white px-1 truncate w-full text-center">
            {player.fullName?.split(' ')[0] || player.username}
          </div>
        </div>
      </div>
      <div className={`mt-1 px-2 py-0.5 rounded border border-black/40 text-[8px] md:text-[9px] font-bold text-white uppercase min-w-[36px] text-center shadow-sm ${roleColor}`}>
        {label}
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
  const [viewingTeam, setViewingTeam] = useState<"A" | "B">("A");
  
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
        if (p.team === "Team A" || p.team === "Team B") {
          newStates[p.id] = {
            id: p.id,
            x: 20 + Math.random() * 60, // scatter 20% to 80% width
            y: 20 + Math.random() * 60, // scatter 20% to 80% height
            team: p.team === "Team A" ? "A" : "B",
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

  // Save to local storage whenever playerStates change
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
    if (!isHost && pId !== currentUserId) return; // Non-hosts can only drag themselves
    setActiveId(pId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active } = event;
    const pId = active.id as string;
    
    if (!isHost && pId !== currentUserId) return;
    
    if (!active.rect.current.translated) return;

    // Check if dropped on pitch or sidebar
    const dropCenterX = active.rect.current.translated.left + active.rect.current.translated.width / 2;
    const dropCenterY = active.rect.current.translated.top + active.rect.current.translated.height / 2;

    const pitchRect = pitchRef.current?.getBoundingClientRect();
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();

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
      setPlayerStates(prev => ({
        ...prev,
        [pId]: { 
          ...prev[pId], 
          x: percentX, 
          y: percentY, 
          team: viewingTeam,
          customLabel: autoPos
        }
      }));

      if (currentTeam !== viewingTeam) {
        handleJoinAction(viewingTeam === "A" ? "Team A" : "Team B", pId);
      }
    } else {
      // Dropped off pitch (back to unassigned/lobby)
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
    // If it's the current user, call onJoinTeam immediately to trigger DB save & notification
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
        customLabel: editLabelValue.substring(0, 5).toUpperCase() // Max 5 chars
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

  const stats = getTeamStats(viewingTeam);
  const activePlayer = activeId ? players.find(p => p.id === activeId) : null;
  const activePlayerState = activeId ? playerStates[activeId] : null;

  return (
    <div className="w-full flex flex-col relative rounded-xl overflow-hidden border border-[#A28B52]/20 shadow-2xl bg-[#000] select-none h-[600px] md:h-[700px]">
      
      {/* Top Toggle Bar */}
      <div className="flex items-center justify-between p-3 bg-[#111] border-b border-white/10 z-20 shrink-0">
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/5">
          <button 
            onClick={() => setViewingTeam("A")}
            className={`px-4 py-1.5 rounded-md text-[10px] font-black tracking-widest uppercase transition ${viewingTeam === "A" ? "bg-[#D4F829] text-black" : "text-white/50 hover:text-white"}`}
          >
            Team A
          </button>
          <button 
            onClick={() => setViewingTeam("B")}
            className={`px-4 py-1.5 rounded-md text-[10px] font-black tracking-widest uppercase transition ${viewingTeam === "B" ? "bg-[#D4F829] text-black" : "text-white/50 hover:text-white"}`}
          >
            Team B
          </button>
        </div>

        {isHost && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold tracking-widest uppercase text-[9px] transition disabled:opacity-50 border border-white/10"
          >
            {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
            SAVE
          </button>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-row flex-1 overflow-hidden relative">
          
          {/* Left Sidebar (Lobby / Substitutes) */}
          <div ref={sidebarRef} className="w-[85px] md:w-[100px] bg-[#F5F5F5] shrink-0 flex flex-col border-r border-black/10 z-20">
            <div className="p-2 bg-white border-b border-black/10 flex flex-col items-center">
              <span className="text-[10px] font-black text-black uppercase tracking-widest">Lobby</span>
              <span className="text-[8px] font-bold text-black/50">Unassigned</span>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center py-3 gap-3">
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
                <div className="text-[9px] uppercase tracking-widest text-black/30 italic text-center px-2 py-4">
                  Empty
                </div>
              )}
            </div>
          </div>

          {/* The Pitch (Main Content) */}
          <div ref={pitchRef} className="flex-1 relative bg-[#0a2311] overflow-hidden">
            {/* Pitch Grass Pattern */}
            <div className="absolute inset-0 opacity-80" 
                 style={{ 
                   backgroundImage: `
                     linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                     linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                   `, 
                   backgroundSize: '20px 20px' 
                 }} 
            />
            {/* Pitch Lines */}
            <div className="absolute inset-4 border border-white/30 pointer-events-none" />
            <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-white/30 -translate-y-1/2 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-20 h-20 rounded-full border border-white/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute top-4 left-1/2 w-32 h-12 border-x border-b border-white/30 -translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-4 left-1/2 w-32 h-12 border-x border-t border-white/30 -translate-x-1/2 pointer-events-none" />

            {/* Team Info Overlay */}
            <div className="absolute top-6 right-6 flex flex-col items-end pointer-events-none z-10">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Strength</span>
              <span className="text-3xl text-white font-black drop-shadow-md italic">{stats.avgOvr * 10}</span>
              <span className="text-[8px] text-white/50 uppercase mt-1 bg-black/40 px-2 py-0.5 rounded">Team {viewingTeam}</span>
            </div>

            {/* Players on Pitch */}
            {players.map(p => {
              const state = playerStates[p.id];
              // Only render players who are on the pitch AND belong to the viewing team
              if (!state || state.x === null || state.y === null || state.team !== viewingTeam) return null;
              
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
