"""PRAGMA — Shared Utility Helpers"""

import uuid


def is_valid_uuid(value: str) -> bool:
    """Return True if value is a valid UUID string."""
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False
