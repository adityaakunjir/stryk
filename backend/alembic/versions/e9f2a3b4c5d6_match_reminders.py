"""Add opt-in reminder and push-delivery tables."""
from alembic import op
from app.models.reminder import ReminderPreference, PushDevice, MatchReminder, ReminderSnapshot, PushDelivery
revision = "e9f2a3b4c5d6"
down_revision = "d8e1f2a3b4c5"
branch_labels = None
depends_on = None
tables = [ReminderPreference, PushDevice, MatchReminder, ReminderSnapshot, PushDelivery]
def upgrade():
    for model in tables:
        model.__table__.create(op.get_bind(), checkfirst=True)
def downgrade():
    for model in reversed(tables):
        model.__table__.drop(op.get_bind(), checkfirst=True)
