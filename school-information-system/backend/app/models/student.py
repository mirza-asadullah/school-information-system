from datetime import date

from sqlalchemy import Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseModel


class Student(BaseModel, Base):
    __tablename__ = "students"

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    first_name: Mapped[str] = mapped_column(String(128), nullable=False)
    last_name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    admission_no: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")

    school = relationship("School", back_populates="students", lazy="joined")
    enrollments = relationship(
        "Enrollment",
        back_populates="student",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    attendances = relationship(
        "Attendance",
        back_populates="student",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    results = relationship(
        "Result",
        back_populates="student",
        cascade="save-update, merge",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("ix_students_status", "status"),
    )
