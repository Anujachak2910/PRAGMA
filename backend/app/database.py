"""
PRAGMA — Database Engine, Session, and Base

All SQLAlchemy models inherit from Base.
Use get_db() as a FastAPI dependency to obtain a session.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


def _build_engine():
    url = settings.DATABASE_URL

    # Ensure connect_timeout is embedded in the connection string for
    # psycopg2 on all platforms (Windows ignores connect_args on some builds).
    if "connect_timeout" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}connect_timeout=10"

    return create_engine(
        url,
        pool_pre_ping=True,         # drop stale connections immediately
        pool_size=5,                 # max persistent connections
        max_overflow=5,              # 5 extra burst connections
        pool_timeout=10,             # fail fast if pool exhausted (was: hang forever)
        pool_recycle=1800,           # recycle connections every 30 min (Neon idles them)
        connect_args={"connect_timeout": 10},
    )


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
