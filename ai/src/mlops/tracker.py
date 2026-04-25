"""MLflow tracking utilities. Import log_call to wrap any endpoint.

When MLflow is not installed or not configured, all tracking is silently
skipped — the wrapped endpoint still runs normally.
"""

from __future__ import annotations

import functools
import inspect
import logging
import time
from typing import Any, Callable

logger = logging.getLogger(__name__)

_mlflow_available = False
try:
    import mlflow
    import mlflow.sklearn
    from src.config import settings

    mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
    mlflow.set_experiment(settings.mlflow_experiment_name)
    _mlflow_available = True
except Exception:
    logger.info("MLflow not available — tracking disabled")


def log_call(model_name: str) -> Callable:
    """Decorator that logs input length, model, output score, and latency to MLflow."""

    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            start = time.monotonic()
            result = await fn(*args, **kwargs)
            latency_ms = (time.monotonic() - start) * 1000

            if not _mlflow_available:
                return result

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

            try:
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
            except Exception as exc:
                logger.debug("MLflow logging failed: %s", exc)

            return result

        # Keep original endpoint signature so FastAPI parses body params correctly.
        wrapper.__signature__ = inspect.signature(fn)
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
