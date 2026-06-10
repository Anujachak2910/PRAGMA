"""
PRAGMA — MAP Service

Owner: Diyasha (Backend APIs)
Milestone: M2

Responsibilities:
  - Persist MAPs extracted by claude_service into the database
  - Look up department by name and attach to each MAP
  - Update MAP status with validation
  - Query MAPs with filters
"""

from sqlalchemy.orm import Session

# TODO (M2): Implement service functions
#
# Functions to implement:
#   create_maps_from_extraction(db, circular_id, raw_maps: list[dict]) -> list[MAP]
#   get_maps(db, status=None, department=None, priority=None) -> list[MAP]
#   get_map_by_id(db, map_id) -> MAP | None
#   update_map_status(db, map_id, new_status: str) -> MAP
