"""Persist per-device test notification cooldown."""
from alembic import op
import sqlalchemy as sa

revision = "f1a2b3c4d5e6"
down_revision = "e9f2a3b4c5d6"
branch_labels = None
depends_on = None

def upgrade():
    # Earlier migrations create tables from current model metadata on fresh installs.
    columns = {c["name"] for c in sa.inspect(op.get_bind()).get_columns("push_devices")}
    if "lastTestAt" not in columns:
        op.add_column("push_devices", sa.Column("lastTestAt", sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column("push_devices", "lastTestAt")
