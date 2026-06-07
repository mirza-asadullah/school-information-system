from sqlalchemy import Column, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseModel


class School(BaseModel, Base):
    __tablename__ = "schools"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")

    users = relationship(
        "User",
        back_populates="school",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    students = relationship(
        "Student",
        back_populates="school",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    courses = relationship(
        "Course",
        back_populates="school",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    exams = relationship(
        "Exam",
        back_populates="school",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    openeducat_configs = relationship(
        "OpenEduCatConfig",
        back_populates="school",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    openedx_configs = relationship(
        "OpenEdxConfig",
        back_populates="school",
        cascade="save-update, merge",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("ix_schools_status", "status"),
    )
