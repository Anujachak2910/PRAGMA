"""
PRAGMA — Claude MAP Extraction Service

Owner: Anoushka (LLM Pipeline)
Milestone: M1 (prompt design) → M2 (integration)

Responsibilities:
  - Send circular text to Claude Sonnet
  - Parse the structured MAP JSON response
  - Return a list of raw MAP dicts for map_service to persist

Prompt design is in docs/architecture.md (Prompt Design section).
Anuja owns prompt iteration and validation dataset.

Claude model: claude-sonnet-4-6 (configured in .env via CLAUDE_MODEL)
"""

import anthropic
from app.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# TODO (M1 + M2): Implement extract_maps(circular_text: str) -> list[dict]
#
# High-level flow:
#   1. Build the system + user prompt (see docs/architecture.md)
#   2. Call client.messages.create(model=settings.CLAUDE_MODEL, ...)
#   3. Parse JSON from response.content[0].text
#   4. Validate each MAP has required fields: action, department, priority, deadline
#   5. Return list of MAP dicts
#
# Error handling:
#   - If Claude returns malformed JSON: retry once, then raise ValueError
#   - If API call fails: raise RuntimeError with original error
