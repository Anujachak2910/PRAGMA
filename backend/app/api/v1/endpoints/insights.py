"""
PRAGMA — Compliance Intelligence Endpoints

POST /insights/diff      — Regulatory change diff between two circular versions
GET  /insights/conflicts — Cross-regulator conflict detection across all circulars
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter()


class DiffRequest(BaseModel):
    circular_a_id: str
    circular_b_id: str


@router.post("/diff")
async def circular_diff(payload: DiffRequest, db: Session = Depends(get_db)):
    """
    Compare regulatory obligations between two circular versions.

    Returns a structured diff: new obligations added, obligations removed,
    obligations modified (deadline / department / priority changes), and
    obligations that are unchanged.

    Entirely deterministic — no LLM required.
    """
    if payload.circular_a_id == payload.circular_b_id:
        raise HTTPException(status_code=422, detail="Both circular IDs are the same — nothing to compare")

    try:
        from app.services.diff_service import compute_diff
        result = compute_diff(db, payload.circular_a_id, payload.circular_b_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diff computation failed: {str(e)}")


@router.get("/conflicts")
async def get_conflicts(db: Session = Depends(get_db)):
    """
    Detect cross-regulator conflicts across all ingested circulars.

    Identifies:
    - Overlapping obligations (same department, similar action, different regulator)
    - Deadline clashes (overlapping deadlines within 60 days)
    - Priority mismatches (same obligation rated differently by two regulators)
    - Workload surges (3+ obligations from 2+ regulators in 90-day window)

    Entirely deterministic — no LLM required.
    """
    try:
        from app.services.conflict_service import detect_conflicts
        return detect_conflicts(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conflict detection failed: {str(e)}")
