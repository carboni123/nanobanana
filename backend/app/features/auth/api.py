"""Authentication API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.features.auth.dependencies import CurrentUser
from app.features.auth.schemas import (
    ChangePasswordRequest,
    RegisterResponse,
    TokenResponse,
    UpdateProfileRequest,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.features.auth.service import (
    authenticate_user,
    create_access_token,
    create_user,
    get_user_by_email,
    update_user_email,
    update_user_password,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"description": "Email already registered"},
    },
)
async def register(
    request: UserRegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RegisterResponse:
    """Register a new user account.

    Creates a new user with the provided email and password.
    Returns the user data along with an access token.
    """
    existing_user = await get_user_by_email(db, request.email)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = await create_user(db, request.email, request.password)
    access_token = create_access_token(user.id)

    return RegisterResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            created_at=user.created_at,
        ),
        access_token=access_token,
        token_type="bearer",
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={
        401: {"description": "Invalid credentials"},
    },
)
async def login(
    request: UserLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Authenticate a user and return an access token.

    Validates the email and password, then returns a JWT token.
    """
    user = await authenticate_user(db, request.email, request.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_current_user_info(
    current_user: CurrentUser,
) -> UserResponse:
    """Get the current authenticated user's information."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at,
    )


@router.put(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"description": "Not authenticated"},
        409: {"description": "Email already in use"},
    },
)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """Update the current user's profile information.

    Currently supports updating the email address.
    """
    # Check if new email is already taken by another user
    if request.email != current_user.email:
        existing_user = await get_user_by_email(db, request.email)
        if existing_user is not None and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use",
            )

        current_user = await update_user_email(db, current_user, request.email)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at,
    )


@router.post(
    "/me/password",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"description": "Not authenticated or incorrect current password"},
    },
)
async def change_password(
    request: ChangePasswordRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Change the current user's password.

    Requires the current password for verification.
    """
    success = await update_user_password(
        db, current_user, request.current_password, request.new_password
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )
