"""
PRAGMA — Event Pydantic Schemas

Owner: Diyasha
Milestone: M2

Defines response shape for the /events endpoint (audit log).
Events are read-only — no create schema needed for external callers.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

# TODO (M2): Implement schemas — align with EventOut
# Reference: docs/api-reference.md
