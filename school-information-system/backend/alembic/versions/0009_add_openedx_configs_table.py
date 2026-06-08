"""add openedx configs table

Revision ID: 0009_add_openedx_configs_table
Revises: 0008_add_openeducat_configs_table
Create Date: 2026-06-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0009_add_openedx_configs_table'
down_revision = '0008_add_openeducat_configs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'openedx_configs',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('school_id', sa.Integer(), sa.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False),
        sa.Column('base_url', sa.String(length=255), nullable=False),
        sa.Column('client_id', sa.String(length=255), nullable=False),
        sa.Column('client_secret', sa.String(length=512), nullable=False),
        sa.Column('access_token', sa.String(length=512), nullable=True),
        sa.Column('refresh_token', sa.String(length=512), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )
    op.create_index('ix_openedx_configs_school_id', 'openedx_configs', ['school_id'])
    op.create_index('ix_openedx_configs_is_active', 'openedx_configs', ['is_active'])


def downgrade() -> None:
    op.drop_index('ix_openedx_configs_is_active', table_name='openedx_configs')
    op.drop_index('ix_openedx_configs_school_id', table_name='openedx_configs')
    op.drop_table('openedx_configs')
