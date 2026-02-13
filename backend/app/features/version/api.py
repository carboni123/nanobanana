"""Version API endpoint."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/version")
async def get_version() -> dict[str, str]:
    """Get API version and name.

    Returns the current version and name of the API.
    """
    return {
        "version": "1.0.0",
        "name": "NanoBanana",
    }
