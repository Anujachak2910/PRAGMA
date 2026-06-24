"""
PRAGMA — Department ORM Model

Represents a bank department that can own and action MAPs.
Seeded on startup — not created by users.

Uses UUIDType (String-backed) for SQLite + PostgreSQL compatibility.
"""

from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from app.database import Base, UUIDType

DEPARTMENT_NAMES = ["IT", "Compliance", "Risk", "Treasury", "Legal"]


class Department(Base):
    __tablename__ = "departments"

    id   = Column(UUIDType, primary_key=True, default=UUIDType.new)
    name = Column(String,   nullable=False, unique=True)

    # Relationships
    maps = relationship("MAP", back_populates="department")

    def __repr__(self):
        return f"<Department id={self.id} name={self.name!r}>"
