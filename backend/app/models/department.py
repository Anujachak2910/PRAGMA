"""
PRAGMA — Department ORM Model

Represents a bank department that can own and action MAPs.
Seeded on startup — not created by users.

Owner: Diptanshu (Database Design)
Milestone: M1
"""

import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base

# Seeded department names — matches routing logic in claude_service.py
DEPARTMENT_NAMES = ["IT", "Compliance", "Risk", "Treasury", "Legal"]


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)

    # Relationships
    maps = relationship("MAP", back_populates="department")

    def __repr__(self):
        return f"<Department id={self.id} name={self.name!r}>"
