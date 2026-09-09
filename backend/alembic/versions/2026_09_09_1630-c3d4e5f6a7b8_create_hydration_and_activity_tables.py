"""create hydration and activity tables

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-09 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create water_logs table
    op.create_table(
        'water_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('amount_ml', sa.Integer(), nullable=False),
        sa.Column('note', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_water_logs_id'), 'water_logs', ['id'], unique=False)
    op.create_index(op.f('ix_water_logs_user_id'), 'water_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_water_logs_date'), 'water_logs', ['date'], unique=False)

    # 2. Create activity_logs table
    op.create_table(
        'activity_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('activity_level', sa.String(length=50), nullable=True),
        sa.Column('steps', sa.Integer(), nullable=True),
        sa.Column('active_minutes', sa.Integer(), nullable=True),
        sa.Column('exercise_minutes', sa.Integer(), nullable=True),
        sa.Column('activity_type', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'date', name='uq_user_activity_date')
    )
    op.create_index(op.f('ix_activity_logs_id'), 'activity_logs', ['id'], unique=False)
    op.create_index(op.f('ix_activity_logs_user_id'), 'activity_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_activity_logs_date'), 'activity_logs', ['date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_activity_logs_date'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_user_id'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_id'), table_name='activity_logs')
    op.drop_table('activity_logs')

    op.drop_index(op.f('ix_water_logs_date'), table_name='water_logs')
    op.drop_index(op.f('ix_water_logs_user_id'), table_name='water_logs')
    op.drop_index(op.f('ix_water_logs_id'), table_name='water_logs')
    op.drop_table('water_logs')
