from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # AI_DATABASE_URL uses the asyncpg driver against Supabase direct connection
    database_url: str = ""
    ai_database_url: str = ""

    def model_post_init(self, __context):
        if not self.database_url and self.ai_database_url:
            object.__setattr__(self, "database_url", self.ai_database_url)

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    banglabert_model: str = "csebuetnlp/banglabert"
    embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"
    # Modal web endpoint URL — set after `modal deploy ai/serve_model.py`
    # /analyze requires this fine-tuned model endpoint.
    modal_api_url: str = ""
    # HuggingFace token (needed by Modal container to pull private LoRA repo)
    huggingface_token: str = ""

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
    cors_origins: str = "*"
    modal_timeout_secs: float = 12.0


settings = Settings()
