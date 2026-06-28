"""
PRAGMA — Ollama Local Inference Service
Primary AI extraction engine (offline, local).

Calls Ollama's HTTP API on localhost:11434.
Auto-discovers the best available model from a priority list:
  qwen3:8b > llama3.1:8b > phi3.5 (and others)

Key reliability features:
- think: False  — suppresses qwen3 chain-of-thought entirely (no <think> tags)
- 12s fast timeout — if primary model is slow, phi3.5 takes over for that request
- Session prompt cache — identical circular texts reuse the cached inference result
- Two-pass JSON repair — malformed JSON retried with stricter prompt before fallback

Model pull commands:
  ollama pull qwen3:8b        # Best quality (4.7 GB)
  ollama pull llama3.1:8b     # Excellent alternative (4.7 GB)
  ollama pull phi3.5          # Compact fallback (2.2 GB)
"""

import hashlib
import json
import logging
import time
from typing import Optional

import httpx

from app.config import settings, OLLAMA_MODEL_PRIORITY

logger = logging.getLogger(__name__)

# ── Active model (auto-resolved at startup) ───────────────────────────────────
_active_model: Optional[str] = None

# ── Session-level prompt cache ────────────────────────────────────────────────
# Keyed by SHA-256 of the first 8 KB of circular text.
# In-memory; cleared on server restart. Sufficient for demo stability.
_prompt_cache: dict[str, list[dict]] = {}
_cache_hits = 0
_cache_misses = 0


def _cache_key(text: str) -> str:
    return hashlib.sha256(text[:8192].encode("utf-8", errors="replace")).hexdigest()[:20]


# ── Shared prompts ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a regulatory compliance analyst for an Indian bank. \
Your job is to read regulatory circulars from RBI, SEBI, or MCA and extract \
Measurable Action Points (MAPs).

A MAP is a specific, concrete action the bank must take to comply with the regulation. \
Not a general observation — a precise, actionable task with a clear owner and deadline.

Department routing guide:
- IT: technology systems, cybersecurity, digital platforms, software upgrades, \
data infrastructure, IT security controls, system implementations
- Compliance: KYC procedures, regulatory reporting, documentation, audits, \
disclosures, AML/CFT monitoring, regulatory filings
- Risk: risk assessment, credit risk, market risk, operational risk, stress testing, \
fraud detection, exposure limits
- Treasury: capital adequacy, liquidity management, investments, interest rates, \
funding, NSFR/LCR ratios, reserve requirements
- Legal: legal documentation, contracts, regulatory interpretation, policy updates, \
grievance redressal mechanisms, legal obligations

Priority guide:
- Critical: immediate regulatory mandate, high penalty risk, or core customer impact
- High: required within 30-90 days, significant compliance risk if missed
- Medium: required within 90-180 days, moderate compliance risk
- Low: best practice, longer timeline, or advisory guidance

CRITICAL OUTPUT RULE: Respond with ONLY a valid JSON array. No introduction, \
no explanation, no markdown formatting, no code blocks. \
The first character of your response must be [ and the last must be ]."""

USER_PROMPT_TEMPLATE = """Extract all Measurable Action Points from the following \
regulatory circular:

---
{circular_text}
---

Return a JSON array. Each element must have exactly these fields:
{{
  "action": "specific actionable task the bank must perform (precise, not generic)",
  "department": "one of: IT, Compliance, Risk, Treasury, Legal",
  "priority": "one of: Critical, High, Medium, Low",
  "deadline": "YYYY-MM-DD if stated or inferrable from the circular, otherwise null",
  "source_clause": "the specific section, clause, paragraph, or annex reference (e.g. Para 4.2, Section 5(a)). Write Regulatory circular if not referenced.",
  "confidence_score": 0.85,
  "validation_notes": "cite the specific section or clause that mandates this, \
and explain your department and priority reasoning in one sentence"
}}

Rules:
- Extract between 3 and 8 MAPs. Prefer precision over volume.
- Each MAP must be independently actionable by a single department.
- Deadlines must be real dates from the circular — do not invent them.
- confidence_score must be a float between 0.0 and 1.0 reflecting extraction certainty.
- Return ONLY the JSON array. No prose, no markdown, no code fences."""

RETRY_SUFFIX = (
    "\n\nIMPORTANT: Your previous response was not valid JSON. "
    "Return ONLY the raw JSON array. No prose, no markdown, no code fences. "
    "Start your response with [ and end with ]."
)

# ── Models that support think:false ──────────────────────────────────────────
_THINKING_MODELS = {"qwen3", "qwen2.5"}


def _supports_think_false(model_name: str) -> bool:
    name_lower = (model_name or "").lower()
    return any(t in name_lower for t in _THINKING_MODELS)


# ── Model auto-discovery ──────────────────────────────────────────────────────

def _get_pulled_models() -> list[str]:
    """Return list of model names currently pulled in Ollama."""
    try:
        r = httpx.get(f"{settings.OLLAMA_URL}/api/tags", timeout=3.0)
        if r.status_code != 200:
            return []
        return [m.get("name", "").lower() for m in r.json().get("models", [])]
    except Exception:
        return []


def _resolve_active_model(pulled: list[str]) -> Optional[str]:
    """
    Find the best available model from the priority list.
    Returns the model name as Ollama knows it (with tag), or None.
    """
    preferred_base = settings.OLLAMA_MODEL.split(":")[0].lower()
    for name in pulled:
        if preferred_base in name:
            return name

    for candidate in OLLAMA_MODEL_PRIORITY:
        base = candidate.split(":")[0].lower()
        for name in pulled:
            if base in name:
                return name

    return None


def _resolve_fallback_model(pulled: list[str]) -> Optional[str]:
    """Find the configured fallback model (phi3.5) from pulled models."""
    fallback_base = settings.OLLAMA_FALLBACK_MODEL.split(":")[0].lower()
    for name in pulled:
        if fallback_base in name:
            return name
    # If phi3.5 not pulled, try the last item in the priority list that IS pulled
    for candidate in reversed(OLLAMA_MODEL_PRIORITY):
        base = candidate.split(":")[0].lower()
        for name in pulled:
            if base in name and name != _active_model:
                return name
    return None


def is_available() -> bool:
    """
    Return True if Ollama is reachable and any compatible model is pulled.
    Side effect: caches the resolved active model in _active_model.
    """
    global _active_model
    pulled = _get_pulled_models()
    if not pulled:
        _active_model = None
        return False

    model = _resolve_active_model(pulled)
    if model:
        _active_model = model
        logger.info("Ollama ready — active model: %s (from %d pulled models)", model, len(pulled))
        return True

    _active_model = None
    logger.warning("Ollama running but no compatible model found. Pull one: ollama pull phi3.5")
    return False


def get_active_model() -> Optional[str]:
    """Return the currently active model name (resolved at last availability check)."""
    return _active_model or settings.OLLAMA_MODEL


# ── Inference call ────────────────────────────────────────────────────────────

def _build_payload(model: str, circular_text: str, strict: bool = False) -> dict:
    content = USER_PROMPT_TEMPLATE.format(circular_text=circular_text[:10000])
    if strict:
        content += RETRY_SUFFIX

    payload: dict = {
        "model":  model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": content},
        ],
        "stream": False,
        "options": {
            "temperature": 0.05,
            "num_predict": 4096,
            "top_p": 0.9,
        },
    }

    # Suppress chain-of-thought for models that support it.
    # qwen3 emits <think>…</think> by default — disable at API level.
    if _supports_think_false(model):
        payload["think"] = False

    return payload


def _call_model(model: str, circular_text: str, timeout: float, strict: bool = False) -> str:
    """Single inference call to a specific model with a hard timeout."""
    payload = _build_payload(model, circular_text, strict=strict)
    with httpx.Client(timeout=timeout) as client:
        r = client.post(f"{settings.OLLAMA_URL}/api/chat", json=payload)
        r.raise_for_status()
    return r.json()["message"]["content"].strip()


def _call_ollama(circular_text: str, strict: bool = False) -> tuple[str, str]:
    """
    Call Ollama with automatic fast-timeout → fallback-model strategy.

    Returns (raw_response, model_used).

    Strategy:
      1. Try primary model with OLLAMA_FAST_TIMEOUT (12s default).
      2. On timeout, try fallback model (phi3.5) with full OLLAMA_TIMEOUT.
      3. On any other error, propagate.
    """
    primary = get_active_model()
    fast_timeout = float(settings.OLLAMA_FAST_TIMEOUT)
    full_timeout  = float(settings.OLLAMA_TIMEOUT)

    t0 = time.monotonic()

    try:
        raw = _call_model(primary, circular_text, timeout=fast_timeout, strict=strict)
        elapsed = time.monotonic() - t0
        logger.info("Ollama (%s) responded in %.1fs", primary, elapsed)
        return raw, primary

    except httpx.ReadTimeout:
        elapsed = time.monotonic() - t0
        logger.warning(
            "Primary model %s exceeded %.1fs fast timeout (%.1fs elapsed) — switching to fallback",
            primary, fast_timeout, elapsed,
        )

    except httpx.ConnectError:
        raise  # Ollama not running at all — propagate immediately

    # ── Fallback model ────────────────────────────────────────────────────────
    pulled = _get_pulled_models()
    fallback = _resolve_fallback_model(pulled)

    if not fallback:
        logger.error("No fallback model available — retrying primary with full timeout")
        raw = _call_model(primary, circular_text, timeout=full_timeout, strict=strict)
        return raw, primary

    logger.info("Switching to fallback model %s for this request", fallback)
    t1 = time.monotonic()
    remaining = full_timeout - (t1 - t0)
    raw = _call_model(fallback, circular_text, timeout=max(remaining, 30.0), strict=strict)
    elapsed = time.monotonic() - t0
    logger.info("Fallback model %s responded in %.1fs (total wall-clock)", fallback, elapsed)
    return raw, fallback


def _parse_json(raw: str) -> list[dict]:
    text = raw.strip()

    # Strip markdown code fences
    if text.startswith("```"):
        lines = text.split("\n")
        inner = [ln for ln in lines[1:] if ln.strip() != "```"]
        text = "\n".join(inner).strip()

    # Strip any residual <think>…</think> (should not appear with think:false, but be safe)
    if "<think>" in text:
        import re
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

    # Extract JSON array even if surrounded by prose
    start = text.find("[")
    end   = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        text = text[start: end + 1]

    return json.loads(text)


# ── Public API ────────────────────────────────────────────────────────────────

def extract_maps(circular_text: str) -> list[dict]:
    """
    Extract MAPs via local Ollama inference.
    Auto-uses the best available model with fallback.
    Raises RuntimeError if Ollama is unreachable.
    """
    global _cache_hits, _cache_misses
    from app.services.rule_extractor import _validate_and_normalise

    if not circular_text or not circular_text.strip():
        raise ValueError("circular_text cannot be empty")

    # ── Prompt cache check ────────────────────────────────────────────────────
    key = _cache_key(circular_text)
    if key in _prompt_cache:
        _cache_hits += 1
        logger.info("Prompt cache HIT (key=%s, hits=%d)", key, _cache_hits)
        return _prompt_cache[key]
    _cache_misses += 1

    # ── LLM inference ─────────────────────────────────────────────────────────
    raw, model_used = _call_ollama(circular_text)

    try:
        maps = _parse_json(raw)
    except (json.JSONDecodeError, ValueError):
        logger.warning("Ollama returned malformed JSON — retrying with strict prompt")
        try:
            raw, model_used = _call_ollama(circular_text, strict=True)
            maps = _parse_json(raw)
        except (json.JSONDecodeError, ValueError) as exc:
            raise ValueError(f"Ollama returned unparseable JSON after retry: {raw[:300]}") from exc

    if not isinstance(maps, list) or not maps:
        raise ValueError("Ollama returned empty or non-list MAP response")

    # ── Post-process ──────────────────────────────────────────────────────────
    for m in maps:
        raw_conf = m.get("confidence_score")
        if isinstance(raw_conf, (int, float)):
            m["confidence_score"] = round(min(max(float(raw_conf), 0.0), 1.0), 2)
        elif raw_conf is None:
            m["confidence_score"] = 0.75
        else:
            try:
                m["confidence_score"] = round(min(max(float(raw_conf), 0.0), 1.0), 2)
            except (TypeError, ValueError):
                m["confidence_score"] = 0.75

        clause = m.get("source_clause") or "Regulatory circular"
        m["source_clause"] = clause.strip()

    validated = _validate_and_normalise(maps)
    logger.info("Ollama (%s) extracted %d MAPs (cache_misses=%d)", model_used, len(validated), _cache_misses)

    # ── Store in cache ────────────────────────────────────────────────────────
    _prompt_cache[key] = validated
    return validated


def get_cache_stats() -> dict:
    """Return prompt cache statistics for the health endpoint."""
    return {
        "cache_size":  len(_prompt_cache),
        "cache_hits":  _cache_hits,
        "cache_misses": _cache_misses,
    }


def clear_cache() -> None:
    """Clear the prompt cache (called by demo reset)."""
    global _cache_hits, _cache_misses
    _prompt_cache.clear()
    _cache_hits = 0
    _cache_misses = 0
    logger.info("Prompt cache cleared")
