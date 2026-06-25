"""add_player_positions_to_match_players

Revision ID: f507a4465178
Revises: ca642388d6a2
Create Date: 2026-06-26 01:56:18.104129

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'f507a4465178'
down_revision: Union[str, Sequence[str], None] = 'ca642388d6a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add position columns to match_players table
    op.add_column('match_players', sa.Column('x', sa.Float(), nullable=True))
    op.add_column('match_players', sa.Column('y', sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove position columns from match_players table
    op.drop_column('match_players', 'y')
    op.drop_column('match_players', 'x')
