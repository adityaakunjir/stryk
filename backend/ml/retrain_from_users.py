"""
retrain_from_users.py
─────────────────────
Gradually improves the OVR prediction model as real user data accumulates.
Combines real user stats (weighted 3x) with synthetic training data, retrains,
and replaces the current model only if the new MAE is better.

SCHEDULED RETRAINING — This script should be run automatically once per week 
via a cron job or a scheduled task in Railway/Render. Recommended schedule is 
every Sunday at 3am when server load is lowest. To add as a Railway cron job 
set the command to: python backend/ml/retrain_from_users.py. 
Minimum real data threshold is currently set to 5 verified matches per player. 
Raise this to 10 once the user base exceeds 1000 players.
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sqlmodel import select

# Ensure we can import from backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.database import async_session_factory
from app.models.player import User

from ml.train_model import (
    DATA_PATH, MODEL_PATH, ENCODER_PATH, META_PATH, FI_PATH,
    BASE_STATS, ALL_POSITIONS, SEED,
    _get_feature_names, _build_features, _evaluate,
    _ridge_feature_importance, _per_position_mae
)
from ml.ovr_predictor import _normalise_position

async def get_real_user_data() -> pd.DataFrame:
    """Fetch users with >= 5 verified matches from the database."""
    async with async_session_factory() as session:
        result = await session.execute(
            select(User).where(User.matchesPlayed >= 5)
        )
        users = result.scalars().all()
        
    records = []
    for u in users:
        if not u.position or u.overall is None:
            continue
            
        pos = _normalise_position(u.position)
        if pos not in ALL_POSITIONS:
            continue
            
        records.append({
            "position": pos,
            "pace": float(u.pace or 60),
            "shooting": float(u.shooting or 60),
            "passing": float(u.passing or 60),
            "dribbling": float(u.dribbling or 60),
            "defending": float(u.defending or 60),
            "physical": float(u.physical or 60),
            "gkDiving": float(u.gkDiving or 20),
            "gkHandling": float(u.gkHandling or 20),
            "gkKicking": float(u.gkKicking or 20),
            "gkReflexes": float(u.gkReflexes or 20),
            "gkPositioning": float(u.gkPositioning or 20),
            "ovr": float(u.overall)
        })
        
    return pd.DataFrame(records)

def retrain():
    print("=" * 60)
    print(" STRYK OVR Model Retraining (Real + Synthetic Data)")
    print("=" * 60)
    
    # 1. Load synthetic data
    if not os.path.exists(DATA_PATH):
        print("[!] Synthetic data not found. Please run train_model.py first.")
        return
    synth_df = pd.read_csv(DATA_PATH)
    print(f"[data] Loaded {len(synth_df)} synthetic samples.")
    
    # 2. Load real user data
    print("[data] Fetching real user data from database...")
    real_df = asyncio.run(get_real_user_data())
    print(f"[data] Found {len(real_df)} real user samples with >= 5 matches.")
    
    if len(real_df) == 0:
        print("[!] No real data available yet. Skipping retraining.")
        return
        
    # 3. Combine and weight real data 3x
    print("[data] Weighting real data 3x and combining...")
    combined_df = pd.concat([synth_df, real_df, real_df, real_df], ignore_index=True)
    
    # 4. Train model
    encoder = OneHotEncoder(categories=[ALL_POSITIONS], sparse_output=False, handle_unknown="ignore")
    encoder.fit(combined_df[["position"]])
    feature_names = _get_feature_names(encoder)
    
    train_df, test_df = train_test_split(combined_df, test_size=0.2, random_state=SEED)
    X_train = _build_features(train_df, encoder)
    y_train = train_df["ovr"].values
    X_test  = _build_features(test_df, encoder)
    y_test  = test_df["ovr"].values
    
    print("\n[train] Fitting Ridge Regression (alpha=1.0) on combined data...")
    ridge = Ridge(alpha=1.0)
    ridge.fit(X_train, y_train)
    
    metrics = _evaluate(ridge, X_test, y_test, "Retrained Ridge")
    new_mae = metrics["mae"]
    
    # 5. Compare with current model
    if not os.path.exists(META_PATH):
        print(f"[!] Current model metadata not found at {META_PATH}. Cannot compare.")
        return
        
    with open(META_PATH, "r") as f:
        current_meta = json.load(f)
        
    current_mae = current_meta.get("mae", float('inf'))
    print(f"\n[eval] Current Model MAE: {current_mae:.4f}")
    print(f"[eval] New Model MAE:     {new_mae:.4f}")
    
    if new_mae < current_mae:
        print("\n[SUCCESS] New model is better! Saving artifacts...")
        
        # Save model and encoder
        joblib.dump(ridge, MODEL_PATH)
        joblib.dump(encoder, ENCODER_PATH)
        
        # Update metadata
        pos_mae = _per_position_mae(ridge, test_df, encoder)
        current_meta.update({
            "model_type": "Ridge (Retrained)",
            "training_date": datetime.now(timezone.utc).isoformat(),
            "sample_count": len(combined_df),
            "real_user_count": len(real_df),
            "mae": round(new_mae, 6),
            "rmse": round(metrics["rmse"], 6),
            "r_squared": round(metrics["r2"], 6),
            "feature_names": feature_names,
            "per_position_mae": {k: round(v, 4) for k, v in pos_mae.items()},
        })
        with open(META_PATH, "w") as f:
            json.dump(current_meta, f, indent=2)
            
        # Update feature importance
        ridge_fi = _ridge_feature_importance(ridge, feature_names)
        fi_payload = {
            "ridge_coefficients": ridge_fi,
            "production_model": "Ridge (Retrained)",
            "feature_names": feature_names,
        }
        with open(FI_PATH, "w") as f:
            json.dump(fi_payload, f, indent=2)
            
        print("[save] All artifacts updated successfully.")
    else:
        print("\n[SKIP] New model did not improve MAE. Discarding.")

if __name__ == "__main__":
    retrain()
