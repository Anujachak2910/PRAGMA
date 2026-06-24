"""
PRAGMA — Regulatory Change Diff Engine

Compares two circulars and surfaces what changed in their regulatory obligations.

Use case: A regulator updates a circular. Compliance officers need to know
immediately which MAPs changed, which are new, and which were removed —
without re-reading the entire document.

Algorithm:
  1. Fetch MAPs for both circulars from DB.
  2. Tokenize action text into word sets (stopword-free).
  3. Compute Jaccard similarity between every pair (A_i, B_j).
  4. Match pairs with similarity ≥ 0.40 (same obligation, possibly modified).
  5. Unmatched A-side = removed obligations.
  6. Unmatched B-side = new obligations.
  7. Matched pairs with any field difference = modified obligations.
  8. Matched pairs with no field difference = unchanged.

Output is deterministic — no LLM required. Always works offline.
"""

import re
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.circular import Circular
from app.models.map import MAP

# Minimal English stopwords — keep regulatory terms ("shall", "must", "report", etc.)
_STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "in", "to", "for", "is", "are",
    "be", "been", "by", "with", "at", "from", "this", "that", "on", "as",
    "its", "it", "was", "will", "has", "have", "had", "not", "any", "all",
    "their", "which", "who", "they", "we", "you", "i", "he", "she",
}

MATCH_THRESHOLD = 0.40   # Jaccard ≥ 40% = same obligation (different wording)
HIGH_MATCH      = 0.80   # ≥ 80% = essentially identical


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-z]{3,}", (text or "").lower())
    return {w for w in words if w not in _STOPWORDS}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def _map_to_dict(m: MAP) -> dict:
    return {
        "id":           str(m.id),
        "action":       m.action or "",
        "department":   m.department.name if m.department else None,
        "priority":     m.priority or "Low",
        "deadline":     m.deadline.isoformat() if m.deadline else None,
        "source_clause": m.source_clause or "",
        "confidence_score": m.confidence_score,
    }


def _fields_changed(old: dict, new: dict) -> list[str]:
    """Return list of field names that differ between two MAP snapshots."""
    check = ["department", "priority", "deadline", "source_clause"]
    changed = []
    for f in check:
        if old.get(f) != new.get(f):
            changed.append(f)
    # Treat action as changed if Jaccard < HIGH_MATCH (wording change)
    sim = _jaccard(_tokenize(old["action"]), _tokenize(new["action"]))
    if sim < HIGH_MATCH:
        changed.insert(0, "action")
    return changed


def compute_diff(
    db: Session,
    circular_a_id: str,
    circular_b_id: str,
) -> dict:
    """
    Compute the regulatory obligation diff between two circulars.

    Returns a structured diff dict ready for JSON serialisation.
    """
    circ_a = (
        db.query(Circular)
        .filter(Circular.id == circular_a_id)
        .first()
    )
    circ_b = (
        db.query(Circular)
        .filter(Circular.id == circular_b_id)
        .first()
    )

    if not circ_a:
        raise ValueError(f"Circular {circular_a_id} not found")
    if not circ_b:
        raise ValueError(f"Circular {circular_b_id} not found")

    maps_a = (
        db.query(MAP)
        .options(joinedload(MAP.department))
        .filter(MAP.circular_id == circular_a_id)
        .all()
    )
    maps_b = (
        db.query(MAP)
        .options(joinedload(MAP.department))
        .filter(MAP.circular_id == circular_b_id)
        .all()
    )

    dicts_a = [_map_to_dict(m) for m in maps_a]
    dicts_b = [_map_to_dict(m) for m in maps_b]

    tokens_a = [_tokenize(d["action"]) for d in dicts_a]
    tokens_b = [_tokenize(d["action"]) for d in dicts_b]

    # ── Greedy best-match assignment ──────────────────────────────────────────
    matched_a: set[int] = set()
    matched_b: set[int] = set()

    pairs: list[tuple[int, int, float]] = []
    for i, ta in enumerate(tokens_a):
        best_j, best_sim = -1, 0.0
        for j, tb in enumerate(tokens_b):
            if j in matched_b:
                continue
            sim = _jaccard(ta, tb)
            if sim > best_sim:
                best_sim, best_j = sim, j
        if best_j >= 0 and best_sim >= MATCH_THRESHOLD:
            pairs.append((i, best_j, best_sim))
            matched_a.add(i)
            matched_b.add(best_j)

    added:     list[dict] = []
    removed:   list[dict] = []
    modified:  list[dict] = []
    unchanged: list[dict] = []

    # ── Classify matched pairs ─────────────────────────────────────────────────
    for i, j, sim in pairs:
        old_m, new_m = dicts_a[i], dicts_b[j]
        changes = _fields_changed(old_m, new_m)
        if changes:
            modified.append({
                "old":          old_m,
                "new":          new_m,
                "similarity":   round(sim, 3),
                "changed_fields": changes,
                "impact": _deadline_impact(old_m, new_m),
            })
        else:
            unchanged.append({"map": new_m, "similarity": round(sim, 3)})

    for i, d in enumerate(dicts_a):
        if i not in matched_a:
            removed.append(d)

    for j, d in enumerate(dicts_b):
        if j not in matched_b:
            added.append(d)

    # ── Impact summary ────────────────────────────────────────────────────────
    affected_depts = sorted({
        m.get("department") for m in added + removed
        if m.get("department")
    } | {
        m["new"].get("department") for m in modified
        if m["new"].get("department")
    })

    severity = "low"
    if len(added) + len(removed) > 3 or any(
        m["new"]["priority"] == "Critical" for m in modified + [{"new": x} for x in added]
    ):
        severity = "high"
    elif added or removed or modified:
        severity = "medium"

    return {
        "circular_a": {
            "id":     str(circ_a.id),
            "title":  circ_a.title,
            "source": circ_a.source,
            "maps_count": len(dicts_a),
        },
        "circular_b": {
            "id":     str(circ_b.id),
            "title":  circ_b.title,
            "source": circ_b.source,
            "maps_count": len(dicts_b),
        },
        "summary": {
            "added":       len(added),
            "removed":     len(removed),
            "modified":    len(modified),
            "unchanged":   len(unchanged),
            "net_change":  len(added) - len(removed),
            "severity":    severity,
            "affected_departments": affected_depts,
        },
        "added":     added,
        "removed":   removed,
        "modified":  modified,
        "unchanged": unchanged,
    }


def _deadline_impact(old: dict, new: dict) -> Optional[str]:
    """Describe deadline change in plain language."""
    od, nd = old.get("deadline"), new.get("deadline")
    if od == nd:
        return None
    if od is None and nd:
        return f"New deadline introduced: {nd}"
    if od and nd is None:
        return "Deadline removed"
    if od and nd:
        try:
            old_date = date.fromisoformat(od)
            new_date = date.fromisoformat(nd)
            delta = (new_date - old_date).days
            if delta > 0:
                return f"Deadline extended by {delta} days (was {od}, now {nd})"
            elif delta < 0:
                return f"Deadline brought forward by {abs(delta)} days (was {od}, now {nd})"
        except ValueError:
            pass
    return None
