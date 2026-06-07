"""add results table

Revision ID: 0007_add_results_table
Revises: 0006_add_exams_table
Create Date: 2026-06-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0007_add_results_table'
down_revision = '0006_add_exams_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'results',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('exam_id', sa.Integer(), sa.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('obtained_marks', sa.Integer(), nullable=False),
        sa.Column('grade', sa.String(length=10), nullable=False),
        sa.Column('remarks', sa.String(length=512), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
    )
    op.create_index('ix_results_exam_id', 'results', ['exam_id'])
    op.create_index('ix_results_student_id', 'results', ['student_id'])
    op.create_index('ix_results_exam_student', 'results', ['exam_id', 'student_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_results_exam_student', table_name='results')
    op.drop_index('ix_results_student_id', table_name='results')
    op.drop_index('ix_results_exam_id', table_name='results')
    op.drop_table('results')
