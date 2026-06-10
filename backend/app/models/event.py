"""
PRAGMA — Event ORM Model

Immutable audit log. Every significant lifecycle action appends a row here.
Never update or delete events — only insert.

Owner: Diptanshu (Database Design)
Milestone: M1

Valid event_type values:
  circular_uploaded | maps_extracted | map_approved | map_rejected
  map_completed | map_assigned | map_status_changed | demo_reset
"""

import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circular_id = Column(UUID(as_uuid=True), ForeignKey("circulars.id", ondelete="SET NULL"), nullable=True)
    map_id = Column(UUID(as_uuid=True), ForeignKey("maps.id", ondelete="SET NULL"), nullable=True)

    event_type = Column(String, nullable=False)   # See valid values above
    description = Column(Text, nullable=False)     # Human-readable event description
    actor = Column(String, default="System")       # 'System' | 'Compliance Officer' | dept name

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    circular = relationship("Circular", back_populates="events")
    map = relationship("MAP", back_populates="events")

    def __repr__(self):
        return f"<Event id={self.id} type={self.event_type} actor={self.actor}>"
