"""
PRAGMA — Application Configuration

Reads settings from .env via pydantic-settings.
Import the `settings` singleton anywhere in the app.
"""

from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Database ---
    DATABASE_URL: str

    # --- Ollama (local LLM — optional, falls back to rule-based extractor) ---
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen3:8b"

    # --- External API (optional — not used in air-gapped deployment) ---
    ANTHROPIC_API_KEY: Optional[str] = None
    CLAUDE_MODEL: str = "claude-sonnet-4-6"

    # --- Application ---
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
