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

    # --- Anthropic / Claude ---
    # Optional so the app starts and serves all non-Claude endpoints even
    # when the key is absent (e.g. teammate running without API access).
    # claude_service.py checks for None before making API calls.
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
