"""Business logic for usage analytics."""

from datetime import date, timedelta

from sqlalchemy import Integer, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import ApiKey
from app.models.usage import Usage


async def get_usage_summary(db: AsyncSession, user_id: str) -> dict:
    """Get summary of usage across all user's keys.

    Args:
        db: Database session
        user_id: ID of the user

    Returns:
        dict: Summary containing total images, key counts, and top keys
    """
    # Get total images across all user's keys
    total_images_result = await db.execute(
        select(func.coalesce(func.sum(Usage.image_count), 0))
        .join(ApiKey, Usage.api_key_id == ApiKey.id)
        .where(ApiKey.user_id == user_id)
    )
    total_images = total_images_result.scalar_one()

    # Get total and active key counts
    key_counts_result = await db.execute(
        select(
            func.count(ApiKey.id).label("total_keys"),
            func.sum(cast(ApiKey.is_active, Integer)).label("active_keys"),
        ).where(ApiKey.user_id == user_id)
    )
    key_counts = key_counts_result.one()

    # Get top 5 keys by usage
    top_keys_result = await db.execute(
        select(
            ApiKey.id,
            ApiKey.name,
            ApiKey.prefix,
            func.coalesce(func.sum(Usage.image_count), 0).label("image_count"),
        )
        .outerjoin(Usage, Usage.api_key_id == ApiKey.id)
        .where(ApiKey.user_id == user_id)
        .group_by(ApiKey.id, ApiKey.name, ApiKey.prefix)
        .order_by(func.coalesce(func.sum(Usage.image_count), 0).desc())
        .limit(5)
    )
    top_keys = top_keys_result.all()

    return {
        "total_images": total_images,
        "total_keys": key_counts.total_keys or 0,
        "active_keys": key_counts.active_keys or 0,
        "top_keys": [
            {
                "key_id": key.id,
                "key_name": key.name,
                "key_prefix": key.prefix,
                "image_count": key.image_count,
            }
            for key in top_keys
        ],
    }


async def get_daily_usage(
    db: AsyncSession, user_id: str, days: int = 30
) -> list[dict]:
    """Get daily usage breakdown for the last N days.

    Args:
        db: Database session
        user_id: ID of the user
        days: Number of days to retrieve (default: 30)

    Returns:
        list[dict]: List of daily usage entries, sorted by date descending
    """
    # Calculate the date range
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    # Get daily usage aggregated across all user's keys
    result = await db.execute(
        select(
            Usage.usage_date,
            func.sum(Usage.image_count).label("image_count"),
        )
        .join(ApiKey, Usage.api_key_id == ApiKey.id)
        .where(
            ApiKey.user_id == user_id,
            Usage.usage_date >= start_date,
            Usage.usage_date <= end_date,
        )
        .group_by(Usage.usage_date)
        .order_by(Usage.usage_date.desc())
    )

    daily_usage = result.all()

    return [
        {
            "usage_date": entry.usage_date,
            "image_count": entry.image_count,
        }
        for entry in daily_usage
    ]


async def get_key_usage(
    db: AsyncSession, user_id: str, key_id: str
) -> dict | None:
    """Get usage statistics for a specific API key.

    Args:
        db: Database session
        user_id: ID of the user (for ownership verification)
        key_id: ID of the API key

    Returns:
        dict | None: Usage statistics for the key, or None if not found/not owned
    """
    # Verify the key exists and belongs to the user
    key_result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user_id)
    )
    api_key = key_result.scalar_one_or_none()

    if api_key is None:
        return None

    # Get total images for this key
    total_images_result = await db.execute(
        select(func.coalesce(func.sum(Usage.image_count), 0)).where(
            Usage.api_key_id == key_id
        )
    )
    total_images = total_images_result.scalar_one()

    # Get daily breakdown for this key
    daily_usage_result = await db.execute(
        select(Usage.usage_date, Usage.image_count)
        .where(Usage.api_key_id == key_id)
        .order_by(Usage.usage_date.desc())
    )
    daily_usage = daily_usage_result.all()

    return {
        "key_id": api_key.id,
        "key_name": api_key.name,
        "key_prefix": api_key.prefix,
        "total_images": total_images,
        "daily_usage": [
            {
                "usage_date": entry.usage_date,
                "image_count": entry.image_count,
            }
            for entry in daily_usage
        ],
    }
