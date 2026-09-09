"""create clinical_reports table

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-09-07 20:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'clinical_reports',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.String(length=100), nullable=False),
        sa.Column('report_type', sa.String(length=50), nullable=False, server_default='7day'),
        sa.Column('attach_letterhead', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('anonymize', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('avg_7day_calories', sa.Float(), nullable=False),
        sa.Column('caloric_adherence_pct', sa.Float(), nullable=False),
        sa.Column('protein_velocity_g', sa.Float(), nullable=False),
        sa.Column('target_protein_g', sa.Float(), nullable=False),
        sa.Column('protein_pct', sa.Float(), nullable=False),
        sa.Column('micronutrient_sufficiency_pct', sa.Float(), nullable=False, server_default='94.0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clinical_reports_document_id'), 'clinical_reports', ['document_id'], unique=True)
    op.create_index(op.f('ix_clinical_reports_id'), 'clinical_reports', ['id'], unique=False)
    op.create_index(op.f('ix_clinical_reports_user_id'), 'clinical_reports', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_clinical_reports_user_id'), table_name='clinical_reports')
    op.drop_index(op.f('ix_clinical_reports_id'), table_name='clinical_reports')
    op.drop_index(op.f('ix_clinical_reports_document_id'), table_name='clinical_reports')
    op.drop_table('clinical_reports')
