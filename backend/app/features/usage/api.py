"""API endpoints for usage analytics."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.features.auth.dependencies import CurrentUser
from app.features.usage.schemas import (
    DailyUsageResponse,
    KeyUsageResponse,
    UsageSummaryResponse,
)
from app.features.usage.service import (
    get_daily_usage,
    get_key_usage,
    get_usage_summary,
)

router = APIRouter()


@router.get("/summary", response_model=UsageSummaryResponse)
async def get_summary(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UsageSummaryResponse:
    """Get usage summary across all user's API keys.

    Returns total image count, key statistics, and top 5 keys by usage.
    """
    summary = await get_usage_summary(db, current_user.id)

    return UsageSummaryResponse(**summary)


@router.get("/daily", response_model=DailyUsageResponse)
async def get_daily(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(default=30, ge=1, le=365, description="Number of days to retrieve"),
) -> DailyUsageResponse:
    """Get daily usage breakdown for the last N days.

    Returns aggregated usage across all user's keys, grouped by day.
    Supports 1-365 days, defaults to 30.
    """
    daily_usage = await get_daily_usage(db, current_user.id, days)

    return DailyUsageResponse(days=daily_usage)  # type: ignore[arg-type]


@router.get("/key/{key_id}", response_model=KeyUsageResponse)
async def get_key_stats(
    key_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> KeyUsageResponse:
    """Get usage statistics for a specific API key.

    Returns total images and daily breakdown for the key.
    Only the key owner can view its usage statistics.
    """
    key_usage = await get_key_usage(db, current_user.id, key_id)

    if key_usage is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    return KeyUsageResponse(**key_usage)
