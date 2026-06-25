"""update overall from 50 to 60

Revision ID: 0465c2fcab49
Revises: f507a4465178
Create Date: 2026-06-26 03:37:24.062880

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '0465c2fcab49'
down_revision: Union[str, Sequence[str], None] = 'f507a4465178'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("UPDATE users SET overall = 60 WHERE overall = 50 OR overall IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("UPDATE users SET overall = 50 WHERE overall = 60")
