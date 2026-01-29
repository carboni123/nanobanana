"""Tests for health check endpoint."""

from datetime import datetime

import pytest
from httpx import AsyncClient


class TestHealthEndpoint:
    """Tests for GET /health."""

    @pytest.mark.asyncio
    async def test_health_check_success(self, client: AsyncClient):
        """Test that health check returns 200 and correct structure."""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_health_check_status(self, client: AsyncClient):
        """Test that health check returns status 'ok'."""
        response = await client.get("/health")

        data = response.json()
        assert data["status"] == "ok"

    @pytest.mark.asyncio
    async def test_health_check_version(self, client: AsyncClient):
        """Test that health check returns correct version."""
        response = await client.get("/health")

        data = response.json()
        assert data["version"] == "0.1.0"

    @pytest.mark.asyncio
    async def test_health_check_timestamp_format(self, client: AsyncClient):
        """Test that timestamp is in ISO 8601 format."""
        response = await client.get("/health")

        data = response.json()
        timestamp = data["timestamp"]

        # Verify it's a valid ISO 8601 timestamp
        try:
            parsed_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            assert parsed_time is not None
        except ValueError:
            pytest.fail(f"Timestamp '{timestamp}' is not valid ISO 8601 format")

    @pytest.mark.asyncio
    async def test_health_check_timestamp_recent(self, client: AsyncClient):
        """Test that timestamp is recent (within 1 second)."""
        before = datetime.utcnow()
        response = await client.get("/health")
        after = datetime.utcnow()

        data = response.json()
        timestamp = data["timestamp"]
        parsed_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))

        # Remove timezone info for comparison
        parsed_time = parsed_time.replace(tzinfo=None)

        assert before <= parsed_time <= after

    @pytest.mark.asyncio
    async def test_health_check_no_auth_required(self, client: AsyncClient):
        """Test that health check doesn't require authentication."""
        response = await client.get("/health")

        # Should succeed without any Authorization header
        assert response.status_code == 200
