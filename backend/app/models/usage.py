"""Usage tracking model."""

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.api_key import ApiKey


class Usage(Base):
    """Daily usage tracking per API key."""

    __tablename__ = "usage"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4())
    )
    api_key_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("api_keys.id", ondelete="CASCADE"), nullable=False, index=True
    )
    usage_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    image_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationship
    api_key: Mapped["ApiKey"] = relationship("ApiKey", back_populates="usage_records")

    __table_args__ = (
        UniqueConstraint("api_key_id", "usage_date", name="uq_usage_api_key_date"),
    )
