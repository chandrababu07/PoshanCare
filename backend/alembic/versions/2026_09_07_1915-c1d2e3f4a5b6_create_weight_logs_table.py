"""create weight_logs table

Revision ID: c1d2e3f4a5b6
Revises: 9146fdbdcea2
Create Date: 2026-09-07 19:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, None] = '9146fdbdcea2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'weight_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('weight_kg', sa.Float(), nullable=False),
        sa.Column('note', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'date', name='uq_user_weight_date')
    )
    op.create_index(op.f('ix_weight_logs_date'), 'weight_logs', ['date'], unique=False)
    op.create_index(op.f('ix_weight_logs_id'), 'weight_logs', ['id'], unique=False)
    op.create_index(op.f('ix_weight_logs_user_id'), 'weight_logs', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_weight_logs_user_id'), table_name='weight_logs')
    op.drop_index(op.f('ix_weight_logs_id'), table_name='weight_logs')
    op.drop_index(op.f('ix_weight_logs_date'), table_name='weight_logs')
    op.drop_table('weight_logs')
