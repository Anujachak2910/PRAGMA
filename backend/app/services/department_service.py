"""
PRAGMA — Department Service

Owner: Diptanshu (Database Design)
Milestone: M1

Handles department lookup and seed-on-startup logic.
"""

from sqlalchemy.orm import Session
from app.models.department import DEPARTMENT_NAMES

# TODO (M1): Implement service functions
#
# Functions to implement:
#   seed_departments(db) -> None
#     — Called on app startup; inserts departments if table is empty
#   get_department_by_name(db, name: str) -> Department | None
#   get_all_departments(db) -> list[Department]
