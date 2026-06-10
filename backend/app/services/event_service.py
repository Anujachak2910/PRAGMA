"""
PRAGMA — Event Logging Service

Owner: Diyasha (Backend APIs)
Milestone: M2

Every significant state change writes an event row.
This service is called by other services — never directly from endpoints.

Callers:
  - map_service: MAP created, status changed
  - approvals endpoint: MAP approved/rejected
  - circulars endpoint: circular uploaded, extraction complete
  - demo endpoint: demo reset
"""

from sqlalchemy.orm import Session

# TODO (M2): Implement service functions
#
# Functions to implement:
#   log_event(db, event_type: str, description: str, actor: str = "System",
#             circular_id=None, map_id=None) -> Event
