from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseModel


class OpenEduCatConfig(BaseModel, Base):
    __tablename__ = "openeducat_configs"

    school_id: Mapped[int] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    base_url: Mapped[str] = mapped_column(String(255), nullable=False)
    database_name: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    password: Mapped[str] = mapped_column(String(512), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="1")

    school = relationship("School", back_populates="openeducat_configs", lazy="joined")

    __table_args__ = (
        Index("ix_openeducat_configs_school_id", "school_id"),
        Index("ix_openeducat_configs_is_active", "is_active"),
    )
