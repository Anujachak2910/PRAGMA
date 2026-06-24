"""
PRAGMA — Approval ORM Model

Records a compliance officer's approve/reject decision on a MAP.
Immutable once written — provides the audit trail.

Uses UUIDType (String-backed) for SQLite + PostgreSQL compatibility.
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base, UUIDType


class Approval(Base):
    __tablename__ = "approvals"

    id     = Column(UUIDType, primary_key=True, default=UUIDType.new)
    map_id = Column(UUIDType, ForeignKey("maps.id", ondelete="CASCADE"), nullable=False)

    action      = Column(String,   nullable=False)                    # 'Approved' | 'Rejected'
    notes       = Column(Text,     nullable=True)
    approved_by = Column(String,   default="Compliance Officer")
    created_at  = Column(DateTime, server_default=func.now())

    # Relationships
    map = relationship("MAP", back_populates="approvals")

    def __repr__(self):
        return f"<Approval id={self.id} action={self.action} map_id={self.map_id}>"
