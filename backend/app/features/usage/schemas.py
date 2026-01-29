"""Pydantic schemas for usage analytics."""

from datetime import date

from pydantic import BaseModel, Field


class UsageSummaryResponse(BaseModel):
    """Summary of total usage across all keys."""

    total_images: int = Field(..., description="Total images generated across all keys")
    total_keys: int = Field(..., description="Total number of API keys")
    active_keys: int = Field(..., description="Number of active API keys")
    top_keys: list["TopKeyUsage"] = Field(
        ..., description="Top 5 keys by usage (sorted descending)"
    )


class TopKeyUsage(BaseModel):
    """Usage statistics for a single key in the top keys list."""

    key_id: str
    key_name: str
    key_prefix: str
    image_count: int


class DailyUsageResponse(BaseModel):
    """Daily usage breakdown."""

    days: list["DailyUsageEntry"] = Field(
        ..., description="Daily usage entries (sorted by date descending)"
    )


class DailyUsageEntry(BaseModel):
    """Usage for a single day."""

    usage_date: date
    image_count: int


class KeyUsageResponse(BaseModel):
    """Usage statistics for a specific API key."""

    key_id: str
    key_name: str
    key_prefix: str
    total_images: int = Field(..., description="Total images generated with this key")
    daily_usage: list[DailyUsageEntry] = Field(
        ..., description="Daily breakdown (sorted by date descending)"
    )
