"""
PRAGMA — MAP Pydantic Schemas

Owner: Diptanshu / Diyasha
Milestone: M2

Defines request/response shapes for the /maps endpoints.
MAPOut is the primary response schema used across the dashboard.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
import uuid

# TODO (M2): Implement schemas — align with MAPOut, MAPStatusUpdate
# Reference: docs/api-reference.md
