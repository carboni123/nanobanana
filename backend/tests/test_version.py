"""Tests for the version endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_version_returns_200(client: AsyncClient):
    """Test the version endpoint returns 200 status code."""
    response = await client.get("/version")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_version_returns_correct_body(client: AsyncClient):
    """Test the version endpoint returns the expected version and name."""
    response = await client.get("/version")

    assert response.json() == {"version": "1.0.0", "name": "NanoBanana"}


@pytest.mark.asyncio
async def test_version_content_type(client: AsyncClient):
    """Test the version endpoint returns JSON content type."""
    response = await client.get("/version")

    assert response.headers["content-type"] == "application/json"
