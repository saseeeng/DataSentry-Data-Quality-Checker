from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class MetricsOut(BaseModel):
    missing_count: int
    duplicate_count: int
    invalid_count: int
    inconsistent_count: int
    missing_percentage: float
    duplicate_percentage: float
    invalid_percentage: float
    inconsistent_percentage: float

    model_config = ConfigDict(from_attributes=True)


class IssueOut(BaseModel):
    id: int
    issue_type: str
    column_name: str
    row_number: int | None
    description: str
    severity: str
    suggestion: str

    model_config = ConfigDict(from_attributes=True)


class ScanSummary(BaseModel):
    id: int
    file_name: str
    file_size: int
    row_count: int
    column_count: int
    status: str
    quality_score: float | None
    created_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ScanOut(ScanSummary):
    metrics: MetricsOut | None
    issues: list[IssueOut]


class RuleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    column_name: str = Field(min_length=1, max_length=255)
    rule_type: Literal["required", "unique", "email", "allowed_values", "regex"]
    rule_config: dict[str, Any] = Field(default_factory=dict)
    severity: Literal["low", "medium", "high"] = "medium"
    is_active: bool = True


class RuleUpdate(BaseModel):
    name: str | None = None
    column_name: str | None = None
    rule_type: Literal["required", "unique", "email", "allowed_values", "regex"] | None = None
    rule_config: dict[str, Any] | None = None
    severity: Literal["low", "medium", "high"] | None = None
    is_active: bool | None = None


class RuleOut(RuleCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)