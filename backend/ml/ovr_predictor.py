"""
ovr_predictor.py
────────────────
Model-serving layer for the STRYK position-aware OVR prediction model.

At import time this module attempts to load:
  - backend/ml/ovr_model.joblib          (trained Ridge / RF model)
  - backend/ml/position_encoder.joblib   (OneHotEncoder for position)
  - backend/ml/feature_importance.json   (importance weights for explain / UI)

If any file is missing it falls back silently to the hardcoded formula already
used in app/core/stats.py so the app never breaks due to missing model files.

Public API
──────────
    predict_ovr(position, pace, shooting, passing, dribbling, defending,
                physical, gk_diving, gk_handling, gk_kicking, gk_reflexes,
                gk_positioning) -> int

    get_position_weights(position) -> dict[str, float]

    explain_ovr(position, stats_dict) -> str
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

# ── file paths ─────────────────────────────────────────────────────────────────
_HERE         = os.path.dirname(__file__)
_MODEL_PATH   = os.path.join(_HERE, "ovr_model.joblib")
_ENCODER_PATH = os.path.join(_HERE, "position_encoder.joblib")
_FI_PATH      = os.path.join(_HERE, "feature_importance.json")

# ── stat column order (must match training exactly) ────────────────────────────
_BASE_STATS = [
    "pace", "shooting", "passing", "dribbling", "defending", "physical",
    "gkDiving", "gkHandling", "gkKicking", "gkReflexes", "gkPositioning",
]
_ALL_POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"]

# ── hardcoded fallback weights (from app/core/stats.py OVR_WEIGHTS) ────────────
_FALLBACK_WEIGHTS: dict[str, dict[str, float]] = {
    "ST":  {"pace": 0.22, "shooting": 0.30, "passing": 0.12, "dribbling": 0.20, "defending": 0.04, "physical": 0.12},
    "CF":  {"pace": 0.20, "shooting": 0.25, "passing": 0.15, "dribbling": 0.25, "defending": 0.05, "physical": 0.10},
    "LW":  {"pace": 0.25, "shooting": 0.20, "passing": 0.15, "dribbling": 0.28, "defending": 0.04, "physical": 0.08},
    "RW":  {"pace": 0.25, "shooting": 0.20, "passing": 0.15, "dribbling": 0.28, "defending": 0.04, "physical": 0.08},
    "CAM": {"pace": 0.15, "shooting": 0.15, "passing": 0.28, "dribbling": 0.25, "defending": 0.07, "physical": 0.10},
    "CM":  {"pace": 0.12, "shooting": 0.10, "passing": 0.25, "dribbling": 0.18, "defending": 0.18, "physical": 0.17},
    "CDM": {"pace": 0.10, "shooting": 0.05, "passing": 0.20, "dribbling": 0.10, "defending": 0.30, "physical": 0.25},
    "LB":  {"pace": 0.22, "shooting": 0.05, "passing": 0.15, "dribbling": 0.12, "defending": 0.28, "physical": 0.18},
    "RB":  {"pace": 0.22, "shooting": 0.05, "passing": 0.15, "dribbling": 0.12, "defending": 0.28, "physical": 0.18},
    "CB":  {"pace": 0.08, "shooting": 0.02, "passing": 0.10, "dribbling": 0.05, "defending": 0.45, "physical": 0.30},
    "GK":  {"gkDiving": 0.20, "gkHandling": 0.15, "gkKicking": 0.10,
             "gkReflexes": 0.20, "gkPositioning": 0.20,
             "physical": 0.05, "pace": 0.05, "passing": 0.05},
    "DEFAULT": {"pace": 0.17, "shooting": 0.17, "passing": 0.17,
                "dribbling": 0.16, "defending": 0.16, "physical": 0.17},
}

# ── canonical position importance weights (training spec) ──────────────────────
# Ground-truth weights from the training data generator. Used exclusively for
# explain_ovr / improvement suggestions — NOT for OVR prediction.
# GK stats are absent for all non-GK positions (implicit 0 importance).
_SPEC_RAW: dict[str, dict[str, float]] = {
    "GK":  {"pace": 0.10, "shooting": 0.05, "passing": 0.10, "dribbling": 0.05,
             "defending": 0.20, "physical": 0.30,
             "gkDiving": 0.85, "gkHandling": 0.85, "gkKicking": 0.85,
             "gkReflexes": 0.85, "gkPositioning": 0.85},
    "CB":  {"pace": 0.50, "shooting": 0.05, "passing": 0.30, "dribbling": 0.10,
             "defending": 0.90, "physical": 0.80},
    "LB":  {"pace": 0.75, "shooting": 0.10, "passing": 0.50, "dribbling": 0.40,
             "defending": 0.70, "physical": 0.60},
    "RB":  {"pace": 0.75, "shooting": 0.10, "passing": 0.50, "dribbling": 0.40,
             "defending": 0.70, "physical": 0.60},
    "CDM": {"pace": 0.40, "shooting": 0.15, "passing": 0.70, "dribbling": 0.30,
             "defending": 0.80, "physical": 0.75},
    "CM":  {"pace": 0.50, "shooting": 0.30, "passing": 0.80, "dribbling": 0.70,
             "defending": 0.50, "physical": 0.60},
    "CAM": {"pace": 0.60, "shooting": 0.60, "passing": 0.85, "dribbling": 0.85,
             "defending": 0.10, "physical": 0.30},
    "LW":  {"pace": 0.90, "shooting": 0.65, "passing": 0.60, "dribbling": 0.85,
             "defending": 0.10, "physical": 0.30},
    "RW":  {"pace": 0.90, "shooting": 0.65, "passing": 0.60, "dribbling": 0.85,
             "defending": 0.10, "physical": 0.30},
    "ST":  {"pace": 0.80, "shooting": 0.90, "passing": 0.30, "dribbling": 0.60,
             "defending": 0.05, "physical": 0.70},
    "CF":  {"pace": 0.75, "shooting": 0.85, "passing": 0.40, "dribbling": 0.65,
             "defending": 0.05, "physical": 0.65},
}


def _spec_weights(pos: str) -> dict[str, float]:
    """Return normalised training-spec weights for `pos`, sorted descending."""
    raw = _SPEC_RAW.get(pos) or _FALLBACK_WEIGHTS.get("DEFAULT", {})
    total = sum(raw.values()) or 1.0
    return {k: round(v / total, 4)
            for k, v in sorted(raw.items(), key=lambda x: x[1], reverse=True)}


# ── friendly display names ──────────────────────────────────────────────────────
_DISPLAY_NAMES: dict[str, str] = {
    "pace":           "Pace",
    "shooting":       "Shooting",
    "passing":        "Passing",
    "dribbling":      "Dribbling",
    "defending":      "Defending",
    "physical":       "Physical",
    "gkDiving":       "GK Diving",
    "gkHandling":     "GK Handling",
    "gkKicking":      "GK Kicking",
    "gkReflexes":     "GK Reflexes",
    "gkPositioning":  "GK Positioning",
}


# ── model loading (runs once at import time) ───────────────────────────────────
_model   = None
_encoder = None
_fi_data: dict[str, Any] = {}
_model_loaded = False


def _load_artifacts() -> bool:
    """Try to load model + encoder + feature importance. Returns True on success."""
    global _model, _encoder, _fi_data, _model_loaded
    if _model_loaded:
        return _model is not None

    missing = [p for p in (_MODEL_PATH, _ENCODER_PATH) if not os.path.exists(p)]
    if missing:
        log.warning(
            "[ovr_predictor] Model files not found: %s — "
            "falling back to hardcoded OVR formula.",
            missing,
        )
        _model_loaded = True
        return False

    try:
        import joblib  # imported here so the module loads even without joblib
        _model   = joblib.load(_MODEL_PATH)
        _encoder = joblib.load(_ENCODER_PATH)
        log.info("[ovr_predictor] Loaded ML model from %s", _MODEL_PATH)
    except Exception as exc:
        log.warning("[ovr_predictor] Failed to load model: %s — using fallback.", exc)
        _model = _encoder = None
        _model_loaded = True
        return False

    if os.path.exists(_FI_PATH):
        try:
            with open(_FI_PATH) as f:
                _fi_data = json.load(f)
        except Exception as exc:
            log.warning("[ovr_predictor] Could not load feature_importance.json: %s", exc)

    _model_loaded = True
    return True


_load_artifacts()   # eager load on import


# ── internal helpers ──────────────────────────────────────────────────────────

def _normalise_position(position: str) -> str:
    """Map user-entered position to one the encoder knows; fall back to nearest."""
    pos = (position or "").upper().strip()
    if pos in _ALL_POSITIONS:
        return pos
    # common aliases
    _aliases = {
        "GKP": "GK", "GOALKEEPER": "GK",
        "SW": "CB", "CB": "CB",
        "LWB": "LB", "RWB": "RB",
        "DM": "CDM", "AM": "CAM",
        "CF": "ST", "SS": "ST", "FW": "ST",
        "LM": "LW", "RM": "RW",
        "MF": "CM", "WG": "LW"
    }
    if pos in _aliases:
        return _aliases[pos]
    # fallback: most common position
    return "CM"


def _build_feature_vector(pos_enc: np.ndarray, stats: np.ndarray) -> np.ndarray:
    """Assembles the 131-feature vector: [one-hot | base_stats | interactions]."""
    interactions = np.hstack(
        [pos_enc[:, [i]] * stats for i in range(pos_enc.shape[1])]
    )
    return np.hstack([pos_enc, stats, interactions])


def _fallback_ovr(position: str, stats: dict[str, float]) -> int:
    """Hardcoded formula identical to app/core/stats.py:calculate_ovr."""
    pos = _normalise_position(position)
    weights = _FALLBACK_WEIGHTS.get(pos, _FALLBACK_WEIGHTS["DEFAULT"])
    ovr = sum(stats.get(k, 60.0) * w for k, w in weights.items())
    return int(min(99, max(40, round(ovr))))


# ── public API ────────────────────────────────────────────────────────────────

def predict_ovr(
    position: str,
    pace: float,
    shooting: float,
    passing: float,
    dribbling: float,
    defending: float,
    physical: float,
    gk_diving: float       = 20.0,
    gk_handling: float     = 20.0,
    gk_kicking: float      = 20.0,
    gk_reflexes: float     = 20.0,
    gk_positioning: float  = 20.0,
) -> int:
    """
    Predict a player's OVR using the trained ML model.

    Returns an integer in [40, 99].  Falls back to the legacy formula if
    model files are unavailable.
    """
    stats_dict = {
        "pace": pace, "shooting": shooting, "passing": passing,
        "dribbling": dribbling, "defending": defending, "physical": physical,
        "gkDiving": gk_diving, "gkHandling": gk_handling,
        "gkKicking": gk_kicking, "gkReflexes": gk_reflexes,
        "gkPositioning": gk_positioning,
    }

    if _model is None or _encoder is None:
        return _fallback_ovr(position, stats_dict)

    pos = _normalise_position(position)

    # --- encode position (1 row) ---
    try:
        pos_enc = _encoder.transform(
            pd.DataFrame([[pos]], columns=["position"])
        )  # (1, n_positions)
        if hasattr(pos_enc, "toarray"):
            pos_enc = pos_enc.toarray()
    except Exception as exc:
        log.warning("[ovr_predictor] Encoding failed (%s), using fallback.", exc)
        return _fallback_ovr(position, stats_dict)

    # --- assemble stat vector in training order ---
    stats_arr = np.array(
        [[stats_dict[k] for k in _BASE_STATS]],
        dtype=np.float64,
    )  # (1, 11)

    # --- build full feature vector ---
    X = _build_feature_vector(pos_enc, stats_arr)   # (1, 131)

    # --- predict and sanitise ---
    try:
        raw = float(_model.predict(X)[0])
    except Exception as exc:
        log.warning("[ovr_predictor] Prediction failed (%s), using fallback.", exc)
        return _fallback_ovr(position, stats_dict)

    ovr = int(round(float(np.clip(raw, 40.0, 99.0))))
    return ovr


def get_position_weights(position: str) -> dict[str, float]:
    """
    Return a dict mapping stat names to their relative importance for `position`.

    Prefers the trained model's interaction coefficients (Ridge) or feature
    importances (RF).  Falls back to the hardcoded weight table.

    The returned values are normalised so they sum to 1.0 for easy display.
    """
    pos = _normalise_position(position)

    # --- try reading from feature_importance.json ---
    if _fi_data:
        prod_type = _fi_data.get("production_model", "Ridge")
        if prod_type == "Ridge":
            coefs: dict[str, float] = _fi_data.get("ridge_coefficients", {})
        else:
            coefs = _fi_data.get("random_forest_importances", {})

        # extract position-specific interaction features: "{pos}_{stat}"
        prefix = f"{pos}_"
        pos_weights: dict[str, float] = {}
        for feat, val in coefs.items():
            if feat.startswith(prefix):
                stat = feat[len(prefix):]
                if stat in _BASE_STATS:
                    pos_weights[stat] = abs(float(val))

        # if we found meaningful interaction features, normalise and return
        total = sum(pos_weights.values())
        if pos_weights and total > 0:
            return {k: round(v / total, 4) for k, v in
                    sorted(pos_weights.items(), key=lambda x: x[1], reverse=True)}

    # --- fallback to hardcoded weights ---
    raw = _FALLBACK_WEIGHTS.get(pos, _FALLBACK_WEIGHTS["DEFAULT"]).copy()
    total = sum(abs(v) for v in raw.values())
    if total > 0:
        return {k: round(abs(v) / total, 4)
                for k, v in sorted(raw.items(), key=lambda x: abs(x[1]), reverse=True)}
    return raw


def explain_ovr(position: str, stats_dict: dict[str, float]) -> str:
    """
    Generate a human-readable OVR explanation for a player.

    Example output:
      "Your OVR is driven primarily by your Passing (85) and Dribbling (78).
       Improve your Shooting (52) to unlock significant OVR gains."

    Parameters
    ----------
    position   : player's position string (e.g. "ST", "GK")
    stats_dict : dict mapping stat names to current values, e.g.
                 {"pace": 72, "shooting": 65, ...}
    """
    pos = _normalise_position(position)
    # Use training-spec weights for explanation: these are the ground-truth
    # importance values and correctly assign ~0 weight to Defending for ST,
    # or GK stats for non-GK positions, etc.
    weights = _spec_weights(pos)

    # Build (weight, current_value) for every stat with a known weight
    relevant = {
        stat: (weights.get(stat, 0.0), stats_dict.get(stat, 60.0))
        for stat in weights
    }

    if not relevant:
        return "Keep improving all your stats to raise your OVR."

    # Sort by weight descending → top drivers
    by_weight = sorted(relevant.items(), key=lambda x: x[1][0], reverse=True)

    # Top 2 drivers (high weight)
    top_drivers = [
        (stat, val)
        for stat, (weight, val) in by_weight
        if weight > 0
    ][:2]

    # Improvement suggestion:
    #   improvement_delta = position_weight × (70 - current_value)  if val < 70, else 0
    # This ensures only stats that are BOTH important for the position AND underdeveloped
    # are recommended. A low-weight stat (e.g. Defending for ST) can never win even if
    # its value is very low, because the weight term keeps its delta small.
    improvement_candidates = []
    for stat, (weight, val) in by_weight:
        if val < 70:
            delta = weight * (70.0 - val)
        else:
            delta = 0.0
        if delta > 0:
            improvement_candidates.append((stat, weight, val, delta))

    # Sort by delta descending — highest "weighted gain opportunity" first
    improvement_candidates.sort(key=lambda x: x[3], reverse=True)

    if not top_drivers:
        return "Keep improving all your stats to raise your OVR."

    # --- build sentence ---
    def _fmt(stat: str, val: float) -> str:
        return f"{_DISPLAY_NAMES.get(stat, stat.title())} ({int(round(val))})"

    if len(top_drivers) >= 2:
        driver_str = f"{_fmt(*top_drivers[0])} and {_fmt(*top_drivers[1])}"
    else:
        driver_str = _fmt(*top_drivers[0])

    driver_sentence = f"Your OVR is driven primarily by your {driver_str}."

    if improvement_candidates:
        imp_stat, _, imp_val, imp_delta = improvement_candidates[0]
        improve_sentence = (
            f" Improve your {_DISPLAY_NAMES.get(imp_stat, imp_stat.title())} "
            f"({int(round(imp_val))}) to unlock significant OVR gains."
        )
    else:
        improve_sentence = " You are well-rounded — push all stats higher to keep climbing."

    return driver_sentence + improve_sentence
