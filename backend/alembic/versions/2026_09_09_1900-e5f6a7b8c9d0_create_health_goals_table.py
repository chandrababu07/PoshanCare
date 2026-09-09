"""create health goals table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-09 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'health_goals',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('goal_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('target_value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=False),
        sa.Column('frequency', sa.String(length=50), server_default='daily', nullable=False),
        sa.Column('start_date', sa.String(length=20), nullable=False),
        sa.Column('target_date', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_health_goals_id'), 'health_goals', ['id'], unique=False)
    op.create_index(op.f('ix_health_goals_user_id'), 'health_goals', ['user_id'], unique=False)
    op.create_index(op.f('ix_health_goals_goal_type'), 'health_goals', ['goal_type'], unique=False)
    op.create_index(op.f('ix_health_goals_status'), 'health_goals', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_health_goals_status'), table_name='health_goals')
    op.drop_index(op.f('ix_health_goals_goal_type'), table_name='health_goals')
    op.drop_index(op.f('ix_health_goals_user_id'), table_name='health_goals')
    op.drop_index(op.f('ix_health_goals_id'), table_name='health_goals')
    op.drop_table('health_goals')
