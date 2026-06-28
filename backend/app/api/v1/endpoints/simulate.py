"""
PRAGMA — Compliance Impact Simulator Endpoint

POST /simulate

Analyzes a regulatory circular WITHOUT saving it to the database.
Predicts full compliance impact: affected departments, implementation effort,
risk score, timeline, priority sequence, and overlap with existing obligations.

This is a key demo USP — shows predictive intelligence before formal ingestion.
"""

from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services.ai_engine import extract_maps
from app.models.map import MAP
from app.models.department import Department

router = APIRouter()

# Effort weights in person-weeks per MAP by priority
EFFORT_WEEKS = {
    "Critical": 4.0,
    "High":     2.0,
    "Medium":   1.0,
    "Low":      0.5,
}

# Risk score contribution per MAP priority
RISK_POINTS = {
    "Critical": 10,
    "High":      5,
    "Medium":    2,
    "Low":       1,
}


class SimulateRequest(BaseModel):
    title:   str
    source:  Optional[str] = "RBI"
    content: str


@router.post("")
async def simulate_impact(payload: SimulateRequest, db: Session = Depends(get_db)):
    """
    Predict compliance impact of a regulatory circular without persisting data.

    Returns:
      - extracted_maps      : AI-extracted MAPs (not saved)
      - engine_used         : "ollama" | "rule_based"
      - affected_departments: list of dept names + per-dept stats
      - effort_summary      : total and per-department effort in person-weeks
      - risk_score          : 0-100 composite risk score
      - risk_level          : "Critical" | "High" | "Medium" | "Low"
      - implementation_sequence: MAPs sorted by urgency for planning
      - estimated_completion: projected completion date
      - overlap_analysis    : matching existing MAPs in DB (same dept + keywords)
      - summary             : plain-language impact summary
    """
    if not payload.content or len(payload.content.strip()) < 50:
        raise HTTPException(status_code=422, detail="Circular content too short for analysis")

    # ── Extract MAPs (not saved) ───────────────────────────────────────────────
    try:
        raw_maps, engine_used = extract_maps(payload.content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {exc}")

    if not raw_maps:
        raise HTTPException(status_code=422, detail="No actionable obligations found in circular")

    # ── Department analysis ────────────────────────────────────────────────────
    dept_stats: dict[str, dict] = {}
    for m in raw_maps:
        dept = m["department"]
        if dept not in dept_stats:
            dept_stats[dept] = {
                "department":    dept,
                "map_count":     0,
                "critical":      0,
                "high":          0,
                "medium":        0,
                "low":           0,
                "effort_weeks":  0.0,
                "risk_points":   0,
                "earliest_deadline": None,
            }
        s = dept_stats[dept]
        s["map_count"] += 1
        prio = m.get("priority", "Medium")
        s[prio.lower()] = s.get(prio.lower(), 0) + 1
        s["effort_weeks"]  += EFFORT_WEEKS.get(prio, 1.0)
        s["risk_points"]   += RISK_POINTS.get(prio, 2)

        dl = m.get("deadline")
        if dl:
            if s["earliest_deadline"] is None or dl < s["earliest_deadline"]:
                s["earliest_deadline"] = dl

    affected_departments = sorted(
        dept_stats.values(),
        key=lambda d: d["risk_points"],
        reverse=True,
    )

    # ── Effort summary ─────────────────────────────────────────────────────────
    total_effort = sum(EFFORT_WEEKS.get(m.get("priority", "Medium"), 1.0) for m in raw_maps)
    # Departments work in parallel — effective duration = max single-dept effort
    parallel_duration = max((d["effort_weeks"] for d in affected_departments), default=1.0)

    # ── Risk score (0-100) ────────────────────────────────────────────────────
    raw_risk = sum(RISK_POINTS.get(m.get("priority", "Medium"), 2) for m in raw_maps)
    # Normalise: 50 points = score of 100 (very high-risk circular)
    risk_score = min(100, round(raw_risk / 50 * 100))
    risk_level = (
        "Critical" if risk_score >= 75 else
        "High"     if risk_score >= 50 else
        "Medium"   if risk_score >= 25 else
        "Low"
    )

    # ── Implementation sequence (sorted by urgency) ────────────────────────────
    PRIO_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    sequence = sorted(
        raw_maps,
        key=lambda m: (
            PRIO_ORDER.get(m.get("priority", "Medium"), 2),
            m.get("deadline") or "9999-12-31",
        ),
    )
    implementation_sequence = [
        {
            "step":       i + 1,
            "action":     m["action"],
            "department": m["department"],
            "priority":   m.get("priority", "Medium"),
            "deadline":   m.get("deadline"),
            "effort_weeks": EFFORT_WEEKS.get(m.get("priority", "Medium"), 1.0),
        }
        for i, m in enumerate(sequence)
    ]

    # ── Estimated completion ───────────────────────────────────────────────────
    today = date.today()
    # Add 1 week overhead + parallel execution duration (rounded up to whole weeks)
    weeks_needed = round(parallel_duration + 1)
    estimated_completion = (today + timedelta(weeks=weeks_needed)).isoformat()

    # ── Overlap analysis — check existing DB MAPs ──────────────────────────────
    existing_maps = db.query(MAP).all()
    overlaps = []
    for new_map in raw_maps:
        new_words = set(new_map["action"].lower().split())
        dept      = new_map["department"]
        for ex in existing_maps:
            ex_dept = None
            if ex.department:
                ex_dept = ex.department.name
            else:
                # Try to resolve via FK
                d = db.query(Department).filter(Department.id == ex.department_id).first()
                if d:
                    ex_dept = d.name

            if ex_dept != dept:
                continue

            ex_words = set(ex.action.lower().split())
            overlap_ratio = len(new_words & ex_words) / max(len(new_words | ex_words), 1)
            if overlap_ratio > 0.3:
                overlaps.append({
                    "existing_map_id":     str(ex.id),
                    "existing_action":     ex.action[:120],
                    "existing_status":     ex.status,
                    "new_action":          new_map["action"][:120],
                    "department":          dept,
                    "overlap_score":       round(overlap_ratio * 100),
                })

    # ── Plain-language summary ────────────────────────────────────────────────
    dept_names_list = ", ".join(d["department"] for d in affected_departments)
    critical_count  = sum(1 for m in raw_maps if m.get("priority") == "Critical")
    high_count      = sum(1 for m in raw_maps if m.get("priority") == "High")

    summary = (
        f"This {payload.source} circular generates {len(raw_maps)} compliance obligations "
        f"across {len(affected_departments)} department{'s' if len(affected_departments) != 1 else ''} "
        f"({dept_names_list}). "
    )
    if critical_count:
        summary += f"{critical_count} Critical obligation{'s require' if critical_count > 1 else ' requires'} immediate action. "
    if high_count:
        summary += f"{high_count} High-priority obligation{'s need' if high_count > 1 else ' needs'} action within 90 days. "
    summary += (
        f"Estimated implementation effort: {total_effort:.1f} person-weeks "
        f"({weeks_needed}w parallel). "
        f"Composite risk score: {risk_score}/100 ({risk_level}). "
    )
    if overlaps:
        summary += f"{len(overlaps)} potential overlap{'s' if len(overlaps) != 1 else ''} detected with existing MAPs in the register."
    else:
        summary += "No significant overlaps detected with existing obligations."

    return {
        "title":                    payload.title,
        "source":                   payload.source,
        "engine_used":              engine_used,
        "extracted_maps":           raw_maps,
        "affected_departments":     affected_departments,
        "effort_summary": {
            "total_effort_weeks":    round(total_effort, 1),
            "parallel_duration_weeks": round(parallel_duration, 1),
            "departments_count":     len(affected_departments),
        },
        "risk_score":               risk_score,
        "risk_level":               risk_level,
        "implementation_sequence":  implementation_sequence,
        "estimated_completion":     estimated_completion,
        "overlap_analysis": {
            "overlaps_found":  len(overlaps),
            "details":         overlaps[:5],   # top 5 overlaps
        },
        "summary": summary,
    }
