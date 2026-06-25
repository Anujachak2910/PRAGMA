"""
PRAGMA — Clause Provenance Service

Determines EXACTLY which sentence in a regulatory circular triggered each MAP.

Entirely deterministic — no LLM, no network calls. Always works offline.

Algorithm (in priority order):
  1. Clause-anchored search: if MAP has source_clause (e.g. "Para 4.2"),
     find that section in the document and search within ±300 chars.
  2. Keyword overlap + Jaccard similarity over all sentences.
  3. Return the highest-scoring sentence with its character offsets.

Output stored on the MAP record:
  evidence_quote        — exact sentence from the circular
  evidence_start_offset — char index in circular.content where quote begins
  evidence_end_offset   — char index where quote ends
  evidence_similarity   — Jaccard similarity score (0.0–1.0)
  provenance_method     — how the evidence was found

Latency: < 50 ms per MAP on typical circular length (3–5 KB).
"""

import re
import logging
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.map import MAP
from app.models.circular import Circular

logger = logging.getLogger(__name__)

# ── Stopwords (regulatory terms preserved) ───────────────────────────────────
_STOP = {
    "a", "an", "the", "and", "or", "of", "in", "to", "for", "is", "are",
    "be", "been", "by", "with", "at", "from", "this", "that", "on", "as",
    "its", "it", "was", "will", "has", "have", "had", "not", "any", "all",
    "their", "which", "who", "they", "we", "you", "i", "he", "she", "do",
    "does", "did", "can", "could", "would", "should", "may", "might",
}

# Minimum similarity to accept as evidence
_MIN_SIMILARITY = 0.12

# Clause reference patterns (most specific first)
_CLAUSE_PATTERNS = [
    r"(?:Para(?:graph)?|Section|Clause|Rule|Article|Annex(?:ure)?)\s*[\d.]+(?:\(\w+\))*",
    r"Para\s*[\d.]+",
    r"CHAPTER\s+[IVX\d]+",
]


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-z]{3,}", (text or "").lower())
    return {w for w in words if w not in _STOP}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    union = a | b
    return len(a & b) / len(union) if union else 0.0


def _keyword_boost(action_tokens: set[str], sentence: str) -> float:
    """Extra similarity bonus for keyword-rich sentences."""
    sent_l = sentence.lower()
    # Domain-specific high-value terms
    high_value = {
        "shall", "must", "required", "mandatory", "comply", "implement",
        "ensure", "submit", "establish", "report", "maintain", "designate",
        "deploy", "conduct", "monitor", "audit", "integrate", "migrate",
    }
    boost = sum(0.04 for kw in high_value if kw in sent_l)
    # Keyword overlap bonus
    sent_words = _tokenize(sentence)
    overlap = len(action_tokens & sent_words)
    boost += overlap * 0.03
    return min(boost, 0.25)


def _split_sentences(text: str) -> list[tuple[str, int]]:
    """
    Split text into (sentence, start_offset) pairs.
    Preserves character offsets into the original text.
    """
    results: list[tuple[str, int]] = []
    # Split on sentence-ending punctuation + newlines
    pattern = re.compile(r'(?<=[.!?])\s+(?=[A-Z\(\[])|(?<=[.!?])\n+|\n{2,}')
    boundaries = [0] + [m.end() for m in pattern.finditer(text)] + [len(text)]

    for i in range(len(boundaries) - 1):
        start = boundaries[i]
        end   = boundaries[i + 1]
        chunk = text[start:end].strip()
        if len(chunk) < 25:
            continue
        # Find actual start within the original text (skip leading whitespace)
        actual_start = text.find(chunk, start)
        if actual_start == -1:
            actual_start = start
        results.append((chunk, actual_start))

    return results


def _find_clause_window(content: str, source_clause: str) -> Optional[tuple[int, int]]:
    """
    Locate source_clause reference in content and return (window_start, window_end).
    Returns None if not found.
    """
    if not source_clause or source_clause.strip().lower() in ("regulatory circular", ""):
        return None

    # Try exact match first
    idx = content.lower().find(source_clause.lower()[:30])
    if idx != -1:
        return (max(0, idx - 50), min(len(content), idx + 600))

    # Try to find by clause number extracted from source_clause
    for pat in _CLAUSE_PATTERNS:
        m = re.search(pat, source_clause, re.IGNORECASE)
        if m:
            # Search for the clause reference in the document
            needle = re.escape(m.group(0)[:20])
            doc_m  = re.search(needle, content, re.IGNORECASE)
            if doc_m:
                start = doc_m.start()
                return (max(0, start - 50), min(len(content), start + 600))

    return None


def _score_sentence(
    sentence: str,
    action_tokens: set[str],
    sent_start: int,
    clause_window: Optional[tuple[int, int]],
) -> float:
    """Compute composite score for a candidate sentence."""
    sent_tokens = _tokenize(sentence)
    base_sim    = _jaccard(action_tokens, sent_tokens)
    boost       = _keyword_boost(action_tokens, sentence)
    score       = base_sim + boost

    # Strong bonus if sentence falls within the source clause window
    if clause_window:
        win_start, win_end = clause_window
        if win_start <= sent_start <= win_end:
            score += 0.30

    # Penalty for very short or very long sentences (less specific)
    if len(sentence) < 40:
        score -= 0.05
    if len(sentence) > 500:
        score -= 0.05

    return max(score, 0.0)


def find_evidence(
    action: str,
    circular_content: str,
    source_clause: Optional[str] = None,
) -> dict:
    """
    Find the best evidence sentence in circular_content for a given MAP action.

    Returns:
        {
            quote:        str   — exact sentence from the circular
            start_offset: int   — char position in circular_content
            end_offset:   int   — char position of quote end
            similarity:   float — composite similarity score (0.0–1.0)
            method:       str   — provenance method used
        }
    """
    if not circular_content or not circular_content.strip():
        return _empty_result()

    action_tokens  = _tokenize(action)
    if not action_tokens:
        return _empty_result()

    sentences      = _split_sentences(circular_content)
    if not sentences:
        return _empty_result()

    clause_window  = _find_clause_window(circular_content, source_clause)

    best_sentence  = ""
    best_start     = 0
    best_score     = 0.0
    method         = "sentence_jaccard"

    for sentence, sent_start in sentences:
        score = _score_sentence(sentence, action_tokens, sent_start, clause_window)
        if score > best_score:
            best_score    = score
            best_sentence = sentence
            best_start    = sent_start

    if not best_sentence or best_score < _MIN_SIMILARITY:
        return _empty_result()

    if clause_window and best_start >= clause_window[0]:
        method = "clause_anchored"
    elif best_score >= 0.25:
        method = "keyword_match"

    end_offset = best_start + len(best_sentence)
    return {
        "quote":        best_sentence,
        "start_offset": best_start,
        "end_offset":   end_offset,
        "similarity":   round(min(best_score, 1.0), 3),
        "method":       method,
    }


def _empty_result() -> dict:
    return {
        "quote":        None,
        "start_offset": None,
        "end_offset":   None,
        "similarity":   None,
        "method":       None,
    }


# ── Public API ────────────────────────────────────────────────────────────────

def compute_provenance_for_map(db: Session, map_obj: MAP, circular_content: str) -> MAP:
    """
    Compute and persist evidence provenance for a single MAP.
    Modifies map_obj in place (caller must commit).
    """
    evidence = find_evidence(
        action          = map_obj.action or "",
        circular_content= circular_content,
        source_clause   = map_obj.source_clause,
    )

    map_obj.evidence_quote        = evidence["quote"]
    map_obj.evidence_start_offset = evidence["start_offset"]
    map_obj.evidence_end_offset   = evidence["end_offset"]
    map_obj.evidence_similarity   = evidence["similarity"]
    map_obj.provenance_method     = evidence["method"]
    return map_obj


def compute_provenance_for_circular(db: Session, circular_id: str) -> int:
    """
    (Re)compute provenance for ALL MAPs belonging to a circular.
    Returns count of MAPs updated.
    """
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular or not circular.content:
        logger.warning("Provenance: circular %s not found or has no content", circular_id)
        return 0

    maps = (
        db.query(MAP)
        .filter(MAP.circular_id == circular_id)
        .all()
    )

    updated = 0
    for m in maps:
        compute_provenance_for_map(db, m, circular.content)
        updated += 1

    if updated:
        db.commit()
        logger.info("Provenance computed for %d MAPs in circular %s", updated, circular_id)

    return updated
