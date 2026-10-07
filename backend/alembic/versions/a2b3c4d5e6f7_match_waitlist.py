"""Create per-match FIFO standby queue."""
from alembic import op
from app.models.waitlist import MatchWaitlist
revision = "a2b3c4d5e6f7"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None

def upgrade():
    MatchWaitlist.__table__.create(op.get_bind(), checkfirst=True)

def downgrade():
    MatchWaitlist.__table__.drop(op.get_bind(), checkfirst=True)
