"""
PRAGMA — API v1 Router Aggregator

Owner: Diyasha (Backend APIs)
All endpoint routers are registered here and mounted in app/main.py.
Add a new router here when a new endpoint file is created.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    circulars,
    maps,
    approvals,
    events,
    departments,
    demo,
)

api_router = APIRouter()

api_router.include_router(circulars.router,   prefix="/circulars",   tags=["circulars"])
api_router.include_router(maps.router,         prefix="/maps",        tags=["maps"])
api_router.include_router(approvals.router,    prefix="/approvals",   tags=["approvals"])
api_router.include_router(events.router,       prefix="/events",      tags=["events"])
api_router.include_router(departments.router,  prefix="/departments", tags=["departments"])
api_router.include_router(demo.router,         prefix="/demo",        tags=["demo"])
