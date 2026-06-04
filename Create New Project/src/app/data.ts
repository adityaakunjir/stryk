import type { Player } from "./components/player-card";

export const PLAYER: Player = {
  name: "Arjun Mehra",
  username: "arjun.10",
  position: "CAM",
  ovr: 87,
  style: "Playmaker",
  foot: "L",
  nation: "IND",
  matches: 142,
  stats: { PAC: 84, SHO: 82, PAS: 91, DRI: 89, DEF: 54, PHY: 71 },
  avatarUrl:
    "https://images.unsplash.com/photo-1655110189073-6996d02e7071?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
};

export const FRIENDS = [
  { name: "Vikram", handle: "vik.7", ovr: 82, online: true, pos: "ST", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Rohan", handle: "rohan.k", ovr: 79, online: true, pos: "CM", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Kabir", handle: "kabir.gk", ovr: 84, online: false, pos: "GK", avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Dev", handle: "dev.cb", ovr: 76, online: true, pos: "CB", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Ishaan", handle: "ish.lw", ovr: 81, online: true, pos: "LW", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
  { name: "Yash", handle: "yashy", ovr: 74, online: false, pos: "RB", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200" },
];

export const LOBBIES = [
  {
    name: "Friday Night League",
    venue: "Turf Yard · Indiranagar",
    time: "Today · 9:00 PM",
    host: "Vikram",
    going: 8,
    total: 10,
    live: true,
  },
  {
    name: "Sunday Sweat 7s",
    venue: "Goalpoint Arena · HSR",
    time: "Jun 7 · 6:30 PM",
    host: "Kabir",
    going: 6,
    total: 14,
    live: false,
  },
  {
    name: "Corporate Cup Qualifier",
    venue: "Decathlon Turf · WF",
    time: "Jun 9 · 8:00 PM",
    host: "Rohan",
    going: 11,
    total: 12,
    live: false,
  },
];
