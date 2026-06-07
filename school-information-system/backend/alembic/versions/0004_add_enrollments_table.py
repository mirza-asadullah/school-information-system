"""add enrollments table

Revision ID: 0004_add_enrollments_table
Revises: 0003_add_courses_table
Create Date: 2026-06-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0004_add_enrollments_table'
down_revision = '0003_add_courses_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'enrollments',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('enrolled_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_enrollments_status', 'enrollments', ['status'])
    op.create_index('ix_enrollments_student_course', 'enrollments', ['student_id', 'course_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_enrollments_student_course', table_name='enrollments')
    op.drop_index('ix_enrollments_status', table_name='enrollments')
    op.drop_table('enrollments')
