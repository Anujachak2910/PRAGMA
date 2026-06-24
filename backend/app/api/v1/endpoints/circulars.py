"""
PRAGMA — Circulars Endpoints

Owner: Diyasha (Backend APIs) + Anoushka (AI pipeline)
Milestone: M2

Endpoints:
  POST /circulars/upload   — Upload circular text, trigger MAP extraction
  GET  /circulars          — List all circulars with status
  GET  /circulars/{id}     — Get single circular with its MAPs
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models.circular import Circular
from app.schemas.circular import CircularUploadRequest, CircularOut, CircularSummaryOut
from app.services.ai_engine import extract_maps as ai_extract_maps
from app.services.map_service import create_maps_from_extraction
from app.services.event_service import log_event

router = APIRouter()


@router.post("/upload")
async def upload_circular(payload: CircularUploadRequest, db: Session = Depends(get_db)):
    """
    Upload circular text and trigger offline AI MAP extraction.
    Uses Ollama (local LLM) as primary engine with automatic rule-based fallback.
    """
    try:
        # Persist the circular
        circular = Circular(
            title=payload.title,
            source=payload.source,
            content=payload.content,
            status="processed",
        )
        db.add(circular)
        db.commit()
        db.refresh(circular)

        log_event(
            db=db,
            event_type="circular_uploaded",
            description=f"Circular '{payload.title}' uploaded successfully",
            circular_id=circular.id,
        )

        # Extract MAPs — Ollama primary, rule-based fallback, never fails
        raw_maps, engine_used = ai_extract_maps(payload.content)

        # Persist MAPs
        created_maps = create_maps_from_extraction(db, circular.id, raw_maps)

        return {
            "success":     True,
            "circular_id": str(circular.id),
            "maps_count":  len(created_maps),
            "engine_used": engine_used,
            "maps": [
                {
                    "action":           m.action,
                    "department":       m.department.name if m.department else None,
                    "priority":         m.priority,
                    "deadline":         m.deadline.isoformat() if m.deadline else None,
                    "validation_notes": m.validation_notes,
                }
                for m in created_maps
            ],
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[CircularSummaryOut])
async def list_circulars(db: Session = Depends(get_db)):
    """List all uploaded circulars (summary only)."""
    return db.query(Circular).order_by(Circular.uploaded_at.desc()).all()


@router.get("/{circular_id}", response_model=CircularOut)
async def get_circular(circular_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a single circular and its extracted MAPs."""
    circular = db.query(Circular).filter(Circular.id == str(circular_id)).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")
    return circular
