"""
PRAGMA — Database Engine, Session, and Base

Owner: Diptanshu (Database Design)

All SQLAlchemy models inherit from Base.
Use get_db() as a FastAPI dependency to obtain a session.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# ---------------------------------------------------------------------------
# Engine — pool_pre_ping reconnects on stale connections automatically
# ---------------------------------------------------------------------------

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Declarative base — every ORM model inherits from this
# ---------------------------------------------------------------------------


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency — yields a session per request, always closes it
# ---------------------------------------------------------------------------


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
