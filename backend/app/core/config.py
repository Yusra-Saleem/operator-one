"""Validated environment configuration for the production API."""

from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    project_name: str = "Operation One API"
    environment: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"

    # The Agents SDK reads OPENAI_API_KEY from the environment itself. Keeping
    # it here validates the deployment without ever exposing its value.
    openai_api_key: SecretStr
    openai_model: str = "gpt-4o-mini"

    supabase_url: str
    supabase_anon_key: SecretStr
    supabase_service_role_key: SecretStr
    database_url: SecretStr

    cors_origins: str = "http://localhost:3000"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    @field_validator("supabase_url")
    @classmethod
    def validate_supabase_url(cls, value: str) -> str:
        if not value.startswith(("http://", "https://")):
            raise ValueError("SUPABASE_URL must be an HTTP(S) URL")
        return value.rstrip("/")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
