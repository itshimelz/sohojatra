from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    database_url: str = "postgresql+asyncpg://nagarik:secret@localhost:5432/nagarik_ai"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    banglabert_model: str = "csebuetnlp/banglabert"
    embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"
    claude_model: str = "claude-haiku-4-5"

    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_experiment_name: str = "nagarik-ai"

    duplicate_similarity_threshold: float = 0.92
    duplicate_window_size: int = 10_000
    mob_cluster_min_size: int = 5
    mob_posting_interval_secs: int = 120
    retraining_accuracy_threshold: float = 0.85
    score_cache_ttl: int = 3600

    app_env: str = "development"
    log_level: str = "info"


settings = Settings()
