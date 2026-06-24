"""
PRAGMA — Ollama Local Inference Service
Primary AI extraction engine (offline, local).

Calls Ollama's HTTP API on localhost:11434.
Uses the same system/user prompts as the original Claude service so extraction
quality is preserved as closely as possible.

Recommended model: phi3.5 (2.2 GB, excellent at structured JSON tasks)
Fallback model:    llama3.2:3b (2.0 GB, good general extraction)

Ollama install:  https://ollama.ai
Pull model:      ollama pull phi3.5
"""

import json
import logging
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ── Shared prompts (identical to Claude prompts for quality parity) ──────────

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
  "validation_notes": "cite the specific section or clause that mandates this, \
and explain your department and priority reasoning in one sentence"
}}

Rules:
- Extract between 3 and 8 MAPs. Prefer precision over volume.
- Each MAP must be independently actionable by a single department.
- Deadlines must be real dates from the circular — do not invent them.
- Return ONLY the JSON array. No prose, no markdown, no code fences."""

RETRY_SUFFIX = (
    "\n\nIMPORTANT: Your previous response was not valid JSON. "
    "Return ONLY the raw JSON array. No prose, no markdown, no code fences. "
    "Start your response with [ and end with ]."
)


# ── Availability check ────────────────────────────────────────────────────────

def is_available() -> bool:
    """Return True if the Ollama daemon is reachable and the model is pulled."""
    try:
        r = httpx.get(
            f"{settings.OLLAMA_URL}/api/tags",
            timeout=3.0,
        )
        if r.status_code != 200:
            return False
        # Check that our model is available
        tags = r.json().get("models", [])
        model_base = settings.OLLAMA_MODEL.split(":")[0].lower()
        available_names = [m.get("name", "").lower() for m in tags]
        # Accept if any model matches the base name (phi3.5, phi3.5:latest, etc.)
        return any(model_base in n for n in available_names)
    except Exception as exc:
        logger.debug("Ollama availability check failed: %s", exc)
        return False


# ── Inference call ────────────────────────────────────────────────────────────

def _call_ollama(circular_text: str, strict: bool = False) -> str:
    content = USER_PROMPT_TEMPLATE.format(circular_text=circular_text[:8000])
    if strict:
        content += RETRY_SUFFIX

    payload = {
        "model":  settings.OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": content},
        ],
        "stream": False,
        "options": {
            "temperature": 0.05,   # Very low — we need deterministic structured output
            "num_predict": 4096,
            "top_p": 0.9,
        },
    }

    with httpx.Client(timeout=settings.OLLAMA_TIMEOUT) as client:
        r = client.post(
            f"{settings.OLLAMA_URL}/api/chat",
            json=payload,
        )
        r.raise_for_status()

    data = r.json()
    return data["message"]["content"].strip()


def _parse_json(raw: str) -> list[dict]:
    """Parse JSON from model output, handling common model quirks."""
    text = raw.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        inner = [ln for ln in lines[1:] if ln.strip() != "```"]
        text = "\n".join(inner).strip()

    # Find JSON array bounds (model sometimes adds prose before/after)
    start = text.find("[")
    end   = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        text = text[start: end + 1]

    return json.loads(text)


# ── Public API ────────────────────────────────────────────────────────────────

def extract_maps(circular_text: str) -> list[dict]:
    """
    Extract MAPs via local Ollama inference.

    Raises RuntimeError if Ollama is unreachable.
    Retries once with a strict prompt on JSON parse failure.
    Returns list[dict] in same contract as claude_service.extract_maps().
    """
    from app.services.rule_extractor import _validate_and_normalise

    if not circular_text or not circular_text.strip():
        raise ValueError("circular_text cannot be empty")

    raw = _call_ollama(circular_text)

    try:
        maps = _parse_json(raw)
    except (json.JSONDecodeError, ValueError):
        logger.warning("Ollama returned malformed JSON — retrying with strict prompt")
        try:
            raw = _call_ollama(circular_text, strict=True)
            maps = _parse_json(raw)
        except (json.JSONDecodeError, ValueError) as exc:
            raise ValueError(
                f"Ollama returned unparseable JSON after retry: {raw[:200]}"
            ) from exc

    if not isinstance(maps, list) or not maps:
        raise ValueError("Ollama returned empty or non-list MAP response")

    validated = _validate_and_normalise(maps)
    logger.info("Ollama extracted %d MAPs using model %s", len(validated), settings.OLLAMA_MODEL)
    return validated
