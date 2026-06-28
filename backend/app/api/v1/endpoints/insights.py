"""
PRAGMA — Compliance Intelligence Endpoints

POST /insights/diff                    — Regulatory change diff between two circular versions
GET  /insights/conflicts               — Cross-regulator conflict detection across all circulars
GET  /insights/cost/{circular_id}      — Cost intelligence for a single circular
GET  /insights/cost/portfolio          — Portfolio-level cost aggregation (all circulars)
POST /insights/provenance/{circular_id}— Recompute clause provenance for all MAPs in a circular
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter()


# ── Diff ──────────────────────────────────────────────────────────────────────

class DiffRequest(BaseModel):
    circular_a_id: str
    circular_b_id: str


@router.post("/diff")
async def circular_diff(payload: DiffRequest, db: Session = Depends(get_db)):
    """
    Compare regulatory obligations between two circular versions.

    Returns structured diff: added, removed, modified, unchanged obligations.
    Entirely deterministic — no LLM required.
    """
    if payload.circular_a_id == payload.circular_b_id:
        raise HTTPException(status_code=422, detail="Both circular IDs are the same — nothing to compare")

    try:
        from app.services.diff_service import compute_diff
        return compute_diff(db, payload.circular_a_id, payload.circular_b_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diff computation failed: {str(e)}")


# ── Conflicts ─────────────────────────────────────────────────────────────────

@router.get("/conflicts")
async def get_conflicts(db: Session = Depends(get_db)):
    """
    Detect cross-regulator conflicts across all ingested circulars.

    Identifies overlapping obligations, deadline clashes, priority mismatches,
    and workload surges across RBI, SEBI, MCA, and other regulators.
    Entirely deterministic — no LLM required.
    """
    try:
        from app.services.conflict_service import detect_conflicts
        return detect_conflicts(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conflict detection failed: {str(e)}")


# ── Cost Intelligence ─────────────────────────────────────────────────────────

@router.get("/cost/portfolio")
async def cost_portfolio(db: Session = Depends(get_db)):
    """
    Portfolio-level compliance cost intelligence across all ingested circulars.

    Returns aggregated cost, person-days, penalty exposure, and ROI.
    No AI required — pure arithmetic on existing MAP data.
    Latency: < 20 ms.
    """
    try:
        from app.services.cost_service import calculate_portfolio_cost
        return calculate_portfolio_cost(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portfolio cost calculation failed: {str(e)}")


@router.get("/cost/{circular_id}")
async def cost_circular(circular_id: str, db: Session = Depends(get_db)):
    """
    Compliance cost intelligence for a single circular.

    Returns per-MAP and per-department cost breakdown, effort estimates,
    penalty exposure, and ROI. No AI required.
    Latency: < 20 ms.
    """
    try:
        from app.services.cost_service import calculate_circular_cost
        return calculate_circular_cost(db, circular_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cost calculation failed: {str(e)}")


# ── Clause Provenance ─────────────────────────────────────────────────────────

@router.post("/provenance/{circular_id}")
async def recompute_provenance(circular_id: str, db: Session = Depends(get_db)):
    """
    (Re)compute clause provenance for all MAPs in a circular.

    For each MAP, finds the exact sentence in the circular text that triggered
    the extraction. Stores character offsets for frontend highlighting.
    Entirely deterministic — no LLM required. Latency: < 200 ms per circular.
    """
    try:
        from app.services.provenance_service import compute_provenance_for_circular
        updated = compute_provenance_for_circular(db, circular_id)
        return {
            "success": True,
            "circular_id": circular_id,
            "maps_updated": updated,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Provenance computation failed: {str(e)}")
