"""MLflow tracking utilities. Import log_call to wrap any endpoint."""

from __future__ import annotations

import asyncio
import functools
import time
from typing import Any, Callable

import mlflow
import mlflow.sklearn
from src.config import settings

mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
mlflow.set_experiment(settings.mlflow_experiment_name)


def log_call(model_name: str) -> Callable:
    """Decorator that logs input length, model, output score, and latency to MLflow."""

    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            start = time.monotonic()
            result = await fn(*args, **kwargs)
            latency_ms = (time.monotonic() - start) * 1000

            # Best-effort: extract text length from first arg if it's a Pydantic model
            input_len = 0
            for a in args:
                if hasattr(a, "text"):
                    input_len = len(str(a.text))
                    break
            for v in kwargs.values():
                if hasattr(v, "text"):
                    input_len = len(str(v.text))
                    break

            score_output = _extract_score(result)

            with mlflow.start_run(run_name=model_name, nested=True):
                mlflow.log_metrics(
                    {
                        "input_text_length": float(input_len),
                        "score_output": float(score_output) if score_output is not None else -1.0,
                        "latency_ms": latency_ms,
                    }
                )
                mlflow.log_params(
                    {
                        "model_name": model_name,
                    }
                )

            return result

        return wrapper

    return decorator


def _extract_score(result: Any) -> float | None:
    """Pull a representative numeric score from a dict or Pydantic model."""
    for key in ("score", "sentiment", "urgency", "confidence", "relevance_score"):
        # Pydantic BaseModel
        val = getattr(result, key, None)
        if val is None and isinstance(result, dict):
            val = result.get(key)
        if isinstance(val, (int, float)):
            return float(val)
    return None


async def check_and_trigger_retraining(
    experiment_name: str = settings.mlflow_experiment_name,
    metric_key: str = "accuracy",
    threshold: float = settings.retraining_accuracy_threshold,
) -> dict[str, Any]:
    """
    Weekly retraining trigger.

    Queries the last 7 days of MLflow runs for the given experiment.
    If the rolling mean accuracy drops below `threshold`, enqueues a
    Celery retraining task and returns a trigger signal.
    """
    client = mlflow.tracking.MlflowClient()
    experiment = client.get_experiment_by_name(experiment_name)
    if experiment is None:
        return {"triggered": False, "reason": "experiment_not_found"}

    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        filter_string="",
        order_by=["start_time DESC"],
        max_results=50,
    )

    scores = [
        r.data.metrics[metric_key]
        for r in runs
        if metric_key in r.data.metrics
    ]

    if not scores:
        return {"triggered": False, "reason": "no_metric_data"}

    mean_accuracy = sum(scores) / len(scores)

    if mean_accuracy < threshold:
        from src.workers.celery_app import celery_app  # avoid circular import
        celery_app.send_task("src.workers.duplicate_worker.retrain_models")
        return {
            "triggered": True,
            "mean_accuracy": mean_accuracy,
            "threshold": threshold,
            "reason": "accuracy_below_threshold",
        }

    return {
        "triggered": False,
        "mean_accuracy": mean_accuracy,
        "threshold": threshold,
        "reason": "accuracy_ok",
    }
