"""add courses table

Revision ID: 0003_add_courses_table
Revises: 0002_add_students_table
Create Date: 2026-06-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003_add_courses_table'
down_revision = '0002_add_students_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'courses',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('school_id', sa.Integer(), sa.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('openedx_course_id', sa.String(length=255), nullable=True),
    )
    op.create_index('ix_courses_status', 'courses', ['status'])
    op.create_index('ix_courses_school_id', 'courses', ['school_id'])
    op.create_index('ix_courses_school_code', 'courses', ['school_id', 'code'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_courses_school_code', table_name='courses')
    op.drop_index('ix_courses_school_id', table_name='courses')
    op.drop_index('ix_courses_status', table_name='courses')
    op.drop_table('courses')
