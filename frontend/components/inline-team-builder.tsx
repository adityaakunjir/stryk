"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Users, Loader2, Save, Edit3, Check } from "lucide-react";
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
const getTierStyles = (ovr: number) => {
  if (ovr >= 80) return "bg-gradient-to-br from-[#FCECA1] via-[#D4AF37] to-[#AA7900] text-[#3E2B00] shadow-[0_0_15px_rgba(212,175,55,0.5)] border-[#FFF3B0]";
  if (ovr >= 70) return "bg-gradient-to-br from-[#FFFFFF] via-[#D1D1D1] to-[#808080] text-[#151515] shadow-[0_0_15px_rgba(209,209,209,0.5)] border-[#FFFFFF]";
  return "bg-gradient-to-br from-[#E8A372] via-[#A0522D] to-[#613014] text-[#FFF] shadow-[0_0_15px_rgba(160,82,45,0.5)] border-[#FFCCB3]";
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex flex-col items-center justify-center shrink-0 group touch-none drop-shadow-md hover:drop-shadow-2xl transition-shadow w-[48px] md:w-[60px] ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      <div 
        className={`relative w-full aspect-[2.5/3.5] flex flex-col items-center pt-1 ${getTierStyles(player.overall)} border-[1px]`}
        style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 15%, 100% 80%, 50% 100%, 0 80%, 0 15%)' }}
      >
        <div className="absolute top-0.5 left-1 flex flex-col items-center">
          <span className="text-[9px] md:text-[11px] font-black italic leading-none">{player.overall}</span>
        </div>

        <div className="w-5 h-5 md:w-7 md:h-7 rounded-full overflow-hidden mt-1 border border-white/40 bg-black/10 relative">
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover" sizes="40px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black/40 font-bold text-xs bg-white/50">
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="w-3/4 h-[1px] bg-black/10 my-0.5" />

        <div className="text-[5.5px] md:text-[6.5px] font-black uppercase text-center px-1 leading-none tracking-tighter truncate w-full">
          {player.fullName?.split(' ')[0] || player.username}
        </div>
      </div>
      
      {/* Editable Position Label */}
      <button 
        onPointerDown={(e) => {
          e.stopPropagation();
          onLabelClick(player);
        }}
        className="mt-1 px-1.5 py-0.5 bg-black/60 rounded border border-white/20 text-[7px] md:text-[8px] font-bold text-white uppercase flex items-center gap-1 hover:bg-black/80 transition-colors pointer-events-auto"
      >
        {state.customLabel || player.position || "POS"}
        <Edit3 size={8} className="opacity-50 group-hover:opacity-100" />
      </button>
    </div>
  );
}

// --- Drag Overlay Component ---
function TokenOverlay({ player, state }: { player: Player; state: PlayerState }) {
  return (
    <div className="relative flex flex-col items-center justify-center shrink-0 w-[56px] md:w-[70px] scale-110 drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] z-[100] opacity-90">
      <div 
        className={`relative w-full aspect-[2.5/3.5] flex flex-col items-center pt-1 ${getTierStyles(player.overall)} border-[1px]`}
        style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 15%, 100% 80%, 50% 100%, 0 80%, 0 15%)' }}
      >
        <div className="absolute top-0.5 left-1 flex flex-col items-center">
          <span className="text-[9px] md:text-[11px] font-black italic leading-none">{player.overall}</span>
        </div>
        <div className="w-5 h-5 md:w-7 md:h-7 rounded-full overflow-hidden mt-1 border border-white/40 bg-black/10 relative">
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover" sizes="40px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black/40 font-bold text-xs bg-white/50">
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="w-3/4 h-[1px] bg-black/10 my-0.5" />
        <div className="text-[5.5px] md:text-[6.5px] font-black uppercase text-center px-1 leading-none tracking-tighter truncate w-full">
          {player.fullName?.split(' ')[0] || player.username}
        </div>
      </div>
      <div className="mt-1 px-1.5 py-0.5 bg-black/60 rounded border border-white/20 text-[7px] md:text-[8px] font-bold text-white uppercase">
        {state.customLabel || player.position || "POS"}
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
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  
  const pitchRef = useRef<HTMLDivElement>(null);

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
        // Hydrate from local storage but ensure team syncs with DB if saved previously
        newStates[p.id] = {
          ...savedStates[p.id],
          team: p.team === "Team A" ? "A" : p.team === "Team B" ? "B" : null,
        };
      } else {
        // Initial auto-scatter if no local storage
        if (p.team === "Team A" || p.team === "Team B") {
          newStates[p.id] = {
            id: p.id,
            x: 20 + Math.random() * 60, // scatter 20% to 80% width
            y: p.team === "Team A" ? 15 + Math.random() * 25 : 60 + Math.random() * 25,
            team: p.team === "Team A" ? "A" : "B",
            customLabel: p.position || "POS",
          };
        } else {
          newStates[p.id] = {
            id: p.id,
            x: null,
            y: null,
            team: null,
            customLabel: p.position || "POS",
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
    if (!pitchRef.current || !active.rect.current.translated) return;

    const pitchRect = pitchRef.current.getBoundingClientRect();
    
    // Calculate center of dropped token
    const dropX = active.rect.current.translated.left + active.rect.current.translated.width / 2;
    const dropY = active.rect.current.translated.top + active.rect.current.translated.height / 2;

    // Check if dropped outside the pitch (back to bench)
    if (dropX < pitchRect.left - 50 || dropX > pitchRect.right + 50 || dropY < pitchRect.top - 50 || dropY > pitchRect.bottom + 50) {
      setPlayerStates(prev => ({
        ...prev,
        [pId]: { ...prev[pId], x: null, y: null, team: null }
      }));
      if (playerStates[pId]?.team !== null) {
         handleJoinAction(null, pId);
      }
      return;
    }

    let percentX = ((dropX - pitchRect.left) / pitchRect.width) * 100;
    let percentY = ((dropY - pitchRect.top) / pitchRect.height) * 100;

    // Constrain X bounds
    percentX = Math.max(5, Math.min(95, percentX));
    
    // Determine target team by Y position
    const targetTeam: "A" | "B" = percentY <= 50 ? "A" : "B";
    const currentTeam = playerStates[pId]?.team;

    // Enforce Boundary Snapping
    if (targetTeam === "A") {
      percentY = Math.max(5, Math.min(48, percentY)); // Keep strictly in top half
    } else {
      percentY = Math.max(52, Math.min(95, percentY)); // Keep strictly in bottom half
    }

    setPlayerStates(prev => ({
      ...prev,
      [pId]: { ...prev[pId], x: percentX, y: percentY, team: targetTeam }
    }));

    // Trigger join action if team changed
    if (currentTeam !== targetTeam) {
      handleJoinAction(targetTeam === "A" ? "Team A" : "Team B", pId);
    }
  };

  const handleJoinAction = async (team: "Team A" | "Team B" | null, pId: string) => {
    // If it's the current user, call onJoinTeam immediately to trigger DB save & notification
    if (pId === currentUserId) {
      setJoinLoading(team || "bench");
      try {
        await onJoinTeam(team);
      } finally {
        setJoinLoading(null);
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

  const statsA = getTeamStats('A');
  const statsB = getTeamStats('B');

  const activePlayer = activeId ? players.find(p => p.id === activeId) : null;
  const activePlayerState = activeId ? playerStates[activeId] : null;

  return (
    <div className="w-full flex flex-col relative rounded-3xl overflow-hidden border border-[#A28B52]/20 shadow-2xl bg-[#151515] mt-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#A28B52]/20 bg-[#151515] z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#A28B52]/10 flex items-center justify-center border border-[#A28B52]/20">
            <Users className="text-[#D4F829]" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-[#E5DCC5] tracking-widest uppercase italic">Squad Builder</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#A28B52]">
              {isHost ? "Drag any token anywhere" : "Drag your token to claim a spot"}
            </p>
          </div>
        </div>

        {isHost && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#D4F829] hover:bg-[#c3e626] text-[#151515] rounded-xl font-bold tracking-[0.1em] uppercase text-[10px] transition shadow-lg disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            SAVE SQUAD
          </button>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* The Pitch */}
        <div ref={pitchRef} className="relative w-full h-[500px] bg-[#1A2E1D] overflow-hidden shadow-inner">
          {/* Pitch Graphics */}
          <div className="absolute inset-0 pointer-events-none opacity-50">
            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.1) 50px, rgba(0,0,0,0.1) 100px)' }} />
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/40 -translate-y-1/2 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[2px] border-white/40 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white/60 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 w-48 h-16 border-x-[2px] border-b-[2px] border-white/40 -translate-x-1/2" />
            <div className="absolute bottom-0 left-1/2 w-48 h-16 border-x-[2px] border-t-[2px] border-white/40 -translate-x-1/2" />
          </div>

          <div className="absolute left-2 top-2 z-0 pointer-events-none text-white/10 font-black text-4xl italic tracking-widest uppercase origin-top-left -rotate-90 translate-y-24">Team A</div>
          <div className="absolute right-2 bottom-2 z-0 pointer-events-none text-white/10 font-black text-4xl italic tracking-widest uppercase origin-bottom-right -rotate-90 -translate-y-24">Team B</div>

          {/* OVR Stats Indicators */}
          <div className="absolute top-4 left-4 flex flex-col items-center bg-black/40 px-2 py-1 rounded-lg border border-white/10 z-10 pointer-events-none backdrop-blur-sm">
            <span className="text-[8px] uppercase tracking-widest text-[#E5DCC5]/70 font-bold">Team A OVR</span>
            <span className="text-sm text-white font-black drop-shadow-md">{statsA.avgOvr}</span>
          </div>
          <div className="absolute bottom-4 right-4 flex flex-col items-center bg-black/40 px-2 py-1 rounded-lg border border-white/10 z-10 pointer-events-none backdrop-blur-sm">
            <span className="text-[8px] uppercase tracking-widest text-[#E5DCC5]/70 font-bold">Team B OVR</span>
            <span className="text-sm text-white font-black drop-shadow-md">{statsB.avgOvr}</span>
          </div>

          {/* Players on Pitch */}
          {players.map(p => {
            const state = playerStates[p.id];
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

        {/* Bench Area */}
        <div className="h-32 bg-[#111] border-t border-[#A28B52]/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col z-30 relative">
          <div className="px-4 py-2 bg-[#151515] border-b border-white/5 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-[#E5DCC5]">
            <span>Unassigned Tokens</span>
            <span className="text-[#A28B52]">{Object.values(playerStates).filter(s => s.x === null).length} Bench</span>
          </div>
          
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="h-full flex items-center gap-3 px-4 min-w-max pb-2 pt-2">
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
                <div className="text-[10px] uppercase tracking-widest text-white/30 italic w-full text-center py-4">
                  All players are on the pitch
                </div>
              )}
            </div>
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
          <div className="bg-[#151515] border border-[#A28B52]/30 rounded-2xl p-5 w-full max-w-[250px] shadow-2xl flex flex-col items-center">
            <h3 className="text-[#E5DCC5] text-[10px] font-bold uppercase tracking-widest mb-3">Edit Position Label</h3>
            <input 
              type="text" 
              value={editLabelValue}
              onChange={e => setEditLabelValue(e.target.value)}
              maxLength={5}
              placeholder="e.g. LWB"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveLabelEdit()}
              className="w-full bg-[#111] border border-[#A28B52]/40 rounded-lg px-3 py-2 text-center font-bold text-white uppercase tracking-wider outline-none focus:border-[#D4F829] transition"
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
