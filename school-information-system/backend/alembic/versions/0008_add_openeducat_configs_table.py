"""add openeducat configs table

Revision ID: 0008_add_openeducat_configs_table
Revises: 0007_add_results_table
Create Date: 2026-06-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0008_add_openeducat_configs'
down_revision = '0007_add_results_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'openeducat_configs',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('school_id', sa.Integer(), sa.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False),
        sa.Column('base_url', sa.String(length=255), nullable=False),
        sa.Column('database_name', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=255), nullable=False),
        sa.Column('password', sa.String(length=512), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )
    op.create_index('ix_openeducat_configs_school_id', 'openeducat_configs', ['school_id'])
    op.create_index('ix_openeducat_configs_is_active', 'openeducat_configs', ['is_active'])


def downgrade() -> None:
    op.drop_index('ix_openeducat_configs_is_active', table_name='openeducat_configs')
    op.drop_index('ix_openeducat_configs_school_id', table_name='openeducat_configs')
    op.drop_table('openeducat_configs')
