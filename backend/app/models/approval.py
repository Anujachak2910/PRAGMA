"""
PRAGMA — Approval ORM Model

Records a compliance officer's approve/reject decision on a MAP.
Immutable once written — provides the audit trail.

Owner: Diptanshu (Database Design)
Milestone: M1
"""

import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    map_id = Column(UUID(as_uuid=True), ForeignKey("maps.id", ondelete="CASCADE"), nullable=False)

    action = Column(String, nullable=False)                      # 'Approved' | 'Rejected'
    notes = Column(Text, nullable=True)                          # Compliance officer's comment
    approved_by = Column(String, default="Compliance Officer")   # Hardcoded for prototype
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    map = relationship("MAP", back_populates="approvals")

    def __repr__(self):
        return f"<Approval id={self.id} action={self.action} map_id={self.map_id}>"
