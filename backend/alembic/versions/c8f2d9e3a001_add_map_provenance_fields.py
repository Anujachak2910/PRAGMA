"""add_map_provenance_fields

Revision ID: c8f2d9e3a001
Revises: b03f6654a9d0
Create Date: 2026-06-24 10:00:00.000000

Adds clause provenance fields to the maps table.
These are populated by provenance_service after MAP extraction.
All columns are nullable so existing rows are unaffected.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c8f2d9e3a001'
down_revision: Union[str, None] = 'b03f6654a9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('maps', sa.Column('evidence_quote',        sa.Text(),    nullable=True))
    op.add_column('maps', sa.Column('evidence_start_offset', sa.Integer(), nullable=True))
    op.add_column('maps', sa.Column('evidence_end_offset',   sa.Integer(), nullable=True))
    op.add_column('maps', sa.Column('evidence_similarity',   sa.Float(),   nullable=True))
    op.add_column('maps', sa.Column('provenance_method',     sa.String(),  nullable=True))


def downgrade() -> None:
    op.drop_column('maps', 'provenance_method')
    op.drop_column('maps', 'evidence_similarity')
    op.drop_column('maps', 'evidence_end_offset')
    op.drop_column('maps', 'evidence_start_offset')
    op.drop_column('maps', 'evidence_quote')
