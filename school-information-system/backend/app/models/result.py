from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseModel


def calculate_grade(percentage: float) -> str:
    if percentage >= 90:
        return "A+"
    if percentage >= 80:
        return "A"
    if percentage >= 70:
        return "B"
    if percentage >= 60:
        return "C"
    if percentage >= 50:
        return "D"
    return "F"


class Result(BaseModel, Base):
    __tablename__ = "results"

    exam_id: Mapped[int] = mapped_column(
        ForeignKey("exams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    obtained_marks: Mapped[int] = mapped_column(Integer, nullable=False)
    grade: Mapped[str] = mapped_column(String(10), nullable=False)
    remarks: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)

    exam = relationship("Exam", back_populates="results", lazy="joined")
    student = relationship("Student", back_populates="results", lazy="joined")

    @property
    def percentage(self) -> float:
        if not self.exam or self.exam.total_marks == 0:
            return 0.0
        return round((self.obtained_marks / self.exam.total_marks) * 100, 2)

    @property
    def exam_title(self) -> str:
        return self.exam.title if self.exam else ""

    @property
    def student_name(self) -> str:
        if not self.student:
            return ""
        return f"{self.student.first_name} {self.student.last_name}"

    __table_args__ = (
        Index("ix_results_exam_id", "exam_id"),
        Index("ix_results_student_id", "student_id"),
        Index("ix_results_exam_student", "exam_id", "student_id", unique=True),
    )
