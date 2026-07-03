"""
train_model.py
──────────────
Trains a position-aware OVR prediction model for STRYK.

Pipeline:
  1. Load training_data.csv (or generate more data if needed)
  2. One-hot encode position
  3. 80/20 train/test split
  4. Train Ridge Regression (alpha=1.0) + Random Forest (100 trees, depth 8)
  5. Select production model by MAE
  6. Optionally train a GK sub-model if GK MAE is high
  7. Save artifacts: ovr_model.joblib, position_encoder.joblib,
                     model_metadata.json, feature_importance.json

Run:
    python backend/ml/train_model.py
"""

import json
import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

# ── paths ──────────────────────────────────────────────────────────────────────
HERE = os.path.dirname(__file__)
DATA_PATH     = os.path.join(HERE, "training_data.csv")
MODEL_PATH    = os.path.join(HERE, "ovr_model.joblib")
GK_MODEL_PATH = os.path.join(HERE, "ovr_gk_model.joblib")
ENCODER_PATH  = os.path.join(HERE, "position_encoder.joblib")
META_PATH     = os.path.join(HERE, "model_metadata.json")
FI_PATH       = os.path.join(HERE, "feature_importance.json")

SEED = 42

# ── targets ────────────────────────────────────────────────────────────────────
MAE_TARGET  = 2.5
RMSE_TARGET = 3.5
R2_TARGET   = 0.92

# Stats that feed the model (same order as training CSV)
BASE_STATS = [
    "pace", "shooting", "passing", "dribbling", "defending", "physical",
    "gkDiving", "gkHandling", "gkKicking", "gkReflexes", "gkPositioning",
]
ALL_POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"]


# ── helpers ────────────────────────────────────────────────────────────────────

def _load_or_generate(n_players: int = 5000) -> pd.DataFrame:
    """Load existing CSV; if it doesn't exist or is too small, (re-)generate."""
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        if len(df) >= n_players:
            print(f"[data]  Loaded {len(df)} rows from {DATA_PATH}")
            return df
        print(f"[data]  CSV has only {len(df)} rows; regenerating {n_players}…")

    # lazy import so the file can be run standalone
    sys.path.insert(0, os.path.join(HERE, ".."))
    from ml.generate_training_data import generate  # noqa: E402
    df = generate(n_players)
    df.to_csv(DATA_PATH, index=False)
    print(f"[data]  Generated {len(df)} rows -> {DATA_PATH}")
    return df


def _get_feature_names(encoder: OneHotEncoder) -> list:
    """Return full feature name list: one-hot + base stats + interactions."""
    pos_names  = [f"pos_{p}" for p in encoder.categories_[0]]
    inter_names = [
        f"{p}_{s}"
        for p in encoder.categories_[0]
        for s in BASE_STATS
    ]
    return pos_names + BASE_STATS + inter_names


def _build_features(df: pd.DataFrame, encoder: OneHotEncoder) -> np.ndarray:
    """One-hot position + numeric stats + position×stat interaction terms."""
    pos_enc = encoder.transform(df[["position"]])   # (n, n_positions)
    if hasattr(pos_enc, "toarray"):
        pos_enc = pos_enc.toarray()
    stats = df[BASE_STATS].values  # (n, 11)

    # Interaction: every (position_indicator × stat) pair
    # Gives the linear model position-specific per-stat coefficients
    interactions = np.hstack(
        [pos_enc[:, [i]] * stats for i in range(pos_enc.shape[1])]
    )  # (n, n_positions * n_stats)

    return np.hstack([pos_enc, stats, interactions])


def _evaluate(model, X_test, y_test, label: str) -> dict:
    preds = model.predict(X_test)
    mae   = mean_absolute_error(y_test, preds)
    rmse  = np.sqrt(mean_squared_error(y_test, preds))
    r2    = r2_score(y_test, preds)
    print(f"\n  [{label}]")
    print(f"    MAE:   {mae:.4f}  (target < {MAE_TARGET})")
    print(f"    RMSE:  {rmse:.4f}  (target < {RMSE_TARGET})")
    print(f"    R²:    {r2:.4f}  (target > {R2_TARGET})")
    ok = mae < MAE_TARGET and rmse < RMSE_TARGET and r2 > R2_TARGET
    print(f"    Targets met: {'YES' if ok else 'NO'}")
    return {"mae": mae, "rmse": rmse, "r2": r2, "ok": ok}


def _per_position_mae(model, df_test: pd.DataFrame, encoder: OneHotEncoder) -> dict:
    results = {}
    for pos in ALL_POSITIONS:
        subset = df_test[df_test["position"] == pos]
        if len(subset) == 0:
            continue
        X = _build_features(subset, encoder)
        y = subset["ovr"].values
        preds = model.predict(X)
        results[pos] = round(mean_absolute_error(y, preds), 4)
    return results


def _ridge_feature_importance(model: Ridge, feature_names: list) -> dict:
    coefs = model.coef_
    result = {}
    for name, coef in zip(feature_names, coefs):
        result[name] = round(float(coef), 6)
    # sort descending by absolute value
    result = dict(sorted(result.items(), key=lambda x: abs(x[1]), reverse=True))
    return result


def _rf_feature_importance(model: RandomForestRegressor, feature_names: list) -> dict:
    importances = model.feature_importances_
    result = {}
    for name, imp in zip(feature_names, importances):
        result[name] = round(float(imp), 6)
    result = dict(sorted(result.items(), key=lambda x: x[1], reverse=True))
    return result


def _print_importance_table(importance: dict, title: str, top_n: int = 15):
    print(f"\n  {title}")
    print(f"  {'Feature':<25} {'Score':>10}")
    print(f"  {'-'*35}")
    for i, (k, v) in enumerate(importance.items()):
        if i >= top_n:
            break
        print(f"  {k:<25} {v:>10.4f}")


# ── main training loop ─────────────────────────────────────────────────────────

def train(n_players: int = 5000):
    print("=" * 60)
    print(" STRYK OVR Model Training")
    print("=" * 60)

    df = _load_or_generate(n_players)

    # ── encode position ────────────────────────────────────────────────────────
    encoder = OneHotEncoder(
        categories=[ALL_POSITIONS],
        sparse_output=False,
        handle_unknown="ignore",
    )
    encoder.fit(df[["position"]])
    feature_names = _get_feature_names(encoder)
    print(f"\n[feat]  {len(feature_names)} features ({len(feature_names)} total incl. interactions)")

    # ── train/test split ───────────────────────────────────────────────────────
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=SEED)
    X_train = _build_features(train_df, encoder)
    y_train = train_df["ovr"].values
    X_test  = _build_features(test_df, encoder)
    y_test  = test_df["ovr"].values
    print(f"[split] Train: {len(train_df)}, Test: {len(test_df)}")

    # ── train Ridge ────────────────────────────────────────────────────────────
    print("\n[train] Fitting Ridge Regression (alpha=1.0)…")
    ridge = Ridge(alpha=1.0)
    ridge.fit(X_train, y_train)
    ridge_metrics = _evaluate(ridge, X_test, y_test, "Ridge")

    # ── train Random Forest ────────────────────────────────────────────────────
    print("\n[train] Fitting Random Forest (n_estimators=100, max_depth=8)…")
    rf = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=SEED, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf_metrics = _evaluate(rf, X_test, y_test, "Random Forest")

    # ── if targets not met, scale up ───────────────────────────────────────────
    if not ridge_metrics["ok"] and not rf_metrics["ok"] and n_players < 10000:
        print("\n[!] Targets not met — retrain with 10,000 samples…")
        return train(n_players=10000)

    # ── select production model ────────────────────────────────────────────────
    if ridge_metrics["mae"] <= rf_metrics["mae"]:
        prod_model   = ridge
        prod_metrics = ridge_metrics
        prod_type    = "Ridge"
        fi           = _ridge_feature_importance(ridge, feature_names)
    else:
        prod_model   = rf
        prod_metrics = rf_metrics
        prod_type    = "Random Forest"
        fi           = _rf_feature_importance(rf, feature_names)

    print(f"\n[prod]  Selected: {prod_type} (MAE={prod_metrics['mae']:.4f})")

    # ── per-position MAE ───────────────────────────────────────────────────────
    print("\n[eval]  Per-position MAE on test set:")
    pos_mae = _per_position_mae(prod_model, test_df, encoder)
    avg_mae = np.mean(list(pos_mae.values()))
    print(f"  {'Position':<8} {'MAE':>8}")
    print(f"  {'-'*18}")
    for pos, mae in sorted(pos_mae.items(), key=lambda x: x[1], reverse=True):
        flag = " <-- HIGH" if mae > avg_mae * 1.5 else ""
        print(f"  {pos:<8} {mae:>8.4f}{flag}")

    # ── GK sub-model check ─────────────────────────────────────────────────────
    gk_mae = pos_mae.get("GK", 0)
    use_gk_submodel = gk_mae > avg_mae * 1.5
    gk_model_saved = False

    if use_gk_submodel:
        print(f"\n[GK]    GK MAE ({gk_mae:.4f}) > 1.5x avg ({avg_mae:.4f}) — training GK sub-model…")
        gk_train = train_df[train_df["position"] == "GK"]
        gk_test  = test_df[test_df["position"] == "GK"]
        X_gk_train = _build_features(gk_train, encoder)
        y_gk_train = gk_train["ovr"].values
        X_gk_test  = _build_features(gk_test, encoder)
        y_gk_test  = gk_test["ovr"].values

        gk_ridge = Ridge(alpha=1.0)
        gk_ridge.fit(X_gk_train, y_gk_train)
        gk_metrics = _evaluate(gk_ridge, X_gk_test, y_gk_test, "GK Sub-model")
        print(f"  GK sub-model MAE: {gk_metrics['mae']:.4f} (was {gk_mae:.4f})")

        joblib.dump(gk_ridge, GK_MODEL_PATH)
        print(f"[save]  GK sub-model -> {GK_MODEL_PATH}")
        gk_model_saved = True
    else:
        print("\n[GK]    GK MAE is within acceptable range — no sub-model needed.")

    # ── feature importance ─────────────────────────────────────────────────────
    ridge_fi = _ridge_feature_importance(ridge, feature_names)
    rf_fi    = _rf_feature_importance(rf, feature_names)

    _print_importance_table(ridge_fi, "Ridge Coefficients (top 15):")
    _print_importance_table(rf_fi,    "Random Forest Importances (top 15):")

    fi_payload = {
        "ridge_coefficients": ridge_fi,
        "random_forest_importances": rf_fi,
        "production_model": prod_type,
        "feature_names": feature_names,
    }

    with open(FI_PATH, "w") as f:
        json.dump(fi_payload, f, indent=2)
    print(f"\n[save]  Feature importances -> {FI_PATH}")

    # ── save artifacts ─────────────────────────────────────────────────────────
    joblib.dump(prod_model, MODEL_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    print(f"[save]  Model -> {MODEL_PATH}")
    print(f"[save]  Encoder -> {ENCODER_PATH}")

    meta = {
        "model_type": prod_type,
        "training_date": datetime.now(timezone.utc).isoformat(),
        "sample_count": len(df),
        "mae": round(prod_metrics["mae"], 6),
        "rmse": round(prod_metrics["rmse"], 6),
        "r_squared": round(prod_metrics["r2"], 6),
        "targets_met": prod_metrics["ok"],
        "feature_names": feature_names,
        "position_list": ALL_POSITIONS,
        "gk_submodel": gk_model_saved,
        "per_position_mae": {k: round(v, 4) for k, v in pos_mae.items()},
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"[save]  Metadata -> {META_PATH}")

    print("\n" + "=" * 60)
    print(f" Training complete!  Production model: {prod_type}")
    print(f"   MAE={prod_metrics['mae']:.4f}  RMSE={prod_metrics['rmse']:.4f}  R2={prod_metrics['r2']:.4f}")
    print("=" * 60)

    return prod_model, encoder, meta


if __name__ == "__main__":
    train()
