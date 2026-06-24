"""
PRAGMA — Application Configuration

Reads settings from .env via pydantic-settings.
Import the `settings` singleton anywhere in the app.

Offline-first: Claude/Anthropic settings are optional legacy fields.
Primary AI engine is Ollama (local inference).
"""

from typing import Optional, List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./pragma_demo.db"

    # ── AI Engine ─────────────────────────────────────────────────────────────
    # "ollama"     — use local Ollama inference (default, offline-safe)
    # "rule_based" — skip Ollama, use rule-based extraction only
    AI_ENGINE:      str = "ollama"
    OLLAMA_URL:     str = "http://localhost:11434"
    # Model priority: qwen3:8b > llama3.1:8b > phi3.5
    # System auto-selects best available model at startup
    OLLAMA_MODEL:   str = "llama3.1:8b"
    OLLAMA_TIMEOUT: int = 120      # seconds — 8B models on CPU need up to 90s

    # ── Legacy — Claude API (not used in offline mode) ────────────────────────
    ANTHROPIC_API_KEY: Optional[str] = None
    CLAUDE_MODEL:      str           = "claude-sonnet-4-6"

    # ── Application ───────────────────────────────────────────────────────────
    APP_ENV:  str  = "development"
    APP_HOST: str  = "0.0.0.0"
    APP_PORT: int  = 8000
    DEBUG:    bool = True

    class Config:
        env_file       = ".env"
        case_sensitive = True


settings = Settings()

# Model priority list — tried in order when preferred model isn't pulled
OLLAMA_MODEL_PRIORITY: List[str] = [
    "qwen3:8b",
    "qwen3:4b",
    "llama3.1:8b",
    "llama3.2:3b",
    "phi3.5",
    "phi3:mini",
    "gemma3:12b",
    "mistral:7b",
]
