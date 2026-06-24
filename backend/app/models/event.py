"""
PRAGMA — Event ORM Model

Immutable audit log. Every significant lifecycle action appends a row here.
Never update or delete events — only insert.

Uses UUIDType (String-backed) for SQLite + PostgreSQL compatibility.

Valid event_type values:
  circular_uploaded | maps_extracted | map_approved | map_rejected
  map_completed | map_assigned | map_status_changed | demo_reset
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base, UUIDType


class Event(Base):
    __tablename__ = "events"

    id          = Column(UUIDType, primary_key=True, default=UUIDType.new)
    circular_id = Column(UUIDType, ForeignKey("circulars.id", ondelete="SET NULL"), nullable=True)
    map_id      = Column(UUIDType, ForeignKey("maps.id",      ondelete="SET NULL"), nullable=True)

    event_type  = Column(String,   nullable=False)
    description = Column(Text,     nullable=False)
    actor       = Column(String,   default="System")
    created_at  = Column(DateTime, server_default=func.now())

    # Relationships
    circular = relationship("Circular", back_populates="events")
    map      = relationship("MAP",      back_populates="events")

    def __repr__(self):
        return f"<Event id={self.id} type={self.event_type} actor={self.actor}>"
