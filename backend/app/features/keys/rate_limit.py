"""Rate limiting utilities for API keys."""

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import ApiKey
from app.models.usage import Usage


async def check_daily_limit(
    db: AsyncSession, api_key: ApiKey, daily_limit: int
) -> tuple[bool, int]:
    """Check if an API key has exceeded its daily usage limit.

    Args:
        db: Database session
        api_key: The API key to check
        daily_limit: Maximum number of images allowed per day

    Returns:
        tuple[bool, int]: (is_within_limit, current_usage)
            - is_within_limit: True if under limit, False if at/over limit
            - current_usage: Number of images generated today
    """
    today = date.today()

    # Get today's usage for this key
    result = await db.execute(
        select(Usage.image_count).where(
            Usage.api_key_id == api_key.id, Usage.usage_date == today
        )
    )
    usage_record = result.scalar_one_or_none()

    current_usage = usage_record if usage_record is not None else 0

    # Check if within limit
    is_within_limit = current_usage < daily_limit

    return is_within_limit, current_usage


async def increment_usage(db: AsyncSession, api_key_id: str, count: int = 1) -> None:
    """Increment the usage counter for an API key for today.

    Creates a new usage record if one doesn't exist for today,
    or updates the existing record.

    Args:
        db: Database session
        api_key_id: ID of the API key
        count: Number of images to add to the count (default: 1)
    """
    today = date.today()

    # Try to find existing usage record for today
    result = await db.execute(
        select(Usage).where(Usage.api_key_id == api_key_id, Usage.usage_date == today)
    )
    usage_record = result.scalar_one_or_none()

    if usage_record is None:
        # Create new usage record
        usage_record = Usage(
            api_key_id=api_key_id, usage_date=today, image_count=count
        )
        db.add(usage_record)
    else:
        # Update existing record
        usage_record.image_count += count

    await db.flush()
