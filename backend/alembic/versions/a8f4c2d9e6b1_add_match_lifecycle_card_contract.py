"""add match lifecycle and card contract fields

Revision ID: a8f4c2d9e6b1
Revises: 31aff9f199f2
Create Date: 2026-07-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "a8f4c2d9e6b1"
down_revision: Union[str, Sequence[str], None] = "31aff9f199f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("userId", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column("users", sa.Column("avatar", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column("users", sa.Column("OVR", sa.Integer(), nullable=False, server_default="60"))
    op.add_column("users", sa.Column("PAC", sa.Float(), nullable=False, server_default="60.0"))
    op.add_column("users", sa.Column("SHO", sa.Float(), nullable=False, server_default="60.0"))
    op.add_column("users", sa.Column("PAS", sa.Float(), nullable=False, server_default="60.0"))
    op.add_column("users", sa.Column("DRI", sa.Float(), nullable=False, server_default="60.0"))
    op.add_column("users", sa.Column("DEF", sa.Float(), nullable=False, server_default="60.0"))
    op.add_column("users", sa.Column("PHY", sa.Float(), nullable=False, server_default="60.0"))
    op.add_column("users", sa.Column("cardFrame", sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default="bronze"))
    op.add_column("users", sa.Column("matchHistory", sa.JSON(), nullable=False, server_default=sa.text("'[]'")))
    op.create_index(op.f("ix_users_userId"), "users", ["userId"], unique=True)

    op.add_column("matches", sa.Column("matchId", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column("matches", sa.Column("scheduledAt", sa.DateTime(), nullable=True))
    op.add_column("matches", sa.Column("hostUserId", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column("matches", sa.Column("completedAt", sa.DateTime(), nullable=True))
    op.add_column("matches", sa.Column("submissionDeadline", sa.DateTime(), nullable=True))
    op.add_column("matches", sa.Column("verificationDeadline", sa.DateTime(), nullable=True))
    op.add_column("matches", sa.Column("notifications", sa.JSON(), nullable=False, server_default=sa.text("'[]'")))
    op.create_index(op.f("ix_matches_matchId"), "matches", ["matchId"], unique=True)
    op.create_index(op.f("ix_matches_hostUserId"), "matches", ["hostUserId"], unique=False)

    op.execute('UPDATE users SET "userId" = id WHERE "userId" IS NULL')
    op.execute('UPDATE users SET avatar = "avatarUrl" WHERE avatar IS NULL')
    op.execute('UPDATE users SET "OVR" = overall')
    op.execute('UPDATE users SET "PAC" = pace, "SHO" = shooting, "PAS" = passing, "DRI" = dribbling, "DEF" = defending, "PHY" = physical')
    op.execute("""UPDATE users SET "cardFrame" = CASE WHEN level >= 16 THEN 'gold' WHEN level >= 6 THEN 'silver' ELSE 'bronze' END""")

    op.execute('UPDATE matches SET "matchId" = id WHERE "matchId" IS NULL')
    op.execute('UPDATE matches SET "scheduledAt" = "matchDate" WHERE "scheduledAt" IS NULL')
    op.execute('UPDATE matches SET "hostUserId" = "hostId" WHERE "hostUserId" IS NULL')


def downgrade() -> None:
    op.drop_index(op.f("ix_matches_hostUserId"), table_name="matches")
    op.drop_index(op.f("ix_matches_matchId"), table_name="matches")
    op.drop_column("matches", "notifications")
    op.drop_column("matches", "verificationDeadline")
    op.drop_column("matches", "submissionDeadline")
    op.drop_column("matches", "completedAt")
    op.drop_column("matches", "hostUserId")
    op.drop_column("matches", "scheduledAt")
    op.drop_column("matches", "matchId")

    op.drop_index(op.f("ix_users_userId"), table_name="users")
    op.drop_column("users", "matchHistory")
    op.drop_column("users", "cardFrame")
    op.drop_column("users", "PHY")
    op.drop_column("users", "DEF")
    op.drop_column("users", "DRI")
    op.drop_column("users", "PAS")
    op.drop_column("users", "SHO")
    op.drop_column("users", "PAC")
    op.drop_column("users", "OVR")
    op.drop_column("users", "avatar")
    op.drop_column("users", "userId")
