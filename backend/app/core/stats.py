from typing import Dict, Any

# Starter stats based on user spec + extrapolated for missing positions
STARTER_STATS = {
    "ST": {"pace": 60.0, "shooting": 62.0, "passing": 50.0, "dribbling": 58.0, "defending": 35.0, "physical": 48.0, "gk": 20.0},
    "CF": {"pace": 58.0, "shooting": 60.0, "passing": 55.0, "dribbling": 60.0, "defending": 35.0, "physical": 45.0, "gk": 20.0},
    "LWF": {"pace": 65.0, "shooting": 55.0, "passing": 55.0, "dribbling": 62.0, "defending": 35.0, "physical": 40.0, "gk": 20.0},
    "RWF": {"pace": 65.0, "shooting": 55.0, "passing": 55.0, "dribbling": 62.0, "defending": 35.0, "physical": 40.0, "gk": 20.0},
    "CAM": {"pace": 55.0, "shooting": 50.0, "passing": 65.0, "dribbling": 62.0, "defending": 42.0, "physical": 45.0, "gk": 20.0},
    "CM": {"pace": 52.0, "shooting": 45.0, "passing": 60.0, "dribbling": 58.0, "defending": 55.0, "physical": 55.0, "gk": 20.0},
    "CDM": {"pace": 50.0, "shooting": 35.0, "passing": 55.0, "dribbling": 50.0, "defending": 62.0, "physical": 62.0, "gk": 20.0},
    "LMF": {"pace": 62.0, "shooting": 45.0, "passing": 60.0, "dribbling": 60.0, "defending": 45.0, "physical": 45.0, "gk": 20.0},
    "RMF": {"pace": 62.0, "shooting": 45.0, "passing": 60.0, "dribbling": 60.0, "defending": 45.0, "physical": 45.0, "gk": 20.0},
    "LB": {"pace": 62.0, "shooting": 35.0, "passing": 50.0, "dribbling": 52.0, "defending": 60.0, "physical": 55.0, "gk": 20.0},
    "RB": {"pace": 62.0, "shooting": 35.0, "passing": 50.0, "dribbling": 52.0, "defending": 60.0, "physical": 55.0, "gk": 20.0},
    "CB": {"pace": 42.0, "shooting": 30.0, "passing": 48.0, "dribbling": 35.0, "defending": 65.0, "physical": 60.0, "gk": 20.0},
    "GK": {"pace": 40.0, "shooting": 20.0, "passing": 40.0, "dribbling": 20.0, "defending": 30.0, "physical": 50.0, "gk": 59.0}, # GK averages (60+62+58+55+61)/5 = 59.2
    "DEFAULT": {"pace": 50.0, "shooting": 50.0, "passing": 50.0, "dribbling": 50.0, "defending": 50.0, "physical": 50.0, "gk": 50.0},
}

# OVR Weights per position (Extrapolated for missing ones)
OVR_WEIGHTS = {
    "ST": {"pace": 0.22, "shooting": 0.30, "passing": 0.12, "dribbling": 0.20, "defending": 0.04, "physical": 0.12},
    "CF": {"pace": 0.20, "shooting": 0.25, "passing": 0.15, "dribbling": 0.25, "defending": 0.05, "physical": 0.10},
    "LWF": {"pace": 0.25, "shooting": 0.20, "passing": 0.15, "dribbling": 0.28, "defending": 0.04, "physical": 0.08},
    "RWF": {"pace": 0.25, "shooting": 0.20, "passing": 0.15, "dribbling": 0.28, "defending": 0.04, "physical": 0.08},
    "CAM": {"pace": 0.15, "shooting": 0.15, "passing": 0.28, "dribbling": 0.25, "defending": 0.07, "physical": 0.10},
    "CM": {"pace": 0.12, "shooting": 0.10, "passing": 0.25, "dribbling": 0.18, "defending": 0.18, "physical": 0.17},
    "CDM": {"pace": 0.10, "shooting": 0.05, "passing": 0.20, "dribbling": 0.10, "defending": 0.30, "physical": 0.25},
    "LMF": {"pace": 0.22, "shooting": 0.10, "passing": 0.25, "dribbling": 0.23, "defending": 0.10, "physical": 0.10},
    "RMF": {"pace": 0.22, "shooting": 0.10, "passing": 0.25, "dribbling": 0.23, "defending": 0.10, "physical": 0.10},
    "LB": {"pace": 0.22, "shooting": 0.05, "passing": 0.15, "dribbling": 0.12, "defending": 0.28, "physical": 0.18},
    "RB": {"pace": 0.22, "shooting": 0.05, "passing": 0.15, "dribbling": 0.12, "defending": 0.28, "physical": 0.18},
    "CB": {"pace": 0.08, "shooting": 0.02, "passing": 0.10, "dribbling": 0.05, "defending": 0.45, "physical": 0.30},
    "GK": {"gk": 0.85, "physical": 0.05, "pace": 0.05, "passing": 0.05},
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
