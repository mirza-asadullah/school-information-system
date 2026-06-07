from datetime import date

from sqlalchemy import Date, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseModel


class Attendance(BaseModel, Base):
    __tablename__ = "attendance"

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    attendance_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    remarks: Mapped[str | None] = mapped_column(String(512), nullable=True)

    student = relationship("Student", back_populates="attendances", lazy="joined")
    course = relationship("Course", back_populates="attendances", lazy="joined")

    __table_args__ = (
        Index("ix_attendance_status", "status"),
        Index("ix_attendance_student_course_date", "student_id", "course_id", "attendance_date", unique=True),
    )
