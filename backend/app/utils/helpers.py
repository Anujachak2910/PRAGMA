"""
PRAGMA — Shared Utility Helpers

Owner: Any backend contributor
Milestone: Ongoing

Add small, reusable utilities here that don't belong in a specific service.
"""

import uuid


def is_valid_uuid(value: str) -> bool:
    """Return True if value is a valid UUID string."""
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False


# TODO: Add additional helpers as needed during M2/M3
