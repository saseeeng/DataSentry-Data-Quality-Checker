from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

JSON_CONFIG = JSON().with_variant(JSONB, "postgresql")


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(primary_key=True)
    file_name: Mapped[str] = mapped_column(String(255))
    file_size: Mapped[int] = mapped_column(Integer)
    file_hash: Mapped[str] = mapped_column(String(64), index=True)
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    column_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="processing")
    quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    metrics: Mapped["QualityMetrics | None"] = relationship(
        back_populates="scan", cascade="all, delete-orphan", uselist=False
    )
    issues: Mapped[list["ValidationIssue"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )


class QualityMetrics(Base):
    __tablename__ = "quality_metrics"

    id: Mapped[int] = mapped_column(primary_key=True)
    scan_id: Mapped[int] = mapped_column(ForeignKey("scans.id"), unique=True)
    missing_count: Mapped[int] = mapped_column(Integer, default=0)
    duplicate_count: Mapped[int] = mapped_column(Integer, default=0)
    invalid_count: Mapped[int] = mapped_column(Integer, default=0)
    inconsistent_count: Mapped[int] = mapped_column(Integer, default=0)
    missing_percentage: Mapped[float] = mapped_column(Float, default=0)
    duplicate_percentage: Mapped[float] = mapped_column(Float, default=0)
    invalid_percentage: Mapped[float] = mapped_column(Float, default=0)
    inconsistent_percentage: Mapped[float] = mapped_column(Float, default=0)

    scan: Mapped["Scan"] = relationship(back_populates="metrics")


class ValidationIssue(Base):
    __tablename__ = "validation_issues"

    id: Mapped[int] = mapped_column(primary_key=True)
    scan_id: Mapped[int] = mapped_column(ForeignKey("scans.id"), index=True)
    issue_type: Mapped[str] = mapped_column(String(80))
    column_name: Mapped[str] = mapped_column(String(255))
    row_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20))
    suggestion: Mapped[str] = mapped_column(Text)

    scan: Mapped["Scan"] = relationship(back_populates="issues")


class ValidationRule(Base):
    __tablename__ = "validation_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    column_name: Mapped[str] = mapped_column(String(255))
    rule_type: Mapped[str] = mapped_column(String(50))
    rule_config: Mapped[dict] = mapped_column(JSON_CONFIG, default=dict)
    severity: Mapped[str] = mapped_column(String(20), default="medium")
    is_active: Mapped[bool] = mapped_column(default=True)