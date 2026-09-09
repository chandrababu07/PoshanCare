"""add custom foods and favorites

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-09 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add custom food columns to foods table using batch_alter_table with named FK
    with op.batch_alter_table('foods', schema=None) as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', name='fk_foods_user_id', ondelete='CASCADE'), nullable=True))
        batch_op.create_index(batch_op.f('ix_foods_user_id'), ['user_id'], unique=False)
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('sugar_g', sa.Float(), server_default='0.0', nullable=False))
        batch_op.add_column(sa.Column('sodium_mg', sa.Float(), server_default='0.0', nullable=False))
        batch_op.add_column(sa.Column('source', sa.String(length=50), server_default='system', nullable=False))
        batch_op.add_column(sa.Column('is_verified', sa.Boolean(), server_default='1', nullable=False))

    # 2. Create user_favorite_foods table
    op.create_table(
        'user_favorite_foods',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('food_id', sa.Integer(), sa.ForeignKey('foods.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'food_id', name='uq_user_favorite_food')
    )
    op.create_index(op.f('ix_user_favorite_foods_id'), 'user_favorite_foods', ['id'], unique=False)
    op.create_index(op.f('ix_user_favorite_foods_user_id'), 'user_favorite_foods', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_favorite_foods_food_id'), 'user_favorite_foods', ['food_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_favorite_foods_food_id'), table_name='user_favorite_foods')
    op.drop_index(op.f('ix_user_favorite_foods_user_id'), table_name='user_favorite_foods')
    op.drop_index(op.f('ix_user_favorite_foods_id'), table_name='user_favorite_foods')
    op.drop_table('user_favorite_foods')

    with op.batch_alter_table('foods', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_foods_user_id'))
        batch_op.drop_column('is_verified')
        batch_op.drop_column('source')
        batch_op.drop_column('sodium_mg')
        batch_op.drop_column('sugar_g')
        batch_op.drop_column('description')
        batch_op.drop_column('user_id')
