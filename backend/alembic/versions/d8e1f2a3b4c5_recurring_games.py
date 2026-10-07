"""Add weekly schedules without altering existing match rows."""
from alembic import op
from app.models.recurring import RecurringGame, RecurringOccurrence

revision = "d8e1f2a3b4c5"
down_revision = "c7d9e2f3a4b5"
branch_labels = None
depends_on = None


def upgrade():
    RecurringGame.__table__.create(op.get_bind(), checkfirst=True)
    RecurringOccurrence.__table__.create(op.get_bind(), checkfirst=True)


def downgrade():
    RecurringOccurrence.__table__.drop(op.get_bind(), checkfirst=True)
    RecurringGame.__table__.drop(op.get_bind(), checkfirst=True)
