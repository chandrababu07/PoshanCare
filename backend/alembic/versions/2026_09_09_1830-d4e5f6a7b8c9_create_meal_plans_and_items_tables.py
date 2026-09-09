"""create meal plans and items tables

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-09 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create meal_plans table
    op.create_table(
        'meal_plans',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('plan_date', sa.String(length=10), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='active', nullable=False),
        sa.Column('persona', sa.String(length=50), server_default='adult', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'plan_date', name='uq_user_meal_plan_date')
    )
    op.create_index(op.f('ix_meal_plans_id'), 'meal_plans', ['id'], unique=False)
    op.create_index(op.f('ix_meal_plans_user_id'), 'meal_plans', ['user_id'], unique=False)
    op.create_index(op.f('ix_meal_plans_plan_date'), 'meal_plans', ['plan_date'], unique=False)

    # 2. Create meal_plan_items table
    op.create_table(
        'meal_plan_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('meal_plan_id', sa.Integer(), nullable=False),
        sa.Column('meal_type', sa.String(length=50), nullable=False),
        sa.Column('food_id', sa.Integer(), nullable=False),
        sa.Column('servings', sa.Float(), server_default='1.0', nullable=False),
        sa.Column('suggested_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['meal_plan_id'], ['meal_plans.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['food_id'], ['foods.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_meal_plan_items_id'), 'meal_plan_items', ['id'], unique=False)
    op.create_index(op.f('ix_meal_plan_items_meal_plan_id'), 'meal_plan_items', ['meal_plan_id'], unique=False)
    op.create_index(op.f('ix_meal_plan_items_meal_type'), 'meal_plan_items', ['meal_type'], unique=False)
    op.create_index(op.f('ix_meal_plan_items_food_id'), 'meal_plan_items', ['food_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_meal_plan_items_food_id'), table_name='meal_plan_items')
    op.drop_index(op.f('ix_meal_plan_items_meal_type'), table_name='meal_plan_items')
    op.drop_index(op.f('ix_meal_plan_items_meal_plan_id'), table_name='meal_plan_items')
    op.drop_index(op.f('ix_meal_plan_items_id'), table_name='meal_plan_items')
    op.drop_table('meal_plan_items')

    op.drop_index(op.f('ix_meal_plans_plan_date'), table_name='meal_plans')
    op.drop_index(op.f('ix_meal_plans_user_id'), table_name='meal_plans')
    op.drop_index(op.f('ix_meal_plans_id'), table_name='meal_plans')
    op.drop_table('meal_plans')
