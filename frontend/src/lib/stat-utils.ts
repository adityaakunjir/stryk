export interface StatInput {
  position: string;
  playStyle: string;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  tackles?: number;
  saves?: number;
  intercepts?: number;
}

export function calculateStats(player: StatInput) {
  // Base stats start at 50
  let pac = 50;
  let sho = 50;
  let pas = 50;
  let dri = 50;
  let def = 50;
  let phy = 50;

  const pos = player.position;
  const style = player.playStyle;

  // Position Modifiers
  if (pos === "ST" || pos === "LW" || pos === "RW") {
    sho += 15;
    pac += 5;
    dri += 5;
    pas -= 5;
    def -= 20;
  } else if (pos === "CM" || pos === "CDM" || pos === "LM" || pos === "RM" || pos === "CAM" || pos === "CM_R") {
    pas += 10;
    dri += 10;
    pac += 2;
    def -= 5;
  } else if (pos === "CB" || pos === "LB" || pos === "RB" || pos === "CB_R") {
    def += 20;
    phy += 15;
    sho -= 15;
    dri -= 10;
  } else if (pos === "GK") {
    def += 25;
    phy += 10;
    pac -= 10;
    sho -= 25;
    dri -= 15;
    pas += 5;
  }

  // Play Style Modifiers
  switch (style) {
    case "Speedster":
      pac += 10;
      dri += 5;
      break;
    case "Playmaker":
      pas += 10;
      dri += 5;
      break;
    case "Poacher":
      sho += 10;
      pac += 5;
      break;
    case "Box-to-Box":
      phy += 8;
      def += 5;
      pas += 3;
      break;
  }

  // Progression Growth
  const matches = player.matchesPlayed ?? 0;
  const goals = player.goals ?? 0;
  const assists = player.assists ?? 0;
  const tackles = player.tackles ?? 0;
  const saves = player.saves ?? 0;
  const intercepts = player.intercepts ?? 0;

  pac += Math.floor(matches * 0.4);
  sho += Math.floor(goals * 0.5 + matches * 0.1);
  pas += Math.floor(assists * 0.5 + matches * 0.1);
  dri += Math.floor(matches * 0.2 + goals * 0.1 + assists * 0.1);
  def += Math.floor((tackles + intercepts) * 0.4 + matches * 0.1);
  phy += Math.floor(matches * 0.3 + (tackles + saves) * 0.1);

  const clamp = (val: number) => Math.min(99, Math.max(30, val));

  return [
    { label: "PAC", value: clamp(pac) },
    { label: "SHO", value: clamp(sho) },
    { label: "PAS", value: clamp(pas) },
    { label: "DRI", value: clamp(dri) },
    { label: "DEF", value: clamp(def) },
    { label: "PHY", value: clamp(phy) },
  ];
}

export function calculateOvr(player: StatInput): number {
  const matches = player.matchesPlayed ?? 0;
  const goals = player.goals ?? 0;
  const assists = player.assists ?? 0;
  const tackles = player.tackles ?? 0;
  const saves = player.saves ?? 0;
  const intercepts = player.intercepts ?? 0;

  const levelProgress = matches * 0.5 + goals * 0.2 + assists * 0.2 + tackles * 0.1 + intercepts * 0.1 + saves * 0.1;
  return Math.min(99, Math.max(60, Math.floor(60 + levelProgress)));
}
