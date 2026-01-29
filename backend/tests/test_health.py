"""Tests for health check endpoint."""

import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app import VERSION


class TestHealthEndpoint:
    """Tests for GET /api/v1/health."""

    @pytest.mark.asyncio
    async def test_health_check_returns_200(self, client: AsyncClient):
        """Test that health check returns 200 status code."""
        response = await client.get("/api/v1/health")

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_health_check_correct_schema(self, client: AsyncClient):
        """Test that health check returns response with correct schema."""
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()

        # Verify all required fields are present
        assert "status" in data
        assert "version" in data
        assert "uptime_seconds" in data
        assert "database_status" in data
        assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_uptime_increases_between_requests(self, client: AsyncClient):
        """Test that uptime increases between consecutive requests."""
        # First request
        response1 = await client.get("/api/v1/health")
        data1 = response1.json()
        uptime1 = data1["uptime_seconds"]

        # Wait a small amount of time
        await asyncio.sleep(0.1)

        # Second request
        response2 = await client.get("/api/v1/health")
        data2 = response2.json()
        uptime2 = data2["uptime_seconds"]

        # Uptime should have increased
        assert uptime2 > uptime1
        # The difference should be approximately 0.1 seconds (allow some variance)
        assert 0.05 < (uptime2 - uptime1) < 0.3

    @pytest.mark.asyncio
    async def test_database_connected_with_healthy_db(self, client: AsyncClient):
        """Test that database_status is 'connected' when database is healthy."""
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()

        assert data["database_status"] == "connected"
        assert data["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_database_disconnected_when_db_unavailable(self, client: AsyncClient):
        """Test that database_status is 'disconnected' when database fails."""
        # Mock the check_database_connectivity to simulate DB failure
        with patch(
            "app.features.health.api.check_database_connectivity",
            new_callable=AsyncMock,
        ) as mock_check:
            mock_check.return_value = "disconnected"

            response = await client.get("/api/v1/health")

            assert response.status_code == 200
            data = response.json()

            assert data["database_status"] == "disconnected"
            assert data["status"] == "unhealthy"

    @pytest.mark.asyncio
    async def test_version_matches_expected_value(self, client: AsyncClient):
        """Test that version matches the expected application version."""
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()

        assert data["version"] == VERSION
        assert data["version"] == "0.1.0"

    @pytest.mark.asyncio
    async def test_status_field_values(self, client: AsyncClient):
        """Test that status field contains valid values."""
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()

        # With healthy DB, status should be 'healthy'
        assert data["status"] in ["healthy", "unhealthy"]

    @pytest.mark.asyncio
    async def test_uptime_is_non_negative(self, client: AsyncClient):
        """Test that uptime_seconds is always non-negative."""
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()

        assert data["uptime_seconds"] >= 0.0
        assert isinstance(data["uptime_seconds"], (int, float))

    @pytest.mark.asyncio
    async def test_timestamp_is_valid_iso_format(self, client: AsyncClient):
        """Test that timestamp is in valid ISO 8601 format."""
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()

        timestamp = data["timestamp"]

        # Verify it's a valid ISO 8601 timestamp
        try:
            parsed_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            assert parsed_time is not None
        except ValueError:
            pytest.fail(f"Timestamp '{timestamp}' is not valid ISO 8601 format")

    @pytest.mark.asyncio
    async def test_timestamp_is_recent(self, client: AsyncClient):
        """Test that timestamp is recent (within acceptable tolerance)."""
        before = datetime.utcnow()
        response = await client.get("/api/v1/health")
        after = datetime.utcnow()

        assert response.status_code == 200
        data = response.json()

        timestamp = data["timestamp"]
        parsed_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))

        # Remove timezone info for comparison
        parsed_time = parsed_time.replace(tzinfo=None)

        # Timestamp should be between request times
        assert before <= parsed_time <= after

    @pytest.mark.asyncio
    async def test_health_check_no_auth_required(self, client: AsyncClient):
        """Test that health check doesn't require authentication."""
        # Create a fresh client without any auth headers
        response = await client.get("/api/v1/health")

        # Should succeed without any Authorization header
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_database_status_field_values(self, client: AsyncClient):
        """Test that database_status contains valid values."""
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()

        assert data["database_status"] in ["connected", "disconnected"]

    @pytest.mark.asyncio
    async def test_response_structure_consistency(self, client: AsyncClient):
        """Test that multiple requests return consistent structure."""
        # Make multiple requests
        responses = []
        for _ in range(3):
            response = await client.get("/api/v1/health")
            responses.append(response.json())
            await asyncio.sleep(0.05)

        # All responses should have the same keys
        keys_set = set(responses[0].keys())
        for response_data in responses[1:]:
            assert set(response_data.keys()) == keys_set

        # Version should be constant across all responses
        for response_data in responses:
            assert response_data["version"] == VERSION

        # Uptime should increase monotonically
        for i in range(len(responses) - 1):
            assert responses[i + 1]["uptime_seconds"] > responses[i]["uptime_seconds"]
