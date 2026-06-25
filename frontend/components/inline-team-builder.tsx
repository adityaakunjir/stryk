"use client";

import React, { useState, useEffect } from "react";
import { X, Users, Loader2, RefreshCw, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

// Map MatchParticipant for local usage
interface Player {
  id: string; // This is the user.id
  participantId: string; // The match participant id
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  overall: number;
  position: string | null;
  playStyle: string | null;
  team: string | null; // "A", "B", or null
  tempZone?: string; 
}

interface InlineTeamBuilderProps {
  participants: any[];
  onSaveTeams: (teamA: string[], teamB: string[]) => Promise<void>;
  isHost: boolean;
  currentUserId: string | null;
  onJoinTeam: (team: "Team A" | "Team B" | null) => Promise<void>;
}

const ZONE_LABELS: Record<string, string> = {
  unassigned: "BENCH",
  teamA_ATT: "FWD",
  teamA_MID: "MID",
  teamA_DEF: "DEF",
  teamA_GK: "GK",
  teamB_ATT: "FWD",
  teamB_MID: "MID",
  teamB_DEF: "DEF",
  teamB_GK: "GK",
};

const getTierStyles = (ovr: number) => {
  if (ovr >= 80) return "bg-gradient-to-br from-[#FCECA1] via-[#D4AF37] to-[#AA7900] text-[#3E2B00] shadow-[0_0_15px_rgba(212,175,55,0.5)] border-[#FFF3B0]";
  if (ovr >= 70) return "bg-gradient-to-br from-[#FFFFFF] via-[#D1D1D1] to-[#808080] text-[#151515] shadow-[0_0_15px_rgba(209,209,209,0.5)] border-[#FFFFFF]";
  return "bg-gradient-to-br from-[#E8A372] via-[#A0522D] to-[#613014] text-[#FFF] shadow-[0_0_15px_rgba(160,82,45,0.5)] border-[#FFCCB3]";
};

// Sortable Player Shield Card
function SortablePlayerCard({ player, zoneId }: { player: Player; zoneId: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id, data: { ...player, zoneId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, 
  };

  const isBench = zoneId === "unassigned";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing w-[60px] md:w-[72px] shrink-0 group touch-none drop-shadow-md hover:drop-shadow-2xl transition-all z-10 hover:z-30"
    >
      <div 
        className={`relative w-full aspect-[2.5/3.5] flex flex-col items-center pt-1 md:pt-1.5 ${getTierStyles(player.overall)} border-[1px]`}
        style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 15%, 100% 80%, 50% 100%, 0 80%, 0 15%)' }}
      >
        {/* OVR + POS Top Left */}
        <div className="absolute top-1 left-1.5 flex flex-col items-center">
          <span className="text-[11px] md:text-[13px] font-black italic leading-none">{player.overall}</span>
          {!isBench && (
            <span className="text-[5px] md:text-[6px] font-bold uppercase mt-0.5 tracking-tighter opacity-80">{ZONE_LABELS[zoneId]}</span>
          )}
        </div>

        {/* Avatar */}
        <div className="w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden mt-1 md:mt-1.5 border border-white/40 bg-black/10 relative">
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover" sizes="40px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black/40 font-bold text-sm bg-white/50">
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Separator line */}
        <div className="w-3/4 h-[1px] bg-black/10 my-0.5 md:my-1" />

        {/* Name */}
        <div className="text-[6.5px] md:text-[7.5px] font-black uppercase text-center px-1 leading-none tracking-tighter truncate w-full">
          {player.fullName?.split(' ')[0] || player.username}
        </div>
      </div>
    </div>
  );
}

// Player Card representation for Drag Overlay
function PlayerCardOverlay({ player, zoneId }: { player: Player; zoneId: string }) {
  const isBench = zoneId === "unassigned";
  return (
    <div className="relative flex flex-col items-center justify-center w-[64px] md:w-[76px] shrink-0 scale-110 drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] z-[100]">
      <div 
        className={`relative w-full aspect-[2.5/3.5] flex flex-col items-center pt-1 md:pt-1.5 ${getTierStyles(player.overall)} border-[1px]`}
        style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 15%, 100% 80%, 50% 100%, 0 80%, 0 15%)' }}
      >
        <div className="absolute top-1 left-1.5 flex flex-col items-center">
          <span className="text-[11px] md:text-[13px] font-black italic leading-none">{player.overall}</span>
          {!isBench && (
            <span className="text-[5px] md:text-[6px] font-bold uppercase mt-0.5 tracking-tighter opacity-80">{ZONE_LABELS[zoneId]}</span>
          )}
        </div>

        <div className="w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden mt-1 md:mt-1.5 border border-white/40 bg-black/10 relative">
          {player.avatarUrl ? (
            <Image src={player.avatarUrl} alt={player.username} fill className="object-cover" sizes="40px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black/40 font-bold text-sm bg-white/50">
              {player.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="w-3/4 h-[1px] bg-black/10 my-0.5 md:my-1" />

        <div className="text-[6.5px] md:text-[7.5px] font-black uppercase text-center px-1 leading-none tracking-tighter truncate w-full">
          {player.fullName?.split(' ')[0] || player.username}
        </div>
      </div>
    </div>
  );
}

// Droppable Pitch Strip
function PitchZone({ id, players }: { id: string; players: Player[] }) {
  return (
    <div className="flex-1 w-full relative flex items-center justify-center">
      <SortableContext id={id} items={players.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
        <div className="w-full h-full flex items-center justify-center gap-1.5 md:gap-4 px-2 z-10 relative">
          {players.map((player) => (
            <SortablePlayerCard key={player.id} player={player} zoneId={id} />
          ))}
          {players.length === 0 && (
            <div className="opacity-0 w-full h-full absolute inset-0" />
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function InlineTeamBuilder({ participants, onSaveTeams, isHost, currentUserId, onJoinTeam }: InlineTeamBuilderProps) {
  const [items, setItems] = useState<Record<string, Player[]>>({
    unassigned: [],
    teamA_ATT: [], teamA_MID: [], teamA_DEF: [], teamA_GK: [],
    teamB_ATT: [], teamB_MID: [], teamB_DEF: [], teamB_GK: [],
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  useEffect(() => {
    if (participants) {
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

      const newItems: Record<string, Player[]> = {
        unassigned: [],
        teamA_ATT: [], teamA_MID: [], teamA_DEF: [], teamA_GK: [],
        teamB_ATT: [], teamB_MID: [], teamB_DEF: [], teamB_GK: [],
      };

      mappedPlayers.forEach(p => {
        if (!p.team) {
          newItems.unassigned.push(p);
        } else {
          const pos = p.position || "CM";
          const teamPrefix = p.team === "Team A" ? "teamA" : "teamB";
          
          if (["ST", "CF", "LW", "RW"].includes(pos)) {
            newItems[`${teamPrefix}_ATT`].push(p);
          } else if (["CB", "LB", "RB", "LWB", "RWB"].includes(pos)) {
            newItems[`${teamPrefix}_DEF`].push(p);
          } else if (pos === "GK") {
            newItems[`${teamPrefix}_GK`].push(p);
          } else {
            newItems[`${teamPrefix}_MID`].push(p);
          }
        }
      });

      setItems(newItems);
    }
  }, [participants]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!isHost) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isHost) return;
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string) || (over.id as string);

    if (!activeContainer || !overContainer || !items[overContainer]) return;

    if (activeContainer === overContainer) {
      setItems((prev) => {
        const containerItems = prev[activeContainer];
        const oldIndex = containerItems.findIndex((item) => item.id === active.id);
        const newIndex = containerItems.findIndex((item) => item.id === over.id);

        return {
          ...prev,
          [activeContainer]: arrayMove(containerItems, oldIndex, newIndex),
        };
      });
    } else {
      setItems((prev) => {
        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];
        
        const activeIndex = activeItems.findIndex((item) => item.id === active.id);
        const overIndex = over.id in prev 
          ? overItems.length 
          : overItems.findIndex((item) => item.id === over.id);

        const newActiveItems = [...activeItems];
        const [movedItem] = newActiveItems.splice(activeIndex, 1);
        
        const updatedItem = { 
          ...movedItem, 
          team: overContainer.startsWith('teamA') ? 'A' : overContainer.startsWith('teamB') ? 'B' : null 
        };

        const newOverItems = [...overItems];
        if (overIndex >= 0) {
          newOverItems.splice(overIndex, 0, updatedItem);
        } else {
          newOverItems.push(updatedItem);
        }

        return {
          ...prev,
          [activeContainer]: newActiveItems,
          [overContainer]: newOverItems,
        };
      });
    }
  };

  const findContainer = (id: string) => {
    if (id in items) return id;
    for (const key of Object.keys(items)) {
      if (items[key].find((item) => item.id === id)) {
        return key;
      }
    }
    return null;
  };

  const activePlayer = activeId 
    ? Object.values(items).flat().find(p => p.id === activeId)
    : null;

  const activePlayerZone = activePlayer ? findContainer(activePlayer.id) : null;

  const handleAutoBalance = () => {
    const allPlayers = Object.values(items).flat();
    const sortedPlayers = [...allPlayers].sort((a, b) => b.overall - a.overall);
    
    const newItems: Record<string, Player[]> = {
      unassigned: [],
      teamA_ATT: [], teamA_MID: [], teamA_DEF: [], teamA_GK: [],
      teamB_ATT: [], teamB_MID: [], teamB_DEF: [], teamB_GK: [],
    };
    
    let sumA = 0;
    let sumB = 0;

    const positionGroups: Record<string, Player[]> = { GK: [], DEF: [], MID: [], ATT: [] };
    
    sortedPlayers.forEach(p => {
      const pos = p.position || "CM";
      let cat = "MID";
      if (["ST", "CF", "LW", "RW"].includes(pos)) cat = "ATT";
      if (["CB", "LB", "RB", "LWB", "RWB"].includes(pos)) cat = "DEF";
      if (pos === "GK") cat = "GK";
      
      positionGroups[cat].push(p);
    });

    ["GK", "DEF", "MID", "ATT"].forEach(cat => {
      positionGroups[cat].forEach(player => {
        if (sumA <= sumB) {
          newItems[`teamA_${cat}`].push({ ...player, team: "A" });
          sumA += player.overall;
        } else {
          newItems[`teamB_${cat}`].push({ ...player, team: "B" });
          sumB += player.overall;
        }
      });
    });

    setItems(newItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const teamAIds = [
        ...items.teamA_ATT, ...items.teamA_MID, ...items.teamA_DEF, ...items.teamA_GK
      ].map(p => p.id);
      
      const teamBIds = [
        ...items.teamB_ATT, ...items.teamB_MID, ...items.teamB_DEF, ...items.teamB_GK
      ].map(p => p.id);
      
      await onSaveTeams(teamAIds, teamBIds);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getTeamStats = (prefix: string) => {
    const teamPlayers = [
      ...items[`${prefix}_ATT`], ...items[`${prefix}_MID`], ...items[`${prefix}_DEF`], ...items[`${prefix}_GK`]
    ];
    const avgOvr = teamPlayers.length > 0 
      ? Math.round(teamPlayers.reduce((s, p) => s + p.overall, 0) / teamPlayers.length) 
      : 0;
    return { count: teamPlayers.length, avgOvr };
  };

  const handleJoin = async (team: "Team A" | "Team B" | null) => {
    setJoinLoading(team || "bench");
    try {
      await onJoinTeam(team);
    } finally {
      setJoinLoading(null);
    }
  };

  const isJoined = currentUserId && participants.some(p => p.userId === currentUserId);
  const currentUserParticipant = currentUserId && participants.find(p => p.userId === currentUserId);
  const currentTeam = currentUserParticipant ? currentUserParticipant.team : null;

  const statsA = getTeamStats('teamA');
  const statsB = getTeamStats('teamB');

  return (
    <div className="w-full flex flex-col relative rounded-3xl overflow-hidden border border-[#A28B52]/20 shadow-2xl bg-[#151515] mt-6">
      {/* Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-4 border-b border-[#A28B52]/20 shrink-0 bg-[#151515] z-20 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#A28B52]/10 flex items-center justify-center border border-[#A28B52]/20">
            <Users className="text-[#D4F829]" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-[#E5DCC5] tracking-widest uppercase italic">Squad Builder</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#A28B52]">
              {isHost ? "Drag to organize teams" : "Choose your side"}
            </p>
          </div>
        </div>

        {isHost && (
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <button
              onClick={handleAutoBalance}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] uppercase font-bold tracking-widest bg-[#A28B52]/10 hover:bg-[#A28B52]/20 border border-[#A28B52]/20 text-[#D4F829] rounded-xl transition-all"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">AUTO-BALANCE</span>
              <span className="sm:hidden">AUTO</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#D4F829] hover:bg-[#c3e626] text-[#151515] rounded-xl font-bold tracking-[0.1em] uppercase text-[10px] transition-all shadow-lg disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin text-[#151515]" size={14} /> : <Save size={14} />}
              SAVE SQUAD
            </button>
          </div>
        )}
      </div>

      {/* Content Body */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 min-h-[500px] overflow-hidden flex flex-col relative bg-[#1A2E1D]">
          {/* The Pitch Container */}
          <div className="flex-1 relative flex flex-col w-full mx-auto shadow-2xl border-x border-[#ffffff05]">
                  {/* Pitch Graphics (Grass & Lines) */}
                  <div className="absolute inset-0 pointer-events-none opacity-50">
                    {/* Repeating Turf Stripes */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,0,0,0.1) 50px, rgba(0,0,0,0.1) 100px)' }}></div>
                    {/* Center Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/40 -translate-y-1/2 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                    {/* Center Circle */}
                    <div className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[2px] border-white/40 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                    {/* Center Dot */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white/60 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                    {/* Top Penalty Area */}
                    <div className="absolute top-0 left-1/2 w-48 sm:w-64 h-16 sm:h-24 border-x-[2px] border-b-[2px] border-white/40 -translate-x-1/2 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                    <div className="absolute top-0 left-1/2 w-24 sm:w-32 h-6 sm:h-8 border-x-[2px] border-b-[2px] border-white/40 -translate-x-1/2" />
                    {/* Bottom Penalty Area */}
                    <div className="absolute bottom-0 left-1/2 w-48 sm:w-64 h-16 sm:h-24 border-x-[2px] border-t-[2px] border-white/40 -translate-x-1/2 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                    <div className="absolute bottom-0 left-1/2 w-24 sm:w-32 h-6 sm:h-8 border-x-[2px] border-t-[2px] border-white/40 -translate-x-1/2" />
                  </div>

            <div className="absolute left-2 top-2 z-0 pointer-events-none text-white/20 font-black text-2xl sm:text-4xl italic tracking-widest uppercase origin-top-left -rotate-90 translate-y-24">Team A</div>
            <div className="absolute right-2 bottom-2 z-0 pointer-events-none text-white/20 font-black text-2xl sm:text-4xl italic tracking-widest uppercase origin-bottom-right -rotate-90 -translate-y-24">Team B</div>

            {/* Non-Host Join Overlays */}
            {!isHost && isJoined && (
              <>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                  {currentTeam !== "Team A" && (
                    <button
                      onClick={() => handleJoin("Team A")}
                      disabled={joinLoading !== null}
                      className="px-6 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-white font-bold text-xs uppercase tracking-widest transition shadow-lg flex items-center gap-2"
                    >
                      {joinLoading === "Team A" ? <Loader2 size={14} className="animate-spin" /> : null}
                      JOIN TEAM A
                    </button>
                  )}
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                  {currentTeam !== "Team B" && (
                    <button
                      onClick={() => handleJoin("Team B")}
                      disabled={joinLoading !== null}
                      className="px-6 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-white font-bold text-xs uppercase tracking-widest transition shadow-lg flex items-center gap-2"
                    >
                      {joinLoading === "Team B" ? <Loader2 size={14} className="animate-spin" /> : null}
                      JOIN TEAM B
                    </button>
                  )}
                </div>
              </>
            )}

                  <div className="flex-1 flex flex-col z-10 w-full pt-4">
                    <PitchZone id="teamA_GK" players={items.teamA_GK} />
                    <PitchZone id="teamA_DEF" players={items.teamA_DEF} />
                    <PitchZone id="teamA_MID" players={items.teamA_MID} />
                    <PitchZone id="teamA_ATT" players={items.teamA_ATT} />
                  </div>
                  
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col items-center gap-1 z-20 pointer-events-none hidden sm:flex">
                    <div className="bg-[#151515] px-3 py-1.5 rounded-lg border border-white/10 shadow-xl flex flex-col items-center">
                      <span className="text-[9px] uppercase tracking-widest text-[#E5DCC5] font-bold">OVR</span>
                      <span className="text-sm text-white font-black">{statsA.avgOvr}</span>
                    </div>
                  </div>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col items-center gap-1 z-20 pointer-events-none hidden sm:flex">
                    <div className="bg-[#151515] px-3 py-1.5 rounded-lg border border-white/10 shadow-xl flex flex-col items-center">
                      <span className="text-[9px] uppercase tracking-widest text-[#E5DCC5] font-bold">OVR</span>
                      <span className="text-sm text-white font-black">{statsB.avgOvr}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col z-10 w-full pb-4">
                    <PitchZone id="teamB_ATT" players={items.teamB_ATT} />
                    <PitchZone id="teamB_MID" players={items.teamB_MID} />
                    <PitchZone id="teamB_DEF" players={items.teamB_DEF} />
                    <PitchZone id="teamB_GK" players={items.teamB_GK} />
                  </div>
                </div>

          {/* Bench Area */}
          <div className="h-32 sm:h-36 bg-[#111] border-t border-[#A28B52]/20 shrink-0 flex flex-col z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="px-4 py-2 bg-[#151515] border-b border-white/5 flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5DCC5]">Match Draft Pool (Bench)</span>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-bold text-[#A28B52]">{items.unassigned.length} Available</span>
                {!isHost && isJoined && currentTeam !== null && (
                  <button
                    onClick={() => handleJoin(null)}
                    disabled={joinLoading !== null}
                    className="text-[9px] uppercase font-bold tracking-widest px-2 py-1 bg-[#A28B52]/10 hover:bg-[#A28B52]/20 border border-[#A28B52]/20 text-[#E5DCC5] rounded-md transition"
                  >
                    {joinLoading === "bench" ? "Leaving..." : "Leave Team"}
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
              <SortableContext id="unassigned" items={items.unassigned.map(p => p.id)} strategy={horizontalListSortingStrategy}>
                      <div className="h-full flex items-center gap-3 sm:gap-4 px-4 min-w-max pb-2 pt-2">
                        {items.unassigned.map(player => (
                          <SortablePlayerCard key={player.id} player={player} zoneId="unassigned" />
                        ))}
                        {items.unassigned.length === 0 && (
                          <div className="text-[10px] uppercase tracking-widest text-white/30 italic w-full text-center">
                            All players are on the pitch
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </div>
                </div>

              </div>

          <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activePlayer && activePlayerZone ? (
              <PlayerCardOverlay player={activePlayer} zoneId={activePlayerZone} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    );
}
