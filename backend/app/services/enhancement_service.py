"""
PRAGMA — Async LLM Enhancement Service

Architecture:
  1. Rule-based extraction runs synchronously (<1s) → uploaded MAPs returned immediately
  2. This service runs in a FastAPI BackgroundTask → enriches those MAPs with LLM
  3. On success: MAP records are updated in DB with AI-improved versions
  4. On failure: original rule-based MAPs are preserved unchanged

Enhancement status is tracked in-memory (survives requests, resets on server restart).
Status is also reflected in Circular.status field in the DB.

Status values:
  "pending"   — LLM running
  "complete"  — AI-enhanced MAPs written to DB
  "failed"    — LLM failed; original rule-based MAPs unchanged
  "skipped"   — Circular not eligible (already enhanced or content too short)
"""

import logging
import threading
from datetime import datetime, date
from typing import Optional

logger = logging.getLogger(__name__)

# Thread-safe in-memory status store: circular_id (str) → status
_lock   = threading.Lock()
_status: dict[str, str] = {}


def get_status(circular_id: str) -> str:
    """Return enhancement status for a circular. Defaults to 'none' if never queued."""
    with _lock:
        return _status.get(circular_id, "none")


def _set_status(circular_id: str, value: str) -> None:
    with _lock:
        _status[circular_id] = value


def _parse_deadline(raw) -> Optional[date]:
    if not raw or str(raw).strip().lower() in ("null", "none", "n/a", "", "–"):
        return None
    if isinstance(raw, date):
        return raw
    try:
        return datetime.strptime(str(raw).strip()[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def _build_enhanced_maps(llm_maps: list[dict], original_maps) -> list[dict]:
    """
    Merge LLM output with original rule-based MAPs.
    Returns a list of dicts ready for DB update, indexed by original MAP position.

    Strategy: If LLM returns N MAPs and originals has M MAPs, pair by index.
    Unpaired originals keep their rule-based data.
    """
    result = []
    for i, orig in enumerate(original_maps):
        if i < len(llm_maps):
            lm = llm_maps[i]
            # LLM may improve action phrasing; keep if longer/more specific
            orig_action = (orig.action or "").strip()
            llm_action  = (lm.get("action") or "").strip()
            action = llm_action if len(llm_action) > 20 else orig_action

            result.append({
                "id":               orig.id,
                "action":           action or orig_action,
                "department":       lm.get("department") or orig.department.name if orig.department else lm.get("department"),
                "priority":         lm.get("priority") or orig.priority,
                "deadline":         _parse_deadline(lm.get("deadline")) or orig.deadline,
                "source_clause":    lm.get("source_clause") or orig.source_clause,
                "confidence_score": lm.get("confidence_score") or orig.confidence_score,
                "validation_notes": lm.get("validation_notes") or orig.validation_notes,
            })
        else:
            # No LLM counterpart — keep original unchanged
            result.append({
                "id":               orig.id,
                "action":           orig.action,
                "department":       orig.department.name if orig.department else None,
                "priority":         orig.priority,
                "deadline":         orig.deadline,
                "source_clause":    orig.source_clause,
                "confidence_score": orig.confidence_score,
                "validation_notes": orig.validation_notes,
            })
    return result


def run_enhancement(circular_id: str, circular_content: str) -> None:
    """
    Background task: use Ollama LLM to enhance rule-based MAPs.
    Called via FastAPI BackgroundTasks — runs in a thread pool worker.

    DB session is opened here (not shared from the request scope).
    """
    _set_status(circular_id, "pending")
    logger.info("[enhance] Starting LLM enhancement for circular %s", circular_id[:8])

    try:
        # Lazy imports to avoid circular deps and keep startup fast
        from app.database import SessionLocal
        from app.models.circular import Circular
        from app.models.map import MAP
        from app.models.department import Department
        from app.services.ollama_service import extract_maps as ollama_extract, is_available

        # Check Ollama is up before opening a DB connection
        if not is_available():
            logger.warning("[enhance] Ollama not available — skipping enhancement for %s", circular_id[:8])
            from app.services.ai_engine import notify_ollama_failure
            notify_ollama_failure()
            _set_status(circular_id, "failed")
            return

        # Run LLM extraction
        logger.info("[enhance] Calling LLM for circular %s", circular_id[:8])
        llm_maps = ollama_extract(circular_content)
        if not llm_maps:
            raise ValueError("LLM returned no MAPs")

        # Update engine status cache so health endpoint reflects Ollama is working
        from app.services.ai_engine import notify_ollama_success
        notify_ollama_success()

        # Open fresh DB session for the update
        db = SessionLocal()
        try:
            circular = db.query(Circular).filter(Circular.id == circular_id).first()
            if not circular:
                logger.error("[enhance] Circular %s not found in DB", circular_id[:8])
                _set_status(circular_id, "failed")
                return

            existing_maps = (
                db.query(MAP)
                .filter(MAP.circular_id == circular_id)
                .order_by(MAP.created_at.asc(), MAP.id.asc())
                .all()
            )
            if not existing_maps:
                logger.warning("[enhance] No existing MAPs for circular %s", circular_id[:8])
                _set_status(circular_id, "failed")
                return

            # Build enhanced dicts
            enhanced = _build_enhanced_maps(llm_maps, existing_maps)

            # Apply updates
            for item in enhanced:
                map_obj = db.query(MAP).filter(MAP.id == item["id"]).first()
                if not map_obj:
                    continue

                map_obj.action           = item["action"]
                map_obj.priority         = item["priority"] or map_obj.priority
                map_obj.deadline         = item["deadline"]
                map_obj.source_clause    = item["source_clause"]
                map_obj.confidence_score = item["confidence_score"]
                map_obj.validation_notes = item["validation_notes"]

                # Re-resolve department if LLM suggested a different one
                dept_name = item.get("department")
                if dept_name:
                    dept = db.query(Department).filter(
                        Department.name.ilike(dept_name.strip())
                    ).first()
                    if dept:
                        map_obj.department_id = dept.id

            # Mark circular as AI-enhanced
            circular.status = "ai_enhanced"
            db.commit()

            active_model = _get_active_model_name()
            logger.info(
                "[enhance] Enhancement complete for circular %s — %d MAPs updated via %s",
                circular_id[:8], len(enhanced), active_model
            )
            _set_status(circular_id, "complete")

        except Exception as db_err:
            db.rollback()
            raise db_err
        finally:
            db.close()

    except Exception as exc:
        logger.error("[enhance] Enhancement failed for %s: %s", circular_id[:8], exc)
        try:
            from app.services.ai_engine import notify_ollama_failure
            notify_ollama_failure()
        except Exception:
            pass
        _set_status(circular_id, "failed")


def _get_active_model_name() -> str:
    try:
        from app.services.ollama_service import get_active_model
        return get_active_model() or "unknown"
    except Exception:
        return "unknown"
