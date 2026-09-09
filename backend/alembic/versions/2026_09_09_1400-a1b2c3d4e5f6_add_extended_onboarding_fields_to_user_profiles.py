"""add extended onboarding fields to user_profiles table

Revision ID: a1b2c3d4e5f6
Revises: f4a5b6c7d8e9
Create Date: 2026-09-09 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f4a5b6c7d8e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('user_profiles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('profile_type', sa.String(length=50), server_default='adult', nullable=True))
        batch_op.add_column(sa.Column('date_of_birth', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('country', sa.String(length=100), server_default='India', nullable=True))
        batch_op.add_column(sa.Column('region', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('preferred_language', sa.String(length=20), server_default='en', nullable=True))
        batch_op.add_column(sa.Column('diet_type', sa.String(length=50), server_default='vegetarian', nullable=True))
        batch_op.add_column(sa.Column('food_preferences', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('food_avoidances', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('meal_frequency', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('meal_timings', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('health_conditions', sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('user_profiles', schema=None) as batch_op:
        batch_op.drop_column('health_conditions')
        batch_op.drop_column('meal_timings')
        batch_op.drop_column('meal_frequency')
        batch_op.drop_column('food_avoidances')
        batch_op.drop_column('food_preferences')
        batch_op.drop_column('diet_type')
        batch_op.drop_column('preferred_language')
        batch_op.drop_column('region')
        batch_op.drop_column('country')
        batch_op.drop_column('date_of_birth')
        batch_op.drop_column('profile_type')
