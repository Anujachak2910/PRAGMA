"""
PRAGMA — Circular ORM Model

Represents a regulatory circular uploaded into the system.
Uses UUIDType (String-backed) for SQLite + PostgreSQL compatibility.
"""

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base, UUIDType


class Circular(Base):
    __tablename__ = "circulars"

    id          = Column(UUIDType, primary_key=True, default=UUIDType.new)
    title       = Column(String,   nullable=False)
    source      = Column(String,   nullable=False)   # 'RBI' | 'SEBI' | 'MCA'
    content     = Column(Text,     nullable=False)    # Full circular text
    status      = Column(String,   default="pending") # 'pending' | 'processed' | 'failed'
    uploaded_at = Column(DateTime, server_default=func.now())

    # Relationships
    maps   = relationship("MAP",   back_populates="circular", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="circular")

    def __repr__(self):
        return f"<Circular id={self.id} title={self.title!r} status={self.status}>"
