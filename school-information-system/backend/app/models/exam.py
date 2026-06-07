from datetime import date

from sqlalchemy import Date, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseModel


class Exam(BaseModel, Base):
    __tablename__ = "exams"

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    exam_type: Mapped[str] = mapped_column(String(50), nullable=False)
    total_marks: Mapped[int] = mapped_column(Integer, nullable=False)
    passing_marks: Mapped[int] = mapped_column(Integer, nullable=False)
    exam_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    school = relationship("School", back_populates="exams", lazy="joined")
    course = relationship("Course", back_populates="exams", lazy="joined")
    results = relationship("Result", back_populates="exam", passive_deletes=True)

    __table_args__ = (
        Index("ix_exams_school_id", "school_id"),
        Index("ix_exams_course_id", "course_id"),
        Index("ix_exams_exam_date", "exam_date"),
    )
