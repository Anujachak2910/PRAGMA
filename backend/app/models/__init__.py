"""
Import all models here so Alembic autogenerate detects every table.
Also ensures SQLAlchemy registers all mappers before the first query.

Owner: Diptanshu (Database Design)
"""

from app.database import Base  # noqa: F401
from app.models.circular import Circular  # noqa: F401
from app.models.department import Department  # noqa: F401
from app.models.map import MAP  # noqa: F401
from app.models.approval import Approval  # noqa: F401
from app.models.event import Event  # noqa: F401

__all__ = ["Base", "Circular", "Department", "MAP", "Approval", "Event"]
