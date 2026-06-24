"""
PRAGMA — API v1 Router Aggregator

All endpoint routers are registered here and mounted in app/main.py.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    circulars,
    maps,
    approvals,
    events,
    departments,
    demo,
    simulate,
    insights,
)

api_router = APIRouter()

api_router.include_router(circulars.router,  prefix="/circulars",  tags=["circulars"])
api_router.include_router(maps.router,        prefix="/maps",       tags=["maps"])
api_router.include_router(approvals.router,   prefix="/approvals",  tags=["approvals"])
api_router.include_router(events.router,      prefix="/events",     tags=["events"])
api_router.include_router(departments.router, prefix="/departments",tags=["departments"])
api_router.include_router(demo.router,        prefix="/demo",       tags=["demo"])
api_router.include_router(simulate.router,    prefix="/simulate",   tags=["simulate"])
api_router.include_router(insights.router,    prefix="/insights",   tags=["insights"])
