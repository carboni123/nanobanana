"""API key authentication dependencies."""

import hashlib
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.features.keys.service import get_key_by_hash, update_last_used
from app.models.api_key import ApiKey


async def get_api_key_from_header(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiKey:
    """Extract and validate API key from Authorization header.

    Expects header format: Authorization: Bearer nb_live_xxx

    Raises HTTPException 401 if:
    - Authorization header is missing
    - Header format is invalid
    - API key is not found
    - API key is revoked (is_active=False)

    Returns:
        ApiKey: The validated API key model
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    api_key_str = parts[1]

    # Validate key format
    if not api_key_str.startswith("nb_live_") or len(api_key_str) != 40:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Hash the key and look up in database
    key_hash = hashlib.sha256(api_key_str.encode()).hexdigest()
    api_key = await get_key_by_hash(db, key_hash)

    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not api_key.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last_used_at timestamp
    await update_last_used(db, api_key)

    return api_key


# Type alias for dependency injection
CurrentApiKey = Annotated[ApiKey, Depends(get_api_key_from_header)]
