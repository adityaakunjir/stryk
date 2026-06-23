"""Add turf and discordLink to matches

Revision ID: bebb9d286800
Revises: 032a32017cd2
Create Date: 2026-06-24 03:04:01.054536

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'bebb9d286800'
down_revision: Union[str, Sequence[str], None] = '032a32017cd2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('matches', sa.Column('turf', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.add_column('matches', sa.Column('discordLink', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('matches', 'discordLink')
    op.drop_column('matches', 'turf')
