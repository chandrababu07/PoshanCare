"""add google oauth fields to users table

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-09-09 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a5b6c7d8e9'
down_revision: Union[str, None] = 'e3f4a5b6c7d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('google_sub', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('auth_provider', sa.String(length=50), server_default='email', nullable=False))
        batch_op.alter_column('password_hash', existing_type=sa.String(length=255), nullable=True)
        batch_op.create_index(batch_op.f('ix_users_google_sub'), ['google_sub'], unique=True)


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_google_sub'))
        batch_op.alter_column('password_hash', existing_type=sa.String(length=255), nullable=False)
        batch_op.drop_column('auth_provider')
        batch_op.drop_column('google_sub')
