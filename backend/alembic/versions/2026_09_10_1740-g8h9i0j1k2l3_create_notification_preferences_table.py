"""create notification preferences table

Revision ID: g8h9i0j1k2l3
Revises: f7a8b9c0d1e2
Create Date: 2026-09-10 17:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g8h9i0j1k2l3'
down_revision: Union[str, None] = 'f7a8b9c0d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'notification_preferences',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('meal_reminders_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('meal_reminder_time', sa.String(length=5), server_default='12:00', nullable=False),
        sa.Column('hydration_reminders_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('hydration_reminder_frequency_hours', sa.Integer(), server_default='3', nullable=False),
        sa.Column('activity_reminders_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('weight_reminders_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('goal_updates_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('weekly_summary_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('insights_enabled', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_notification_preference_user')
    )
    op.create_index(op.f('ix_notification_preferences_id'), 'notification_preferences', ['id'], unique=False)
    op.create_index(op.f('ix_notification_preferences_user_id'), 'notification_preferences', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_notification_preferences_user_id'), table_name='notification_preferences')
    op.drop_index(op.f('ix_notification_preferences_id'), table_name='notification_preferences')
    op.drop_table('notification_preferences')
