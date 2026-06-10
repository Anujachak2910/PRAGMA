"""
PRAGMA — Circulars Endpoints

Owner: Diyasha (Backend APIs) + Anoushka (LLM pipeline)
Milestone: M2

Endpoints:
  POST /circulars/upload   — Upload circular text, trigger MAP extraction
  GET  /circulars          — List all circulars with status
  GET  /circulars/{id}     — Get single circular with its MAPs
"""

from fastapi import APIRouter

router = APIRouter()

# TODO (M2): Implement endpoints — see docs/api-reference.md for full spec
