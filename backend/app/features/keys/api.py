"""API endpoints for API key management."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.features.auth.dependencies import CurrentUser
from app.features.keys.schemas import (
    CreateKeyRequest,
    CreateKeyResponse,
    KeyListResponse,
    KeyResponse,
)
from app.features.keys.service import create_api_key, get_user_keys, revoke_key

router = APIRouter()


@router.post("", response_model=CreateKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_key(
    request: CreateKeyRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CreateKeyResponse:
    """Create a new API key for the authenticated user.

    The full key is only returned on creation. Store it securely
    as it cannot be retrieved again.
    """
    api_key, full_key = await create_api_key(db, current_user.id, request.name)

    return CreateKeyResponse(
        id=api_key.id,
        key=full_key,
        name=api_key.name,
        prefix=api_key.prefix,
        created_at=api_key.created_at,
    )


@router.get("", response_model=KeyListResponse)
async def list_keys(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> KeyListResponse:
    """List all API keys for the authenticated user.

    Keys are returned with prefix only (not full key).
    """
    keys = await get_user_keys(db, current_user.id)

    return KeyListResponse(
        keys=[
            KeyResponse(
                id=key.id,
                name=key.name,
                prefix=key.prefix,
                is_active=key.is_active,
                last_used_at=key.last_used_at,
                created_at=key.created_at,
            )
            for key in keys
        ]
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_key(
    key_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Revoke an API key.

    Only the key owner can revoke their keys.
    Returns 404 if key not found or not owned by user.
    """
    revoked = await revoke_key(db, key_id, current_user.id)

    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )
