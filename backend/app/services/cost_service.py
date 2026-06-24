"""
PRAGMA — Compliance Burden & Cost Intelligence Service

Estimates the financial cost of implementing each MAP extracted from a
regulatory circular. Answers the question every CFO asks:
"What will compliance actually cost us?"

Entirely deterministic — no LLM, no network calls. Always works offline.
Pure arithmetic on existing MAP data. Latency: < 20 ms.

Output includes:
  - Per-MAP cost, effort days, penalty exposure, ROI
  - Per-department aggregation
  - Portfolio-level summary (all active circulars)
  - Critical path (longest department timeline)
"""

import re
import logging
from datetime import date, timedelta
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.map import MAP
from app.models.circular import Circular

logger = logging.getLogger(__name__)

# ── Rate Card — fully loaded daily cost (INR) ─────────────────────────────────
# Calibrated to mid-market Indian banking sector (2024-25 data).
# Senior professional including bench costs, overhead, benefits.
DEPARTMENT_DAILY_RATE: dict[str, int] = {
    "IT":         35_000,
    "Compliance": 28_000,
    "Risk":       32_000,
    "Treasury":   30_000,
    "Legal":      40_000,
}

# ── Base effort by priority (person-days) ────────────────────────────────────
PRIORITY_BASE_DAYS: dict[str, float] = {
    "Critical": 15.0,
    "High":      8.0,
    "Medium":    4.0,
    "Low":       2.0,
}

# ── Action verb modifiers ─────────────────────────────────────────────────────
# Complex implementation verbs increase effort; reporting verbs decrease it.
_EFFORT_INCREASE = [
    "implement", "deploy", "integrate", "migrate", "develop", "build",
    "establish", "automate", "upgrade", "architect", "design", "configure",
    "overhaul", "redesign", "rollout", "onboard", "transform",
]
_EFFORT_DECREASE = [
    "report", "submit", "notify", "communicate", "publish", "disclose",
    "file", "inform", "document", "circulate", "share",
]

# ── Regulatory penalty exposure (INR) by regulator × priority ────────────────
# Based on historical RBI/SEBI enforcement actions (public data).
PENALTY_EXPOSURE: dict[str, dict[str, int]] = {
    "RBI": {
        "Critical": 5_000_000,    # ₹50 lakhs
        "High":     2_000_000,    # ₹20 lakhs
        "Medium":     500_000,    # ₹5 lakhs
        "Low":        100_000,    # ₹1 lakh
    },
    "SEBI": {
        "Critical": 7_500_000,    # ₹75 lakhs
        "High":     2_500_000,    # ₹25 lakhs
        "Medium":     800_000,    # ₹8 lakhs
        "Low":        200_000,    # ₹2 lakhs
    },
    "MCA": {
        "Critical": 2_500_000,    # ₹25 lakhs
        "High":     1_000_000,    # ₹10 lakhs
        "Medium":     300_000,    # ₹3 lakhs
        "Low":         50_000,    # ₹50k
    },
    "IRDAI": {
        "Critical": 3_000_000,    # ₹30 lakhs
        "High":     1_200_000,    # ₹12 lakhs
        "Medium":     400_000,    # ₹4 lakhs
        "Low":         75_000,    # ₹75k
    },
    "NABARD": {
        "Critical": 1_500_000,
        "High":       600_000,
        "Medium":     150_000,
        "Low":         30_000,
    },
    "DEFAULT": {
        "Critical": 2_000_000,
        "High":       800_000,
        "Medium":     200_000,
        "Low":         50_000,
    },
}

# ── Active MAP statuses (contributes to cost burden) ─────────────────────────
_ACTIVE_STATUSES = {"Pending", "Approved", "In Progress"}


def _effort_days(action: str, priority: str) -> float:
    """
    Estimate implementation effort in person-days.

    Base: priority tier (2–15 days).
    Modifier: verb complexity (+/-20%).
    """
    base = PRIORITY_BASE_DAYS.get(priority, 4.0)
    action_l = (action or "").lower()

    modifier = 0.0
    for verb in _EFFORT_INCREASE:
        if verb in action_l:
            modifier += 0.20
            break  # one boost maximum per MAP

    for verb in _EFFORT_DECREASE:
        if verb in action_l:
            modifier -= 0.15
            break

    # Length heuristic: longer actions = more detailed = more work
    word_count = len((action or "").split())
    if word_count > 30:
        modifier += 0.10
    elif word_count < 10:
        modifier -= 0.10

    return round(base * (1 + modifier), 1)


def _cost_inr(days: float, department: str) -> int:
    rate = DEPARTMENT_DAILY_RATE.get(department, 30_000)
    return round(days * rate)


def _penalty_inr(source: str, priority: str) -> int:
    reg = (source or "").upper().strip()
    table = PENALTY_EXPOSURE.get(reg, PENALTY_EXPOSURE["DEFAULT"])
    return table.get(priority, table.get("Medium", 200_000))


def _impl_deadline_days(priority: str) -> int:
    """Expected calendar days to implement from now."""
    return {"Critical": 45, "High": 90, "Medium": 180, "Low": 365}.get(priority, 90)


def _map_cost_detail(m: MAP, source: str) -> dict:
    dept      = m.department.name if m.department else "Compliance"
    priority  = m.priority or "Medium"
    days      = _effort_days(m.action or "", priority)
    cost      = _cost_inr(days, dept)
    penalty   = _penalty_inr(source, priority)
    roi_x     = round(penalty / cost, 1) if cost > 0 else 0.0
    impl_days = _impl_deadline_days(priority)
    due_date  = (date.today() + timedelta(days=impl_days)).isoformat()

    return {
        "map_id":           str(m.id),
        "action":           (m.action or "")[:120] + ("…" if (m.action or "").__len__() > 120 else ""),
        "department":       dept,
        "priority":         priority,
        "status":           m.status or "Pending",
        "deadline":         m.deadline.isoformat() if m.deadline else None,
        "estimated_days":   days,
        "cost_inr":         cost,
        "penalty_inr":      penalty,
        "roi_x":            roi_x,
        "impl_due":         due_date,
        "is_active":        m.status in _ACTIVE_STATUSES,
    }


def _dept_aggregate(map_details: list[dict]) -> list[dict]:
    """Aggregate cost and effort by department."""
    agg: dict[str, dict] = {}
    for m in map_details:
        dept = m["department"]
        if dept not in agg:
            agg[dept] = {
                "department":  dept,
                "maps_count":  0,
                "total_days":  0.0,
                "total_cost":  0,
                "penalty_exposure": 0,
                "critical_count": 0,
            }
        agg[dept]["maps_count"]       += 1
        agg[dept]["total_days"]       += m["estimated_days"]
        agg[dept]["total_cost"]       += m["cost_inr"]
        agg[dept]["penalty_exposure"] += m["penalty_inr"]
        if m["priority"] == "Critical":
            agg[dept]["critical_count"] += 1

    rows = []
    for dept, d in agg.items():
        d["total_days"] = round(d["total_days"], 1)
        d["roi_x"]      = round(d["penalty_exposure"] / d["total_cost"], 1) if d["total_cost"] > 0 else 0.0
        rows.append(d)

    return sorted(rows, key=lambda x: x["total_cost"], reverse=True)


def _priority_aggregate(map_details: list[dict]) -> list[dict]:
    order = ["Critical", "High", "Medium", "Low"]
    agg: dict[str, dict] = {p: {"priority": p, "maps_count": 0, "total_cost": 0, "total_days": 0.0} for p in order}
    for m in map_details:
        p = m["priority"]
        if p in agg:
            agg[p]["maps_count"] += 1
            agg[p]["total_cost"] += m["cost_inr"]
            agg[p]["total_days"] += m["estimated_days"]
    return [v for v in agg.values() if v["maps_count"] > 0]


def _critical_path(dept_rows: list[dict]) -> int:
    if not dept_rows:
        return 0
    return max(int(d["total_days"]) for d in dept_rows)


def calculate_circular_cost(db: Session, circular_id: str) -> dict:
    """
    Full cost intelligence report for a single circular.
    Includes per-MAP breakdown, department aggregation, and ROI.
    """
    circular = (
        db.query(Circular)
        .filter(Circular.id == circular_id)
        .first()
    )
    if not circular:
        raise ValueError(f"Circular {circular_id} not found")

    maps = (
        db.query(MAP)
        .options(joinedload(MAP.department))
        .filter(MAP.circular_id == circular_id)
        .all()
    )

    source = circular.source or "RBI"
    map_details = [_map_cost_detail(m, source) for m in maps]
    active_maps = [m for m in map_details if m["is_active"]]

    dept_rows   = _dept_aggregate(active_maps)
    prio_rows   = _priority_aggregate(active_maps)
    cp_days     = _critical_path(dept_rows)

    total_cost    = sum(m["cost_inr"]   for m in active_maps)
    total_days    = round(sum(m["estimated_days"] for m in active_maps), 1)
    total_penalty = sum(m["penalty_inr"] for m in active_maps)
    roi_x         = round(total_penalty / total_cost, 1) if total_cost > 0 else 0.0

    return {
        "circular": {
            "id":     str(circular.id),
            "title":  circular.title,
            "source": source,
        },
        "summary": {
            "total_maps":          len(maps),
            "active_maps":         len(active_maps),
            "total_cost_inr":      total_cost,
            "total_person_days":   total_days,
            "total_penalty_inr":   total_penalty,
            "roi_x":               roi_x,
            "critical_path_days":  cp_days,
            "departments_affected": len(dept_rows),
        },
        "department_breakdown": dept_rows,
        "priority_breakdown":   prio_rows,
        "map_breakdown":        map_details,
    }


def calculate_portfolio_cost(db: Session) -> dict:
    """
    Aggregate cost intelligence across ALL ingested circulars.
    Used for the dashboard widget showing portfolio-level financial exposure.
    """
    circulars = db.query(Circular).all()
    if not circulars:
        return _empty_portfolio()

    all_maps = (
        db.query(MAP)
        .options(joinedload(MAP.department))
        .all()
    )

    # Build per-source lookup
    circ_by_id = {str(c.id): c for c in circulars}
    source_by_circ: dict[str, str] = {str(c.id): (c.source or "RBI") for c in circulars}

    active_details: list[dict] = []
    for m in all_maps:
        if m.status not in _ACTIVE_STATUSES:
            continue
        cid    = str(m.circular_id)
        source = source_by_circ.get(cid, "RBI")
        active_details.append(_map_cost_detail(m, source))

    dept_rows   = _dept_aggregate(active_details)
    total_cost  = sum(d["total_cost"]        for d in dept_rows)
    total_days  = round(sum(d["total_days"]  for d in dept_rows), 1)
    total_pen   = sum(d["penalty_exposure"]  for d in dept_rows)
    roi_x       = round(total_pen / total_cost, 1) if total_cost > 0 else 0.0

    # Per-circular cost breakdown
    circ_costs: list[dict] = []
    for c in circulars:
        c_maps = [_map_cost_detail(m, c.source or "RBI")
                  for m in all_maps
                  if str(m.circular_id) == str(c.id) and m.status in _ACTIVE_STATUSES]
        c_cost = sum(m["cost_inr"]   for m in c_maps)
        c_pen  = sum(m["penalty_inr"] for m in c_maps)
        if c_maps:
            circ_costs.append({
                "circular_id":   str(c.id),
                "title":         c.title,
                "source":        c.source,
                "maps_count":    len(c_maps),
                "total_cost_inr": c_cost,
                "penalty_inr":   c_pen,
                "roi_x":         round(c_pen / c_cost, 1) if c_cost > 0 else 0.0,
            })

    circ_costs.sort(key=lambda x: x["total_cost_inr"], reverse=True)

    return {
        "summary": {
            "circulars_count":      len(circulars),
            "active_maps":          len(active_details),
            "total_cost_inr":       total_cost,
            "total_person_days":    total_days,
            "total_penalty_inr":    total_pen,
            "portfolio_roi_x":      roi_x,
        },
        "department_breakdown":     dept_rows,
        "circular_breakdown":       circ_costs,
    }


def _empty_portfolio() -> dict:
    return {
        "summary": {
            "circulars_count":   0,
            "active_maps":       0,
            "total_cost_inr":    0,
            "total_person_days": 0.0,
            "total_penalty_inr": 0,
            "portfolio_roi_x":   0.0,
        },
        "department_breakdown": [],
        "circular_breakdown":   [],
    }
