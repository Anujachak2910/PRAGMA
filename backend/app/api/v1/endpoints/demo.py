"""
PRAGMA — Demo Utility Endpoints

Owner: Diyasha (Backend APIs)
Milestone: M5

Endpoints:
  POST /demo/reset   — Wipe all data except departments; re-seed demo circular.
                       Used before every live demo run to ensure clean state.
  GET  /health       — Alias for the root health check (convenience for frontend)
"""

from fastapi import APIRouter

router = APIRouter()

# TODO (M5): Implement demo/reset — truncate circulars, maps, approvals, events
#            then re-insert seed circular so demo can begin from clean state
