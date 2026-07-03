"""reset unverified player ovr

Revision ID: c7d9e2f3a4b5
Revises: b4c8d1e2f9a0
Create Date: 2026-07-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "c7d9e2f3a4b5"
down_revision: Union[str, Sequence[str], None] = "b4c8d1e2f9a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('UPDATE users SET overall = 60, "OVR" = 60 WHERE COALESCE("matchesPlayed", 0) = 0')


def downgrade() -> None:
    pass
