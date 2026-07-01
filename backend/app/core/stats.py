from typing import Dict, Any

# Starter stats based on user spec + extrapolated for missing positions
STARTER_STATS = {
    "ST": {"pace": 60.0, "shooting": 62.0, "passing": 50.0, "dribbling": 58.0, "defending": 35.0, "physical": 48.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "CF": {"pace": 58.0, "shooting": 60.0, "passing": 55.0, "dribbling": 60.0, "defending": 35.0, "physical": 45.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "LW": {"pace": 65.0, "shooting": 55.0, "passing": 55.0, "dribbling": 62.0, "defending": 35.0, "physical": 40.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "RW": {"pace": 65.0, "shooting": 55.0, "passing": 55.0, "dribbling": 62.0, "defending": 35.0, "physical": 40.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "CAM": {"pace": 55.0, "shooting": 50.0, "passing": 65.0, "dribbling": 62.0, "defending": 42.0, "physical": 45.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "CM": {"pace": 52.0, "shooting": 45.0, "passing": 60.0, "dribbling": 58.0, "defending": 55.0, "physical": 55.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "CDM": {"pace": 50.0, "shooting": 35.0, "passing": 55.0, "dribbling": 50.0, "defending": 62.0, "physical": 62.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "LM": {"pace": 62.0, "shooting": 45.0, "passing": 60.0, "dribbling": 60.0, "defending": 45.0, "physical": 45.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "RM": {"pace": 62.0, "shooting": 45.0, "passing": 60.0, "dribbling": 60.0, "defending": 45.0, "physical": 45.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "LB": {"pace": 62.0, "shooting": 35.0, "passing": 50.0, "dribbling": 52.0, "defending": 60.0, "physical": 55.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "RB": {"pace": 62.0, "shooting": 35.0, "passing": 50.0, "dribbling": 52.0, "defending": 60.0, "physical": 55.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "CB": {"pace": 42.0, "shooting": 30.0, "passing": 48.0, "dribbling": 35.0, "defending": 65.0, "physical": 60.0, "gkDiving": 20.0, "gkHandling": 20.0, "gkKicking": 20.0, "gkReflexes": 20.0, "gkPositioning": 20.0},
    "GK": {"pace": 40.0, "shooting": 20.0, "passing": 40.0, "dribbling": 20.0, "defending": 30.0, "physical": 50.0, "gkDiving": 60.0, "gkHandling": 58.0, "gkKicking": 55.0, "gkReflexes": 62.0, "gkPositioning": 61.0},
    "DEFAULT": {"pace": 50.0, "shooting": 50.0, "passing": 50.0, "dribbling": 50.0, "defending": 50.0, "physical": 50.0, "gkDiving": 50.0, "gkHandling": 50.0, "gkKicking": 50.0, "gkReflexes": 50.0, "gkPositioning": 50.0},
}

PLAYSTYLE_MODIFIERS = {
    "Speedster": {"pace": 10.0, "dribbling": 5.0},
    "Playmaker": {"passing": 10.0, "dribbling": 5.0},
    "Poacher": {"shooting": 10.0, "pace": 5.0},
    "Box-to-Box": {"physical": 8.0, "defending": 5.0, "passing": 3.0}
}

def get_initial_stats(position: str, play_style: str) -> dict:
    """Get the dynamic initial starting stats based on position and play style, normalized to EXACTLY 60 OVR."""
    pos = position.upper() if position else "DEFAULT"
    if pos not in STARTER_STATS:
        pos = "DEFAULT"
        
    base = STARTER_STATS[pos].copy()
    
    if play_style and play_style in PLAYSTYLE_MODIFIERS:
        for stat, val in PLAYSTYLE_MODIFIERS[play_style].items():
            if stat in base:
                base[stat] += val
                
    # Calculate the raw exact OVR of this modified profile
    weights = OVR_WEIGHTS.get(pos, OVR_WEIGHTS["DEFAULT"])
    raw_ovr = sum(base.get(stat_name, 60.0) * weight for stat_name, weight in weights.items())
    
    # Normalize all stats so the final OVR is exactly 60.0
    if raw_ovr > 0:
        multiplier = 60.0 / raw_ovr
        for stat in base:
            # Rounding to 2 decimal places ensures database accuracy without losing OVR precision
            base[stat] = round(base[stat] * multiplier, 2)
            
    return base

# OVR Weights per position (Extrapolated for missing ones)
OVR_WEIGHTS = {
    "ST": {"pace": 0.22, "shooting": 0.30, "passing": 0.12, "dribbling": 0.20, "defending": 0.04, "physical": 0.12},
    "CF": {"pace": 0.20, "shooting": 0.25, "passing": 0.15, "dribbling": 0.25, "defending": 0.05, "physical": 0.10},
    "LW": {"pace": 0.25, "shooting": 0.20, "passing": 0.15, "dribbling": 0.28, "defending": 0.04, "physical": 0.08},
    "RW": {"pace": 0.25, "shooting": 0.20, "passing": 0.15, "dribbling": 0.28, "defending": 0.04, "physical": 0.08},
    "CAM": {"pace": 0.15, "shooting": 0.15, "passing": 0.28, "dribbling": 0.25, "defending": 0.07, "physical": 0.10},
    "CM": {"pace": 0.12, "shooting": 0.10, "passing": 0.25, "dribbling": 0.18, "defending": 0.18, "physical": 0.17},
    "CDM": {"pace": 0.10, "shooting": 0.05, "passing": 0.20, "dribbling": 0.10, "defending": 0.30, "physical": 0.25},
    "LM": {"pace": 0.22, "shooting": 0.10, "passing": 0.25, "dribbling": 0.23, "defending": 0.10, "physical": 0.10},
    "RM": {"pace": 0.22, "shooting": 0.10, "passing": 0.25, "dribbling": 0.23, "defending": 0.10, "physical": 0.10},
    "LB": {"pace": 0.22, "shooting": 0.05, "passing": 0.15, "dribbling": 0.12, "defending": 0.28, "physical": 0.18},
    "RB": {"pace": 0.22, "shooting": 0.05, "passing": 0.15, "dribbling": 0.12, "defending": 0.28, "physical": 0.18},
    "CB": {"pace": 0.08, "shooting": 0.02, "passing": 0.10, "dribbling": 0.05, "defending": 0.45, "physical": 0.30},
    "GK": {"gkDiving": 0.20, "gkHandling": 0.15, "gkKicking": 0.10, "gkReflexes": 0.20, "gkPositioning": 0.20, "physical": 0.05, "pace": 0.05, "passing": 0.05},
    "DEFAULT": {"pace": 0.17, "shooting": 0.17, "passing": 0.17, "dribbling": 0.16, "defending": 0.16, "physical": 0.17},
}

def calculate_ovr(position: str, stats: Dict[str, float]) -> int:
    """Calculate the overall rating based on position weights."""
    pos = position.upper() if position else "DEFAULT"
    if pos not in OVR_WEIGHTS:
        pos = "DEFAULT"
        
    weights = OVR_WEIGHTS[pos]
    ovr = 0.0
    for stat_name, weight in weights.items():
        ovr += stats.get(stat_name, 60.0) * weight
        
    return min(99, max(1, int(round(ovr))))

def calculate_stat_gain(base_gain: float, current_stat: float) -> float:
    """Calculate the diminishing returns stat gain."""
    # Ensure current_stat doesn't exceed 100 for the formula
    effective_stat = min(current_stat, 99.0)
    gain = base_gain * (1 - (effective_stat / 100.0))
    return max(0.0, gain)

def calculate_match_rating(position: str, stat_dict: Dict[str, Any]) -> float:
    """Calculate a match rating from 1.0 to 10.0 based on raw match stats."""
    base_rating = 6.0
    
    # Common stats
    goals = stat_dict.get("goals", 0)
    assists = stat_dict.get("assists", 0)
    yellows = stat_dict.get("yellowCards", 0)
    reds = stat_dict.get("redCards", 0)
    own_goals = stat_dict.get("ownGoals", 0)
    no_show = stat_dict.get("noShow", False)
    clean_sheet = stat_dict.get("cleanSheet", False)
    
    if no_show:
        return 1.0
        
    rating = base_rating
    
    # Penalties
    rating -= yellows * 0.5
    rating -= reds * 2.0
    rating -= own_goals * 1.5
    
    # Base contributions
    rating += goals * 1.2
    rating += assists * 0.8
    
    # Advanced stats bonuses
    tackles = stat_dict.get("tackles", 0)
    interceptions = stat_dict.get("interceptions", 0)
    saves = stat_dict.get("saves", 0)
    key_passes = stat_dict.get("keyPasses", 0)
    
    rating += key_passes * 0.1
    
    pos = position.upper() if position else "DEFAULT"
    
    # Positional adjustments
    if pos in ["CB", "LB", "RB", "LWB", "RWB"]:
        rating += tackles * 0.3
        rating += interceptions * 0.2
        if clean_sheet:
            rating += 1.5
    elif pos in ["CDM", "CM"]:
        rating += tackles * 0.2
        rating += interceptions * 0.2
    elif pos == "GK":
        rating += saves * 0.4
        if clean_sheet:
            rating += 2.0
            
    # Cap between 1.0 and 10.0
    return min(10.0, max(1.0, round(rating, 1)))
