"""
PRAGMA — Circulars Endpoints

Endpoints:
  POST /circulars/upload              — Upload circular text (immediate rule-based + async LLM enhancement)
  POST /circulars/upload-file         — Upload PDF/DOCX/TXT file, parse, extract MAPs
  GET  /circulars                     — List all circulars (summary)
  GET  /circulars/{id}                — Get single circular with its MAPs
  GET  /circulars/{id}/enhancement    — Poll LLM enhancement status
"""

import re
import uuid
from pathlib import PurePosixPath
from typing import List

from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.circular import Circular
from app.schemas.circular import CircularUploadRequest, CircularOut, CircularSummaryOut
from app.services.map_service import create_maps_from_extraction
from app.services.event_service import log_event
from app.services.rule_extractor import extract_maps

router = APIRouter()

# Security constants
MAX_FILE_BYTES   = 10 * 1024 * 1024   # 10 MB — hard limit; protects PyMuPDF from DoS
MAX_TEXT_CHARS   = 200_000            # ~150 pages of regulatory text
MAX_TITLE_CHARS  = 300
MAX_SOURCE_CHARS = 50
MAX_PDF_PAGES    = 100                # passed to document_parser

# Allowed MIME types mapped to expected extensions
_ALLOWED_MIME = {
    "application/pdf":                                         {"pdf"},
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {"docx"},
    "application/msword":                                      {"doc"},
    "text/plain":                                              {"txt"},
    "application/octet-stream":                                {"pdf", "docx", "doc", "txt"},  # browser fallback
}
_ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt"}


def _sanitize_text_input(text: str) -> str:
    """
    Strip characters that could be used for prompt injection or stored XSS.
    Keeps all printable content; removes null bytes and excessive control chars.
    """
    # Remove null bytes (used in path traversal and binary injection)
    text = text.replace("\x00", "")
    # Collapse runs of more than 3 consecutive blank lines (preserves structure)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text


def _validate_upload_meta(title: str, source: str) -> None:
    """Raise 422 if title/source exceed safe lengths or contain control chars."""
    if len(title.strip()) < 5:
        raise HTTPException(status_code=422, detail="Title must be at least 5 characters")
    if len(title) > MAX_TITLE_CHARS:
        raise HTTPException(status_code=422, detail=f"Title exceeds {MAX_TITLE_CHARS} character limit")
    if len(source) > MAX_SOURCE_CHARS:
        raise HTTPException(status_code=422, detail=f"Source exceeds {MAX_SOURCE_CHARS} character limit")
    # Block source values that look like path segments (path traversal defence)
    if re.search(r"[/\\<>]", source):
        raise HTTPException(status_code=422, detail="Source contains invalid characters")


def _persist_and_extract(
    db: Session,
    title: str,
    source: str,
    content: str,
    background_tasks: BackgroundTasks | None = None,
) -> dict:
    """
    Shared logic: save circular → rule-based extraction → return immediately.
    If BackgroundTasks provided and Ollama is configured, kick off async LLM enhancement.
    """
    from app.services.enhancement_service import run_enhancement, get_status
    from app.config import settings

    # ── Rule-based extraction (always synchronous, <1s) ───────────────────────
    raw_maps = extract_maps(content)
    engine_used = "rule_based"

    circular = Circular(title=title, source=source, content=content, status="processed")
    db.add(circular)
    db.commit()
    db.refresh(circular)

    log_event(
        db=db,
        event_type="circular_uploaded",
        description=f"Circular '{title}' uploaded and processed",
        circular_id=circular.id,
    )

    created_maps = create_maps_from_extraction(db, circular.id, raw_maps)

    log_event(
        db=db,
        event_type="maps_extracted",
        description=f"PRAGMA Intelligence Engine extracted {len(created_maps)} MAPs from '{title}'",
        circular_id=circular.id,
    )

    # ── Async LLM enhancement (non-blocking — Ollama only, skipped when rule_based forced) ──
    enhancement_status = "none"
    if background_tasks and settings.AI_ENGINE != "rule_based":
        circular_id_str = str(circular.id)
        background_tasks.add_task(run_enhancement, circular_id_str, content)
        enhancement_status = "pending"
        log_event(
            db=db,
            event_type="enhancement_queued",
            description="LLM enhancement queued — MAPs will be updated asynchronously",
            circular_id=circular.id,
        )

    return {
        "success":            True,
        "circular_id":        str(circular.id),
        "maps_count":         len(created_maps),
        "engine_used":        engine_used,
        "enhancement_status": enhancement_status,
        "maps": [
            {
                "action":           m.action,
                "department":       m.department.name if m.department else None,
                "priority":         m.priority,
                "deadline":         m.deadline.isoformat() if m.deadline else None,
                "source_clause":    m.source_clause,
                "confidence_score": m.confidence_score,
                "validation_notes": m.validation_notes,
            }
            for m in created_maps
        ],
    }


@router.post("/upload")
async def upload_circular(
    payload:            CircularUploadRequest,
    background_tasks:   BackgroundTasks,
    db:                 Session = Depends(get_db),
):
    """
    Upload circular as JSON text body.
    Returns immediately with rule-based MAPs.
    If Ollama is configured, LLM enhancement runs asynchronously in background.
    """
    _validate_upload_meta(payload.title, payload.source)

    content = _sanitize_text_input(payload.content)
    if len(content) > MAX_TEXT_CHARS:
        raise HTTPException(
            status_code=413,
            detail=f"Text content exceeds {MAX_TEXT_CHARS // 1000}K character limit"
        )
    if len(content.strip()) < 50:
        raise HTTPException(status_code=422, detail="Content is too short to extract obligations from")

    try:
        return _persist_and_extract(db, payload.title.strip(), payload.source.strip(), content, background_tasks)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-file")
async def upload_circular_file(
    file:             UploadFile   = File(...),
    title:            str          = Form(...),
    source:           str          = Form("RBI"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db:               Session      = Depends(get_db),
):
    """
    Upload a PDF, DOCX, DOC, or TXT file.
    Parsed locally via PyMuPDF / python-docx — zero internet required.

    Security controls:
    - Max 10 MB file size
    - Allowlist of file extensions (pdf, docx, doc, txt)
    - MIME type cross-check
    - Filename sanitized (path traversal prevention)
    - Null byte removal from extracted text
    """
    # ── 1. Size gate (read up to limit + 1 to detect oversize without loading whole file) ──
    raw = await file.read()
    if len(raw) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit")
    if not raw:
        raise HTTPException(status_code=422, detail="Uploaded file is empty")

    # ── 2. Metadata validation ─────────────────────────────────────────────────
    _validate_upload_meta(title, source)

    # ── 3. Extension allowlist (use only the final extension, strip path segments) ──
    safe_name = PurePosixPath(file.filename or "upload.txt").name  # drops any directory prefix
    ext = safe_name.rsplit(".", 1)[-1].lower() if "." in safe_name else ""
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '.{ext}'. Accepted: PDF, DOCX, DOC, TXT"
        )

    # ── 4. MIME type cross-check ───────────────────────────────────────────────
    content_type = (file.content_type or "application/octet-stream").split(";")[0].strip().lower()
    allowed_exts_for_mime = _ALLOWED_MIME.get(content_type, set())
    if allowed_exts_for_mime and ext not in allowed_exts_for_mime:
        raise HTTPException(
            status_code=415,
            detail=f"MIME type '{content_type}' does not match file extension '.{ext}'"
        )

    # ── 5. Parse document to text (offline, text-only) ─────────────────────────
    try:
        from app.services.document_parser import parse_document
        content = parse_document(safe_name, raw, max_pages=MAX_PDF_PAGES)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document parsing failed: {e}")

    if not content.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from uploaded file")

    # ── 6. Sanitize extracted text ─────────────────────────────────────────────
    content = _sanitize_text_input(content)
    if len(content) > MAX_TEXT_CHARS:
        content = content[:MAX_TEXT_CHARS]  # truncate rather than reject (document may be oversized)

    try:
        return _persist_and_extract(db, title.strip(), source.strip(), content, background_tasks)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[CircularSummaryOut])
async def list_circulars(db: Session = Depends(get_db)):
    """List all uploaded circulars (summary only, no content/maps)."""
    return db.query(Circular).order_by(Circular.uploaded_at.desc()).all()


@router.get("/{circular_id}/enhancement")
async def get_enhancement_status(circular_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Poll LLM enhancement status for a circular.

    Returns:
      status: "none" | "pending" | "complete" | "failed" | "skipped"
      ai_enhanced: bool — true if MAPs have been updated by LLM
      model: active Ollama model name if complete
    """
    from app.services.enhancement_service import get_status
    from app.services.ollama_service import get_active_model

    circular = db.query(Circular).filter(Circular.id == str(circular_id)).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")

    mem_status = get_status(str(circular_id))
    # Also reflect DB status if enhancement completed in a previous session
    ai_enhanced = circular.status == "ai_enhanced"
    if ai_enhanced and mem_status == "none":
        mem_status = "complete"

    return {
        "circular_id":  str(circular_id),
        "status":       mem_status,
        "ai_enhanced":  ai_enhanced,
        "model":        get_active_model() if mem_status == "complete" else None,
    }


@router.get("/{circular_id}", response_model=CircularOut)
async def get_circular(circular_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a single circular with its extracted MAPs."""
    circular = db.query(Circular).filter(Circular.id == str(circular_id)).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")
    return circular
