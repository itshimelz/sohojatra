from celery import Celery
from src.config import settings

celery_app = Celery(
    "nagarik",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["src.workers.duplicate_worker", "src.workers.retrain_worker"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Dhaka",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "check-retrain-every-6h": {
            "task": "src.workers.retrain_worker.check_retrain_threshold",
            "schedule": 21600,  # 6 hours in seconds
        },
    },
)
