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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

// MatchParticipant interface mapped for local usage
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
}

interface TeamBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: any[]; // The raw participants from the match
  onSaveTeams: (teamA: string[], teamB: string[]) => Promise<void>;
}

// Sortable Player Card Component
function SortablePlayerCard({ player }: { player: Player }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id, data: player });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[#1A1A1A] border border-[#A28B52]/20 rounded-xl p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-[#A28B52]/40 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-[#2A2A2A] overflow-hidden shrink-0 border border-[#A28B52]/30">
        {player.avatarUrl ? (
          <Image src={player.avatarUrl} alt={player.username} width={40} height={40} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#E5DCC5] font-bold">
            {player.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[#E5DCC5] font-bold truncate text-sm">
          {player.fullName || player.username}
        </h4>
        <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
          <span className="text-[#A28B52] font-semibold">{player.position || "CAM"}</span>
          <span>•</span>
          <span>{player.playStyle || "Playmaker"}</span>
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-center justify-center pl-2 border-l border-[#A28B52]/10">
        <span className="text-[8px] uppercase tracking-[0.1em] text-[#A0A0A0] mb-0.5 font-bold">OVR</span>
        <span className="font-display text-lg text-[#E5DCC5] font-black italic">{player.overall}</span>
      </div>
    </div>
  );
}

// Player Card representation for Drag Overlay
function PlayerCardOverlay({ player }: { player: Player }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#A28B52] shadow-2xl shadow-[#A28B52]/20 rounded-xl p-3 flex items-center gap-3 cursor-grabbing scale-105">
      <div className="w-10 h-10 rounded-full bg-[#2A2A2A] overflow-hidden shrink-0 border border-[#A28B52]/50">
        {player.avatarUrl ? (
          <Image src={player.avatarUrl} alt={player.username} width={40} height={40} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#E5DCC5] font-bold">
            {player.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[#E5DCC5] font-bold truncate text-sm">
          {player.fullName || player.username}
        </h4>
        <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
          <span className="text-[#A28B52] font-semibold">{player.position || "CAM"}</span>
          <span>•</span>
          <span>{player.playStyle || "Playmaker"}</span>
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-center justify-center pl-2 border-l border-[#A28B52]/10">
        <span className="text-[8px] uppercase tracking-[0.1em] text-[#A0A0A0] mb-0.5 font-bold">OVR</span>
        <span className="font-display text-lg text-[#E5DCC5] font-black italic">{player.overall}</span>
      </div>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ id, title, players }: { id: string; title: string; players: Player[] }) {
  const totalOvr = players.reduce((sum, p) => sum + p.overall, 0);
  const avgOvr = players.length > 0 ? Math.round(totalOvr / players.length) : 0;

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl overflow-hidden">
      <div className="p-3 bg-[#1A1A1A] border-b border-[#2A2A2A] flex justify-between items-center shrink-0">
        <h3 className="text-[#E5DCC5] font-bold text-sm tracking-wider uppercase">{title}</h3>
        <div className="flex items-center gap-3">
          <div className="text-xs text-[#A0A0A0]"><span className="text-white font-bold">{players.length}</span> players</div>
          {players.length > 0 && id !== "unassigned" && (
            <div className="text-xs text-[#A28B52] font-bold bg-[#A28B52]/10 px-2 py-0.5 rounded-full">
              AVG {avgOvr}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <SortableContext id={id} items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 min-h-[100px]">
            {players.map((player) => (
              <SortablePlayerCard key={player.id} player={player} />
            ))}
            {players.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-[#555] py-8 border-2 border-dashed border-[#222] rounded-xl min-h-[120px]">
                <Users size={24} className="mb-2 opacity-50" />
                <p className="text-xs font-medium">Drag players here</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function TeamBuilderModal({ isOpen, onClose, participants, onSaveTeams }: TeamBuilderModalProps) {
  const [mode, setMode] = useState<"MANUAL" | "AUTO">("MANUAL");
  const [items, setItems] = useState<Record<string, Player[]>>({
    unassigned: [],
    teamA: [],
    teamB: [],
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize items from participants
  useEffect(() => {
    if (isOpen && participants) {
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

      const teamA = mappedPlayers.filter((p) => p.team === "A");
      const teamB = mappedPlayers.filter((p) => p.team === "B");
      const unassigned = mappedPlayers.filter((p) => !p.team);

      setItems({
        unassigned,
        teamA,
        teamB,
      });
    }
  }, [isOpen, participants]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px drag distance before firing
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string) || (over.id as string);

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      // Reordering within the same container
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
      // Moving between containers
      setItems((prev) => {
        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];
        
        const activeIndex = activeItems.findIndex((item) => item.id === active.id);
        const overIndex = over.id in prev 
          ? overItems.length 
          : overItems.findIndex((item) => item.id === over.id);

        const newActiveItems = [...activeItems];
        const [movedItem] = newActiveItems.splice(activeIndex, 1);
        
        // Update the item's team property locally just in case
        const updatedItem = { 
          ...movedItem, 
          team: overContainer === 'teamA' ? 'A' : overContainer === 'teamB' ? 'B' : null 
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
    ? [...items.unassigned, ...items.teamA, ...items.teamB].find(p => p.id === activeId)
    : null;

  // AUTO Balance Logic (OVR + Position)
  const handleAutoBalance = () => {
    const allPlayers = [...items.unassigned, ...items.teamA, ...items.teamB];
    
    // Sort all players by OVR descending
    const sortedPlayers = [...allPlayers].sort((a, b) => b.overall - a.overall);
    
    const newTeamA: Player[] = [];
    const newTeamB: Player[] = [];
    let sumA = 0;
    let sumB = 0;

    // Categorize by position
    const positionGroups: Record<string, Player[]> = {};
    sortedPlayers.forEach(p => {
      const pos = p.position || "CAM";
      let cat = "MID";
      if (["ST", "CF", "LW", "RW"].includes(pos)) cat = "ATT";
      if (["CB", "LB", "RB", "LWB", "RWB"].includes(pos)) cat = "DEF";
      if (pos === "GK") cat = "GK";
      
      if (!positionGroups[cat]) positionGroups[cat] = [];
      positionGroups[cat].push(p);
    });

    // Distribute each category balancing the overall score
    ["GK", "DEF", "MID", "ATT"].forEach(cat => {
      if (!positionGroups[cat]) return;
      positionGroups[cat].forEach(player => {
        if (sumA <= sumB) {
          newTeamA.push({ ...player, team: "A" });
          sumA += player.overall;
        } else {
          newTeamB.push({ ...player, team: "B" });
          sumB += player.overall;
        }
      });
    });

    setItems({
      unassigned: [],
      teamA: newTeamA,
      teamB: newTeamB,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const teamAIds = items.teamA.map(p => p.id);
      const teamBIds = items.teamB.map(p => p.id);
      await onSaveTeams(teamAIds, teamBIds);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-5xl h-[90vh] bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A28B52] to-[#7A683C] flex items-center justify-center shadow-lg">
                  <Users className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white tracking-wide">TEAM BUILDER</h2>
                  <p className="text-sm text-[#A0A0A0]">Assign players to Team A and Team B</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Mode Toggle */}
                <div className="flex bg-[#1A1A1A] p-1 rounded-lg border border-[#2A2A2A]">
                  <button
                    onClick={() => setMode("AUTO")}
                    className={`px-4 py-1.5 text-xs font-bold tracking-wider rounded-md transition-all ${
                      mode === "AUTO" ? "bg-[#A28B52] text-white shadow-md" : "text-[#A0A0A0] hover:text-white"
                    }`}
                  >
                    AUTO
                  </button>
                  <button
                    onClick={() => setMode("MANUAL")}
                    className={`px-4 py-1.5 text-xs font-bold tracking-wider rounded-md transition-all ${
                      mode === "MANUAL" ? "bg-[#A28B52] text-white shadow-md" : "text-[#A0A0A0] hover:text-white"
                    }`}
                  >
                    MANUAL
                  </button>
                </div>

                <button onClick={onClose} className="p-2 text-[#A0A0A0] hover:text-white bg-[#1A1A1A] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-hidden p-4 flex flex-col">
              {mode === "AUTO" && (
                <div className="bg-gradient-to-br from-[#A28B52]/10 to-transparent border border-[#A28B52]/20 rounded-xl p-4 mb-4 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-[#E5DCC5] font-bold">Auto-Balance Engine</h3>
                    <p className="text-sm text-[#A0A0A0]">Our AI will balance teams based on Overall Rating (OVR) and Positions.</p>
                  </div>
                  <button
                    onClick={handleAutoBalance}
                    className="flex items-center gap-2 px-6 py-2 bg-[#A28B52] hover:bg-[#8A7542] text-white rounded-lg font-bold transition-colors shadow-lg"
                  >
                    <RefreshCw size={18} />
                    GENERATE TEAMS
                  </button>
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
                  <DroppableColumn id="unassigned" title="UNASSIGNED" players={items.unassigned} />
                  <DroppableColumn id="teamA" title="TEAM A" players={items.teamA} />
                  <DroppableColumn id="teamB" title="TEAM B" players={items.teamB} />
                </div>

                <DragOverlay>
                  {activePlayer ? <PlayerCardOverlay player={activePlayer} /> : null}
                </DragOverlay>
              </DndContext>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2A2A2A] bg-[#111] flex justify-end shrink-0">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#A28B52] to-[#8A7542] hover:from-[#B39B5A] hover:to-[#9B854A] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#A28B52]/20 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                SAVE TEAMS
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
