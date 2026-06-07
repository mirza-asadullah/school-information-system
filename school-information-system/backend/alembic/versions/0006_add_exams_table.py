"""add exams table

Revision ID: 0006_add_exams_table
Revises: 0005_add_attendance_table
Create Date: 2026-06-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0006_add_exams_table'
down_revision = '0005_add_attendance_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'exams',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('school_id', sa.Integer(), sa.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('exam_type', sa.String(length=50), nullable=False),
        sa.Column('total_marks', sa.Integer(), nullable=False),
        sa.Column('passing_marks', sa.Integer(), nullable=False),
        sa.Column('exam_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
    )
    op.create_index('ix_exams_school_id', 'exams', ['school_id'])
    op.create_index('ix_exams_course_id', 'exams', ['course_id'])
    op.create_index('ix_exams_exam_date', 'exams', ['exam_date'])


def downgrade() -> None:
    op.drop_index('ix_exams_exam_date', table_name='exams')
    op.drop_index('ix_exams_course_id', table_name='exams')
    op.drop_index('ix_exams_school_id', table_name='exams')
    op.drop_table('exams')
