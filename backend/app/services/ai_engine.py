"""
PRAGMA — Unified AI Extraction Engine
Routes extraction to the correct backend based on configuration and availability.

Priority chain:
  1. Ollama (local LLM — phi3.5 recommended)    when AI_ENGINE != "rule_based"
  2. Rule-based extractor                        automatic fallback
  3. Pre-seeded demo data                        last resort (caller's responsibility)

This module NEVER raises — it always returns MAPs.

Return type: tuple[list[dict], str]
  list[dict] — extracted MAP dicts
  str        — engine identifier: "ollama" | "rule_based"
"""

import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Track last-known Ollama state to avoid re-checking on every request.
# Reset to None on startup; updated on first extraction attempt.
_ollama_ok: Optional[bool] = None


def _try_ollama(circular_text: str) -> list[dict]:
    from app.services import ollama_service
    return ollama_service.extract_maps(circular_text)


def _try_rule_based(circular_text: str) -> list[dict]:
    from app.services import rule_extractor
    return rule_extractor.extract_maps(circular_text)


# ── Public API ────────────────────────────────────────────────────────────────

def extract_maps(circular_text: str) -> tuple[list[dict], str]:
    """
    Extract MAPs using the configured engine with automatic fallback.

    Returns (maps, engine_used) where engine_used is "ollama" or "rule_based".
    """
    global _ollama_ok

    # ── Rule-based forced via config ─────────────────────────────────────────
    if settings.AI_ENGINE == "rule_based":
        maps = _try_rule_based(circular_text)
        return maps, "rule_based"

    # ── Try Ollama ────────────────────────────────────────────────────────────
    # Availability check: use cached result unless unknown
    if _ollama_ok is None:
        try:
            from app.services import ollama_service
            _ollama_ok = ollama_service.is_available()
            if _ollama_ok:
                logger.info("Ollama is available — using model %s", settings.OLLAMA_MODEL)
            else:
                logger.warning(
                    "Ollama not reachable or model '%s' not pulled — "
                    "falling back to rule-based extraction",
                    settings.OLLAMA_MODEL,
                )
        except Exception as exc:
            logger.warning("Ollama availability check error: %s", exc)
            _ollama_ok = False

    if _ollama_ok:
        try:
            maps = _try_ollama(circular_text)
            return maps, "ollama"
        except Exception as exc:
            logger.error("Ollama extraction failed (%s) — falling back to rule-based", exc)
            _ollama_ok = False   # Don't retry Ollama for subsequent requests this session

    # ── Rule-based fallback ───────────────────────────────────────────────────
    maps = _try_rule_based(circular_text)
    return maps, "rule_based"


def get_engine_status() -> dict:
    """
    Return current AI engine status for the /health endpoint.
    Called cheaply — does NOT re-ping Ollama if we already know its state.
    """
    global _ollama_ok

    if settings.AI_ENGINE == "rule_based":
        return {
            "engine":    "rule_based",
            "model":     None,
            "available": True,
            "label":     "Rule-Based Extraction",
        }

    # Check Ollama availability (cached)
    try:
        from app.services import ollama_service
        reachable = _ollama_ok if _ollama_ok is not None else ollama_service.is_available()
    except Exception:
        reachable = False

    if reachable:
        return {
            "engine":    "ollama",
            "model":     settings.OLLAMA_MODEL,
            "available": True,
            "label":     f"Local AI ({settings.OLLAMA_MODEL})",
        }

    return {
        "engine":    "rule_based",
        "model":     None,
        "available": True,
        "label":     "Rule-Based (Ollama offline)",
    }


def reset_availability_cache() -> None:
    """Force re-check of Ollama availability on next extraction call."""
    global _ollama_ok
    _ollama_ok = None
