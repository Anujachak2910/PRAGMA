"""
PRAGMA — Circular ORM Model

Represents a regulatory circular uploaded into the system.

Owner: Diptanshu (Database Design)
Milestone: M1 — implement full model after schema review
"""

import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Circular(Base):
    __tablename__ = "circulars"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    source = Column(String, nullable=False)         # 'RBI' | 'SEBI' | 'MCA'
    content = Column(Text, nullable=False)           # Full circular text
    status = Column(String, default="pending")       # 'pending' | 'processed' | 'failed'
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    maps = relationship("MAP", back_populates="circular", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="circular")

    def __repr__(self):
        return f"<Circular id={self.id} title={self.title!r} status={self.status}>"
