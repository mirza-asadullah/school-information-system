from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseModel


class Course(BaseModel, Base):
    __tablename__ = "courses"

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")
    openedx_course_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    school = relationship("School", back_populates="courses", lazy="joined")
    enrollments = relationship(
        "Enrollment",
        back_populates="course",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    attendances = relationship(
        "Attendance",
        back_populates="course",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    exams = relationship(
        "Exam",
        back_populates="course",
        cascade="save-update, merge",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("ix_courses_status", "status"),
        Index("ix_courses_school_id", "school_id"),
        Index("ix_courses_school_code", "school_id", "code", unique=True),
    )
