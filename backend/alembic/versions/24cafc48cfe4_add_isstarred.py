"""Add missing isStarred column to match_stats

Revision ID: 24cafc48cfe4
Revises: 64ec366428f3
Create Date: 2026-07-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '24cafc48cfe4'
down_revision: Union[str, Sequence[str], None] = 'b4c8d1e2f9a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('match_stats', sa.Column('isStarred', sa.Boolean(), nullable=False, server_default=sa.text('0')))


def downgrade() -> None:
    op.drop_column('match_stats', 'isStarred')
