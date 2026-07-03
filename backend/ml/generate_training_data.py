"""
generate_training_data.py
─────────────────────────
Generates 5,000 synthetic football players with position-realistic stat
distributions and a position-aware OVR label. Output is written to
backend/ml/training_data.csv.

Run directly:
    python backend/ml/generate_training_data.py
"""

import os
import numpy as np
import pandas as pd

# ── reproducibility ────────────────────────────────────────────────────────────
SEED = 42
rng = np.random.default_rng(SEED)

N_PLAYERS = 5000

# ── position weight profiles ──────────────────────────────────────────────────
# Keys: pace, shooting, passing, dribbling, defending, physical,
#       gkDiving, gkHandling, gkKicking, gkReflexes, gkPositioning
POSITION_WEIGHTS = {
    "GK": {
        "pace": 0.10, "shooting": 0.05, "passing": 0.10,
        "dribbling": 0.05, "defending": 0.20, "physical": 0.30,
        "gkDiving": 0.85, "gkHandling": 0.85, "gkKicking": 0.85,
        "gkReflexes": 0.85, "gkPositioning": 0.85,
    },
    "CB": {
        "pace": 0.50, "shooting": 0.05, "passing": 0.30,
        "dribbling": 0.10, "defending": 0.90, "physical": 0.80,
        "gkDiving": 0.0, "gkHandling": 0.0, "gkKicking": 0.0,
        "gkReflexes": 0.0, "gkPositioning": 0.0,
    },
    "LB": {
        "pace": 0.75, "shooting": 0.10, "passing": 0.50,
        "dribbling": 0.40, "defending": 0.70, "physical": 0.60,
        "gkDiving": 0.0, "gkHandling": 0.0, "gkKicking": 0.0,
        "gkReflexes": 0.0, "gkPositioning": 0.0,
    },
    "RB": {
        "pace": 0.75, "shooting": 0.10, "passing": 0.50,
        "dribbling": 0.40, "defending": 0.70, "physical": 0.60,
        "gkDiving": 0.0, "gkHandling": 0.0, "gkKicking": 0.0,
        "gkReflexes": 0.0, "gkPositioning": 0.0,
    },
    "CDM": {
        "pace": 0.40, "shooting": 0.15, "passing": 0.70,
        "dribbling": 0.30, "defending": 0.80, "physical": 0.75,
        "gkDiving": 0.0, "gkHandling": 0.0, "gkKicking": 0.0,
        "gkReflexes": 0.0, "gkPositioning": 0.0,
    },
    "CM": {
        "pace": 0.50, "shooting": 0.30, "passing": 0.80,
        "dribbling": 0.70, "defending": 0.50, "physical": 0.60,
        "gkDiving": 0.0, "gkHandling": 0.0, "gkKicking": 0.0,
        "gkReflexes": 0.0, "gkPositioning": 0.0,
    },
    "CAM": {
        "pace": 0.60, "shooting": 0.60, "passing": 0.85,
        "dribbling": 0.85, "defending": 0.10, "physical": 0.30,
        "gkDiving": 0.0, "gkHandling": 0.0, "gkKicking": 0.0,
        "gkReflexes": 0.0, "gkPositioning": 0.0,
    },
    "LW": {
        "pace": 0.90, "shooting": 0.65, "passing": 0.60,
        "dribbling": 0.85, "defending": 0.10, "physical": 0.30,
        "gkDiving": 0.0, "gkHandling": 0.0, "gkKicking": 0.0,
        "gkReflexes": 0.0, "gkPositioning": 0.0,
    },
    "RW": {
        "pace": 0.90, "shooting": 0.65, "passing": 0.60,
        "dribbling": 0.85, "defending": 0.10, "physical": 0.30,
        "gkDiving": 0.0, "gkHandling": 0.0, "gkKicking": 0.0,
        "gkReflexes": 0.0, "gkPositioning": 0.0,
    },
    "ST": {
        "pace": 0.80, "shooting": 0.90, "passing": 0.30,
        "dribbling": 0.60, "defending": 0.05, "physical": 0.70,
        "gkDiving": 0.0, "gkHandling": 0.0, "gkKicking": 0.0,
        "gkReflexes": 0.0, "gkPositioning": 0.0,
    },
}

# ── per-position stat distributions (mean, std) ────────────────────────────────
# (pace, shooting, passing, dribbling, defending, physical,
#  gkDiving, gkHandling, gkKicking, gkReflexes, gkPositioning)
STAT_KEYS = [
    "pace", "shooting", "passing", "dribbling", "defending", "physical",
    "gkDiving", "gkHandling", "gkKicking", "gkReflexes", "gkPositioning",
]

POSITION_DISTRIBUTIONS = {
    # (mean, std) for each STAT_KEYS entry
    "GK": [
        (45, 10),   # pace
        (22, 8),    # shooting
        (50, 10),   # passing
        (36, 8),    # dribbling
        (38, 10),   # defending
        (63, 10),   # physical
        (73, 11),   # gkDiving
        (70, 11),   # gkHandling
        (66, 11),   # gkKicking
        (73, 11),   # gkReflexes
        (71, 11),   # gkPositioning
    ],
    "CB": [
        (59, 10),   # pace
        (36, 10),   # shooting
        (56, 10),   # passing
        (46, 10),   # dribbling
        (76, 11),   # defending
        (74, 10),   # physical
        (14, 5),    # gkDiving
        (14, 5),    # gkHandling
        (14, 5),    # gkKicking
        (14, 5),    # gkReflexes
        (14, 5),    # gkPositioning
    ],
    "LB": [
        (73, 9),    # pace
        (46, 10),   # shooting
        (66, 10),   # passing
        (62, 10),   # dribbling
        (68, 10),   # defending
        (66, 10),   # physical
        (12, 4),    # gk stats
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
    ],
    "RB": [
        (73, 9),    # pace
        (46, 10),   # shooting
        (66, 10),   # passing
        (62, 10),   # dribbling
        (68, 10),   # defending
        (66, 10),   # physical
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
    ],
    "CDM": [
        (64, 10),   # pace
        (50, 10),   # shooting
        (70, 10),   # passing
        (62, 10),   # dribbling
        (73, 10),   # defending
        (73, 10),   # physical
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
    ],
    "CM": [
        (66, 9),    # pace
        (60, 10),   # shooting
        (74, 10),   # passing
        (70, 10),   # dribbling
        (60, 10),   # defending
        (65, 10),   # physical
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
    ],
    "CAM": [
        (72, 9),    # pace
        (70, 10),   # shooting
        (78, 10),   # passing
        (77, 9),    # dribbling
        (42, 10),   # defending
        (59, 10),   # physical
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
    ],
    "LW": [
        (81, 8),    # pace
        (71, 10),   # shooting
        (68, 10),   # passing
        (79, 8),    # dribbling
        (40, 10),   # defending
        (60, 10),   # physical
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
    ],
    "RW": [
        (81, 8),    # pace
        (71, 10),   # shooting
        (68, 10),   # passing
        (79, 8),    # dribbling
        (40, 10),   # defending
        (60, 10),   # physical
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
    ],
    "ST": [
        (76, 9),    # pace
        (79, 10),   # shooting
        (58, 10),   # passing
        (69, 10),   # dribbling
        (38, 10),   # defending
        (73, 9),    # physical
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
        (12, 4),
    ],
}


def _sample_stats(position: str, n: int) -> np.ndarray:
    """Sample n players' stats for `position` from position-specific normals.
    Clamps values to [1, 99].
    Returns array of shape (n, len(STAT_KEYS)).
    """
    dist = POSITION_DISTRIBUTIONS[position]
    cols = []
    for mean, std in dist:
        raw = rng.normal(mean, std, n)
        cols.append(np.clip(raw, 1, 99))
    return np.stack(cols, axis=1)  # (n, 11)


def _compute_ovr(stats: np.ndarray, weights: dict) -> np.ndarray:
    """Compute OVR for each player using weighted sum, normalised to 40-99,
    then adds ±3 Gaussian noise and clips to [40, 99].

    stats: (n, 11) — same order as STAT_KEYS
    weights: dict mapping stat_key → weight for this position
    """
    w = np.array([weights[k] for k in STAT_KEYS], dtype=np.float64)   # (11,)
    raw = stats @ w  # (n,)

    # theoretical bounds: stat range [1, 99]
    max_raw = 99.0 * w.sum()
    min_raw = 1.0  * w.sum()

    # normalise to [40, 99]
    ovr = 40.0 + (raw - min_raw) / (max_raw - min_raw + 1e-9) * 59.0

    # add realistic noise — σ=0.75 keeps 99% of values within ±2.25 OVR points
    noise = rng.normal(0, 0.75, len(ovr))
    ovr = ovr + noise

    return np.clip(ovr, 40.0, 99.0)


def generate(n_players: int = N_PLAYERS) -> pd.DataFrame:
    """Generate `n_players` synthetic players across all positions."""
    positions = list(POSITION_DISTRIBUTIONS.keys())

    # distribute players as evenly as possible across positions
    base, rem = divmod(n_players, len(positions))
    counts = [base + (1 if i < rem else 0) for i in range(len(positions))]

    records = []
    for pos, count in zip(positions, counts):
        stats = _sample_stats(pos, count)           # (count, 11)
        ovr = _compute_ovr(stats, POSITION_WEIGHTS[pos])  # (count,)

        for i in range(count):
            row = {"position": pos}
            for j, key in enumerate(STAT_KEYS):
                row[key] = round(float(stats[i, j]), 2)
            row["ovr"] = round(float(ovr[i]), 2)
            records.append(row)

    # shuffle so positions are interleaved
    df = pd.DataFrame(records)
    df = df.sample(frac=1, random_state=SEED).reset_index(drop=True)

    # reorder columns to match spec
    cols = [
        "position", "pace", "shooting", "passing", "dribbling",
        "defending", "physical",
        "gkDiving", "gkHandling", "gkKicking", "gkReflexes", "gkPositioning",
        "ovr",
    ]
    return df[cols]


if __name__ == "__main__":
    out_path = os.path.join(os.path.dirname(__file__), "training_data.csv")
    df = generate()
    df.to_csv(out_path, index=False)
    print(f"[OK]  Generated {len(df)} players -> {out_path}")
    print("\nPosition distribution:")
    print(df["position"].value_counts().to_string())
    print("\nOVR statistics:")
    print(df.groupby("position")["ovr"].describe().round(1).to_string())
