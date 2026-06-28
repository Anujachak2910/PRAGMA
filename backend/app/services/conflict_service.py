"""
PRAGMA — Cross-Regulator Conflict Detection

Surfaces where two regulators (e.g. RBI and SEBI) impose overlapping or
potentially conflicting obligations on the same department, within the same
timeframe.

Types of conflict detected:
  1. OVERLAP        — Same department, similar action text (Jaccard ≥ 0.35),
                      different regulators. May require consolidation.
  2. DEADLINE_CLASH — Same department, similar action, deadlines within 60 days
                      of each other. Compressed implementation window.
  3. PRIORITY_MISMATCH — One regulator marks the obligation Critical,
                         another marks a similar one Low/Medium.
  4. WORKLOAD_SURGE  — A department has ≥ 3 open obligations from ≥ 2 regulators
                       due within the same 90-day window.

Algorithm is deterministic — no LLM required.
"""

import re
from collections import defaultdict
from datetime import date, timedelta
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.circular import Circular
from app.models.map import MAP

_STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "in", "to", "for", "is", "are",
    "be", "been", "by", "with", "at", "from", "this", "that", "on", "as",
    "its", "it", "was", "will", "has", "have", "had", "not", "any", "all",
    "their", "which", "who", "they", "we", "you", "i", "he", "she",
}

OVERLAP_THRESHOLD  = 0.35   # Jaccard ≥ 35%: same obligation territory
DEADLINE_WINDOW_DAYS = 60   # deadlines within 60 days = clash
SURGE_WINDOW_DAYS    = 90   # 3+ obligations in 90 days = workload surge
PRIORITY_ORDER = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-z]{3,}", (text or "").lower())
    return {w for w in words if w not in _STOPWORDS}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    union = a | b
    return len(a & b) / len(union) if union else 0.0


def _map_snapshot(m: MAP, source: str) -> dict:
    return {
        "id":           str(m.id),
        "action":       m.action or "",
        "department":   m.department.name if m.department else "Unknown",
        "priority":     m.priority or "Low",
        "deadline":     m.deadline.isoformat() if m.deadline else None,
        "source_clause": m.source_clause or "",
        "regulator":    source,
        "circular_id":  str(m.circular_id),
    }


def detect_conflicts(db: Session) -> dict:
    """
    Scan all MAPs across all circulars from multiple regulators.
    Returns structured conflict report.
    """
    # ── Load all circulars + their MAPs ──────────────────────────────────────
    circulars = db.query(Circular).all()
    circ_by_id = {str(c.id): c for c in circulars}

    all_maps = (
        db.query(MAP)
        .options(joinedload(MAP.department))
        .filter(MAP.circular_id.isnot(None))
        .all()
    )

    # Group maps by department, with their regulator source
    dept_maps: dict[str, list[dict]] = defaultdict(list)
    for m in all_maps:
        circ = circ_by_id.get(str(m.circular_id))
        source = circ.source if circ else "Unknown"
        snap = _map_snapshot(m, source)
        dept_maps[snap["department"]].append(snap)

    overlaps:          list[dict] = []
    deadline_clashes:  list[dict] = []
    priority_mismatches: list[dict] = []
    workload_surges:   list[dict] = []

    for dept, maps in dept_maps.items():
        if len(maps) < 2:
            continue

        # ── Pairwise comparison ───────────────────────────────────────────────
        for i in range(len(maps)):
            for j in range(i + 1, len(maps)):
                a, b = maps[i], maps[j]

                # Only cross-regulator conflicts
                if a["regulator"] == b["regulator"]:
                    continue

                sim = _jaccard(_tokenize(a["action"]), _tokenize(b["action"]))
                if sim < OVERLAP_THRESHOLD:
                    continue

                conflict_base = {
                    "department":  dept,
                    "map_a":       a,
                    "map_b":       b,
                    "similarity":  round(sim, 3),
                    "regulators":  sorted({a["regulator"], b["regulator"]}),
                }

                # OVERLAP
                overlaps.append({
                    **conflict_base,
                    "type":        "overlap",
                    "severity":    "medium" if sim < 0.60 else "high",
                    "description": (
                        f"{a['regulator']} and {b['regulator']} both require {dept} "
                        f"to perform a similar obligation (similarity {sim:.0%}). "
                        "Review for consolidation opportunity."
                    ),
                })

                # DEADLINE CLASH
                if a.get("deadline") and b.get("deadline"):
                    try:
                        da = date.fromisoformat(a["deadline"])
                        db_ = date.fromisoformat(b["deadline"])
                        gap = abs((da - db_).days)
                        if gap <= DEADLINE_WINDOW_DAYS:
                            deadline_clashes.append({
                                **conflict_base,
                                "type":        "deadline_clash",
                                "severity":    "high",
                                "gap_days":    gap,
                                "description": (
                                    f"{dept} faces overlapping deadlines: "
                                    f"{a['regulator']} requires by {a['deadline']}, "
                                    f"{b['regulator']} requires by {b['deadline']} "
                                    f"({gap} day gap). Compressed implementation window."
                                ),
                            })
                    except ValueError:
                        pass

                # PRIORITY MISMATCH
                pa = PRIORITY_ORDER.get(a["priority"], 1)
                pb = PRIORITY_ORDER.get(b["priority"], 1)
                if abs(pa - pb) >= 2:   # at least 2 levels apart
                    high_map, low_map = (a, b) if pa > pb else (b, a)
                    priority_mismatches.append({
                        **conflict_base,
                        "type":        "priority_mismatch",
                        "severity":    "medium",
                        "description": (
                            f"{high_map['regulator']} rates this {dept} obligation as "
                            f"'{high_map['priority']}' but {low_map['regulator']} "
                            f"rates a similar one as '{low_map['priority']}'. "
                            "Align internal priority classification."
                        ),
                    })

        # ── Workload surge detection ──────────────────────────────────────────
        today = date.today()
        surge_window_end = today + timedelta(days=SURGE_WINDOW_DAYS)
        upcoming = [
            m for m in maps
            if m.get("deadline")
            and _safe_date(m["deadline"])
            and today <= _safe_date(m["deadline"]) <= surge_window_end
        ]
        regulators_in_surge = {m["regulator"] for m in upcoming}
        if len(upcoming) >= 3 and len(regulators_in_surge) >= 2:
            workload_surges.append({
                "department":    dept,
                "type":          "workload_surge",
                "severity":      "high",
                "maps_count":    len(upcoming),
                "regulators":    sorted(regulators_in_surge),
                "window_days":   SURGE_WINDOW_DAYS,
                "maps":          upcoming,
                "description": (
                    f"{dept} has {len(upcoming)} obligations from "
                    f"{', '.join(sorted(regulators_in_surge))} due within "
                    f"{SURGE_WINDOW_DAYS} days. High implementation risk."
                ),
            })

    # ── Regulator pair summary ────────────────────────────────────────────────
    regulator_pairs: dict[str, int] = defaultdict(int)
    for item in overlaps + deadline_clashes + priority_mismatches:
        key = " vs ".join(item.get("regulators", []))
        regulator_pairs[key] += 1

    total_conflicts = len(overlaps) + len(deadline_clashes) + len(priority_mismatches) + len(workload_surges)
    overall_severity = "low"
    if any(c["severity"] == "high" for c in overlaps + deadline_clashes + workload_surges):
        overall_severity = "high"
    elif total_conflicts > 0:
        overall_severity = "medium"

    return {
        "summary": {
            "total_conflicts":     total_conflicts,
            "overlaps":            len(overlaps),
            "deadline_clashes":    len(deadline_clashes),
            "priority_mismatches": len(priority_mismatches),
            "workload_surges":     len(workload_surges),
            "overall_severity":    overall_severity,
            "regulator_pairs":     dict(regulator_pairs),
        },
        "overlaps":           overlaps,
        "deadline_clashes":   deadline_clashes,
        "priority_mismatches": priority_mismatches,
        "workload_surges":    workload_surges,
    }


def _safe_date(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    try:
        return date.fromisoformat(s)
    except ValueError:
        return None
