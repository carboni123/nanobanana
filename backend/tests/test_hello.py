"""Tests for the hello world endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_hello_world(client: AsyncClient):
    """Test the hello world endpoint returns the expected message."""
    response = await client.get("/v1/hello")

    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}


@pytest.mark.asyncio
async def test_hello_world_content_type(client: AsyncClient):
    """Test the hello world endpoint returns JSON content type."""
    response = await client.get("/v1/hello")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
