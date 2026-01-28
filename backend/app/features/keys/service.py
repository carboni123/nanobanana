"""Business logic for API key management."""

import hashlib
import secrets
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import ApiKey


def generate_api_key() -> tuple[str, str, str]:
    """Generate a new API key.

    Returns:
        tuple[str, str, str]: (full_key, key_hash, prefix)
            - full_key: nb_live_<32 hex chars> (40 chars total)
            - key_hash: SHA-256 hash of full key
            - prefix: first 8 chars of full key for display (nb_live_)
    """
    random_part = secrets.token_hex(16)  # 32 hex chars
    full_key = f"nb_live_{random_part}"
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    prefix = full_key[:8]  # "nb_live_"
    return full_key, key_hash, prefix


async def create_api_key(
    db: AsyncSession, user_id: str, name: str | None = None
) -> tuple[ApiKey, str]:
    """Create a new API key for a user.

    Args:
        db: Database session
        user_id: ID of the user creating the key
        name: Optional name for the key

    Returns:
        tuple[ApiKey, str]: The created ApiKey model and the full key string
    """
    full_key, key_hash, prefix = generate_api_key()

    api_key = ApiKey(
        user_id=user_id,
        key_hash=key_hash,
        name=name or "Default Key",
        prefix=prefix,
        is_active=True,
    )

    db.add(api_key)
    await db.flush()
    await db.refresh(api_key)

    return api_key, full_key


async def get_user_keys(db: AsyncSession, user_id: str) -> list[ApiKey]:
    """Get all API keys for a user.

    Args:
        db: Database session
        user_id: ID of the user

    Returns:
        list[ApiKey]: List of API keys belonging to the user
    """
    result = await db.execute(
        select(ApiKey)
        .where(ApiKey.user_id == user_id)
        .order_by(ApiKey.created_at.desc())
    )
    return list(result.scalars().all())


async def get_key_by_hash(db: AsyncSession, key_hash: str) -> ApiKey | None:
    """Look up an API key by its hash.

    Args:
        db: Database session
        key_hash: SHA-256 hash of the full key

    Returns:
        ApiKey | None: The API key if found, None otherwise
    """
    result = await db.execute(select(ApiKey).where(ApiKey.key_hash == key_hash))
    return result.scalar_one_or_none()


async def revoke_key(db: AsyncSession, key_id: str, user_id: str) -> bool:
    """Revoke an API key (soft delete).

    Args:
        db: Database session
        key_id: ID of the key to revoke
        user_id: ID of the user (for ownership verification)

    Returns:
        bool: True if key was revoked, False if not found or not owned by user
    """
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user_id)
    )
    api_key = result.scalar_one_or_none()

    if api_key is None:
        return False

    api_key.is_active = False
    await db.flush()
    return True


async def update_last_used(db: AsyncSession, api_key: ApiKey) -> None:
    """Update the last_used_at timestamp for an API key.

    Args:
        db: Database session
        api_key: The API key to update
    """
    api_key.last_used_at = datetime.now(timezone.utc)
    await db.flush()
