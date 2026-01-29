"""Hello world API endpoint."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/hello")
async def hello_world():
    """Hello world endpoint.

    Returns a simple greeting message.
    """
    return {
        "message": "Hello, World!",
    }
