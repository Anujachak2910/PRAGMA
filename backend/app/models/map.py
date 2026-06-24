"""
PRAGMA — MAP (Measurable Action Point) ORM Model

The core entity of PRAGMA. Extracted from a circular by the AI engine.
Each MAP is assigned to a department, approved by compliance, and actioned.

Uses UUIDType (String-backed) for SQLite + PostgreSQL compatibility.

Valid status transitions:
  Pending → Approved → In Progress → Completed
  Pending → Rejected
"""

from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey, Float, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base, UUIDType

MAP_STATUSES   = ["Pending", "Approved", "Rejected", "In Progress", "Completed"]
MAP_PRIORITIES = ["Critical", "High", "Medium", "Low"]


class MAP(Base):
    __tablename__ = "maps"
    __table_args__ = (
        Index("ix_maps_circular_id",   "circular_id"),
        Index("ix_maps_department_id", "department_id"),
        Index("ix_maps_status",        "status"),
        Index("ix_maps_deadline",      "deadline"),
        Index("ix_maps_priority",      "priority"),
    )

    id            = Column(UUIDType, primary_key=True, default=UUIDType.new)
    circular_id   = Column(UUIDType, ForeignKey("circulars.id",   ondelete="CASCADE"),  nullable=False)
    department_id = Column(UUIDType, ForeignKey("departments.id", ondelete="SET NULL"),  nullable=True)

    action           = Column(Text,    nullable=False)
    priority         = Column(String,  nullable=False)
    deadline         = Column(Date,    nullable=True)
    status           = Column(String,  default="Pending")
    validation_notes = Column(Text,    nullable=True)

    confidence_score = Column(Float,   nullable=True)
    source_clause    = Column(Text,    nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    circular   = relationship("Circular",   back_populates="maps")
    department = relationship("Department", back_populates="maps")
    approvals  = relationship("Approval",   back_populates="map", cascade="all, delete-orphan")
    events     = relationship("Event",      back_populates="map")

    def __repr__(self):
        return f"<MAP id={self.id} priority={self.priority} status={self.status}>"
