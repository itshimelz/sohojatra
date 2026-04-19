"""
Fake account detection using XGBoost.

Features:
  account_age_days       – int, days since registration
  posts_per_day          – float, average daily posting rate
  profile_completeness   – float [0, 1]
  unique_ip_count        – int, distinct IPs used
  avg_comment_similarity – float [0, 1], mean pairwise similarity of user's comments
  verified               – bool (0/1)
"""

from __future__ import annotations

import logging
import os
import pickle
from pathlib import Path
from typing import Any

import numpy as np
from xgboost import XGBClassifier

logger = logging.getLogger(__name__)

_MODEL_PATH = Path(__file__).parent / "fake_account_model.pkl"
_FEATURE_ORDER = [
    "account_age_days",
    "posts_per_day",
    "profile_completeness",
    "unique_ip_count",
    "avg_comment_similarity",
    "verified",
]


def _feature_vector(user_features: dict[str, Any]) -> np.ndarray:
    return np.array(
        [[float(user_features.get(f, 0)) for f in _FEATURE_ORDER]],
        dtype=np.float32,
    )


def train(
    X: "np.ndarray",
    y: "np.ndarray",
    save: bool = True,
) -> XGBClassifier:
    """
    Train on labeled account data.
    X shape: (n_samples, 6) — features in _FEATURE_ORDER order.
    y shape: (n_samples,)   — 0=real, 1=fake.
    """
    import mlflow
    from src.config import settings

    model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
    )

    mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
    with mlflow.start_run(run_name="fake_account_train"):
        model.fit(X, y, eval_set=[(X, y)], verbose=False)
        preds = (model.predict_proba(X)[:, 1] > 0.5).astype(int)
        accuracy = float((preds == y).mean())
        mlflow.log_metric("accuracy", accuracy)
        mlflow.log_params({"n_estimators": 300, "max_depth": 5, "lr": 0.05})
        mlflow.sklearn.log_model(model, artifact_path="fake_account_xgb")
        logger.info("Trained fake-account model accuracy=%.4f", accuracy)

    if save:
        with open(_MODEL_PATH, "wb") as f:
            pickle.dump(model, f)

    return model


def _load_model() -> XGBClassifier:
    if _MODEL_PATH.exists():
        with open(_MODEL_PATH, "rb") as f:
            return pickle.load(f)
    # Return an untrained default model (will always predict real until trained)
    logger.warning("No trained fake-account model found; returning default.")
    model = XGBClassifier(use_label_encoder=False, eval_metric="logloss")
    return model


_clf: XGBClassifier | None = None


def _get_clf() -> XGBClassifier:
    global _clf
    if _clf is None:
        _clf = _load_model()
    return _clf


def predict(user_features: dict[str, Any]) -> dict[str, Any]:
    """
    Returns { "is_fake": bool, "confidence": float }.
    confidence is the model's probability of fake=True.
    """
    clf = _get_clf()
    X = _feature_vector(user_features)
    try:
        proba = clf.predict_proba(X)[0, 1]
    except Exception:
        # Model not fitted yet (no training data)
        return {"is_fake": False, "confidence": 0.0}

    return {
        "is_fake": bool(proba > 0.5),
        "confidence": float(round(proba, 4)),
    }
