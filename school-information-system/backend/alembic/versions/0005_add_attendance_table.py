"""add attendance table

Revision ID: 0005_add_attendance_table
Revises: 0004_add_enrollments_table
Create Date: 2026-06-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0005_add_attendance_table'
down_revision = '0004_add_enrollments_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'attendance',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('attendance_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('remarks', sa.String(length=512), nullable=True),
    )
    op.create_index('ix_attendance_status', 'attendance', ['status'])
    op.create_index('ix_attendance_student_course_date', 'attendance', ['student_id', 'course_id', 'attendance_date'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_attendance_student_course_date', table_name='attendance')
    op.drop_index('ix_attendance_status', table_name='attendance')
    op.drop_table('attendance')
