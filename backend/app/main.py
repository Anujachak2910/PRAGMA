"""
PRAGMA — FastAPI Application Factory

Registers CORS middleware, mounts all API routers, exposes health check.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import api_router
from app.database import SessionLocal
from app.services.department_service import seed_departments


def _seed_sync() -> None:
    """Run department seed in a worker thread — keeps event loop free."""
    db = SessionLocal()
    try:
        seed_departments(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: seed departments without blocking the event loop.

    Previous bug: called seed_departments() (synchronous psycopg2 I/O)
    directly inside the async lifespan, which blocked uvicorn's event loop
    until Neon connected or the OS TCP timeout fired (~75s on Windows).
    During that window no requests — including /health — could be served.
    """
    loop = asyncio.get_event_loop()
    try:
        await asyncio.wait_for(
            loop.run_in_executor(None, _seed_sync),
            timeout=12.0,   # connect_timeout(10s) + buffer
        )
    except asyncio.TimeoutError:
        print("[PRAGMA] Startup DB seed timed out — database may be unavailable. Continuing.")
    except Exception as exc:
        print(f"[PRAGMA] Startup DB seed skipped — {exc}")
    yield


app = FastAPI(
    title="PRAGMA API",
    description=(
        "Proactive Regulatory Autonomous Governance & Management Agent — "
        "Air-Gapped Compliance Intelligence Platform for Canara Bank"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix="/api/v1")

# ---------------------------------------------------------------------------
# Health — no DB dependency; always responds instantly
# ---------------------------------------------------------------------------


@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "service": "PRAGMA API", "version": "0.1.0"}
