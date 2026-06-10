"""
PRAGMA — Application Configuration

Reads settings from .env via pydantic-settings.
Import the `settings` singleton anywhere in the app.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Database ---
    DATABASE_URL: str

    # --- Anthropic / Claude ---
    ANTHROPIC_API_KEY: str
    CLAUDE_MODEL: str = "claude-sonnet-4-6"

    # --- Application ---
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


# Singleton — import this, never instantiate Settings directly elsewhere
settings = Settings()
