from typing import Dict, Any

# Starter stats based on user spec
STARTER_STATS = {
    "ST": {"pace": 55.0, "shooting": 55.0, "passing": 40.0, "dribbling": 50.0, "defending": 25.0, "physical": 45.0, "gkDiving": 10.0, "gkHandling": 10.0, "gkKicking": 10.0, "gkReflexes": 10.0, "gkPositioning": 10.0},
    "CAM": {"pace": 48.0, "shooting": 45.0, "passing": 55.0, "dribbling": 55.0, "defending": 25.0, "physical": 40.0, "gkDiving": 10.0, "gkHandling": 10.0, "gkKicking": 10.0, "gkReflexes": 10.0, "gkPositioning": 10.0},
    "LW": {"pace": 58.0, "shooting": 45.0, "passing": 45.0, "dribbling": 55.0, "defending": 22.0, "physical": 40.0, "gkDiving": 10.0, "gkHandling": 10.0, "gkKicking": 10.0, "gkReflexes": 10.0, "gkPositioning": 10.0},
    "RW": {"pace": 58.0, "shooting": 45.0, "passing": 45.0, "dribbling": 55.0, "defending": 22.0, "physical": 40.0, "gkDiving": 10.0, "gkHandling": 10.0, "gkKicking": 10.0, "gkReflexes": 10.0, "gkPositioning": 10.0},
    "CM": {"pace": 45.0, "shooting": 40.0, "passing": 55.0, "dribbling": 50.0, "defending": 45.0, "physical": 48.0, "gkDiving": 10.0, "gkHandling": 10.0, "gkKicking": 10.0, "gkReflexes": 10.0, "gkPositioning": 10.0},
    "CDM": {"pace": 42.0, "shooting": 30.0, "passing": 52.0, "dribbling": 42.0, "defending": 58.0, "physical": 55.0, "gkDiving": 10.0, "gkHandling": 10.0, "gkKicking": 10.0, "gkReflexes": 10.0, "gkPositioning": 10.0},
    "LB": {"pace": 50.0, "shooting": 28.0, "passing": 48.0, "dribbling": 42.0, "defending": 55.0, "physical": 50.0, "gkDiving": 10.0, "gkHandling": 10.0, "gkKicking": 10.0, "gkReflexes": 10.0, "gkPositioning": 10.0},
    "RB": {"pace": 50.0, "shooting": 28.0, "passing": 48.0, "dribbling": 42.0, "defending": 55.0, "physical": 50.0, "gkDiving": 10.0, "gkHandling": 10.0, "gkKicking": 10.0, "gkReflexes": 10.0, "gkPositioning": 10.0},
    "CB": {"pace": 40.0, "shooting": 25.0, "passing": 42.0, "dribbling": 35.0, "defending": 60.0, "physical": 58.0, "gkDiving": 10.0, "gkHandling": 10.0, "gkKicking": 10.0, "gkReflexes": 10.0, "gkPositioning": 10.0},
    "GK": {"pace": 35.0, "shooting": 20.0, "passing": 38.0, "dribbling": 30.0, "defending": 40.0, "physical": 45.0, "gkDiving": 50.0, "gkHandling": 50.0, "gkKicking": 45.0, "gkReflexes": 50.0, "gkPositioning": 50.0},
    "DEFAULT": {"pace": 45.0, "shooting": 35.0, "passing": 45.0, "dribbling": 40.0, "defending": 45.0, "physical": 45.0, "gkDiving": 10.0, "gkHandling": 10.0, "gkKicking": 10.0, "gkReflexes": 10.0, "gkPositioning": 10.0},
}

PLAYSTYLE_MODIFIERS = {
    "Speedster": {"pace": 10.0, "dribbling": 5.0},
    "Playmaker": {"passing": 10.0, "dribbling": 5.0},
    "Poacher": {"shooting": 10.0, "pace": 5.0},
    "Box-to-Box": {"physical": 8.0, "defending": 5.0, "passing": 3.0}
}

def get_initial_stats(position: str, play_style: str) -> dict:
    """Get the dynamic initial starting stats based on position and play style."""
    pos = position.upper() if position else "DEFAULT"
    if pos not in STARTER_STATS:
        pos = "DEFAULT"
        
    base = STARTER_STATS[pos].copy()
    
    if play_style and play_style in PLAYSTYLE_MODIFIERS:
        for stat, val in PLAYSTYLE_MODIFIERS[play_style].items():
            if stat in base:
                base[stat] += val
            
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
