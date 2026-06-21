"""
PRAGMA — Circular Pydantic Schemas
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

from app.schemas.map import MAPOut


class CircularUploadRequest(BaseModel):
    title: str
    source: str
    content: str


class CircularSummaryOut(BaseModel):
    """
    Lightweight schema for GET /circulars (list view).

    Deliberately excludes `content` (full circular text, often 10–50 KB)
    and `maps` (triggers N+1 department lazy-loads).

    Previously: GET /circulars returned CircularOut with content + maps,
    causing 1 + N_circulars + N_circulars×N_maps DB round trips per call.
    """
    id: uuid.UUID
    title: str
    source: str
    status: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CircularOut(BaseModel):
    """Full schema for GET /circulars/{id} (detail view)."""
    id: uuid.UUID
    title: str
    source: str
    content: str
    status: str
    uploaded_at: datetime
    maps: List[MAPOut] = []

    model_config = ConfigDict(from_attributes=True)
