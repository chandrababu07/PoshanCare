"""create health notifications table

Revision ID: f7a8b9c0d1e2
Revises: e5f6a7b8c9d0
Create Date: 2026-09-09 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7a8b9c0d1e2'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'health_notifications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), server_default='info', nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('action', sa.String(length=255), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_health_notifications_id'), 'health_notifications', ['id'], unique=False)
    op.create_index(op.f('ix_health_notifications_user_id'), 'health_notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_health_notifications_notification_type'), 'health_notifications', ['notification_type'], unique=False)
    op.create_index(op.f('ix_health_notifications_is_read'), 'health_notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_health_notifications_created_at'), 'health_notifications', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_health_notifications_created_at'), table_name='health_notifications')
    op.drop_index(op.f('ix_health_notifications_is_read'), table_name='health_notifications')
    op.drop_index(op.f('ix_health_notifications_notification_type'), table_name='health_notifications')
    op.drop_index(op.f('ix_health_notifications_user_id'), table_name='health_notifications')
    op.drop_index(op.f('ix_health_notifications_id'), table_name='health_notifications')
    op.drop_table('health_notifications')
