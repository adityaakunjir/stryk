"""add leaderboard indexes

Revision ID: b4c8d1e2f9a0
Revises: a8f4c2d9e6b1
Create Date: 2026-07-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "b4c8d1e2f9a0"
down_revision: Union[str, Sequence[str], None] = "a8f4c2d9e6b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_users_xp", "users", ["xp"], unique=False)
    op.create_index("ix_users_goals", "users", ["goals"], unique=False)
    op.create_index("ix_users_assists", "users", ["assists"], unique=False)
    op.create_index("ix_match_stats_match_user_status", "match_stats", ["matchId", "userId", "status"], unique=False)
    op.create_index("ix_matches_completedAt_format", "matches", ["completedAt", "format"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_matches_completedAt_format", table_name="matches")
    op.drop_index("ix_match_stats_match_user_status", table_name="match_stats")
    op.drop_index("ix_users_assists", table_name="users")
    op.drop_index("ix_users_goals", table_name="users")
    op.drop_index("ix_users_xp", table_name="users")
