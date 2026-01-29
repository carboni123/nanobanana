"""Tests for usage analytics endpoints."""

from datetime import date, timedelta

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usage import Usage


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient, test_user_data: dict) -> str:
    """Create a user and return their auth token."""
    response = await client.post("/v1/auth/register", json=test_user_data)
    assert response.status_code == 201
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    """Return headers with auth token."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest_asyncio.fixture
async def api_key_id(client: AsyncClient, auth_headers: dict) -> str:
    """Create an API key and return its ID."""
    response = await client.post(
        "/v1/keys",
        json={"name": "Test Key"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


@pytest_asyncio.fixture
async def second_api_key_id(client: AsyncClient, auth_headers: dict) -> str:
    """Create a second API key and return its ID."""
    response = await client.post(
        "/v1/keys",
        json={"name": "Second Key"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


async def create_usage_record(
    db_session: AsyncSession, api_key_id: str, usage_date: date, image_count: int
) -> None:
    """Helper to create a usage record."""
    usage = Usage(
        api_key_id=api_key_id,
        usage_date=usage_date,
        image_count=image_count,
    )
    db_session.add(usage)
    await db_session.commit()


class TestGetSummary:
    """Tests for GET /v1/usage/summary."""

    @pytest.mark.asyncio
    async def test_summary_no_usage(
        self, client: AsyncClient, auth_headers: dict, api_key_id: str
    ) -> None:
        """Summary with no usage returns zeros."""
        response = await client.get("/v1/usage/summary", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["total_images"] == 0
        assert data["total_keys"] == 1
        assert data["active_keys"] == 1
        assert len(data["top_keys"]) == 1
        assert data["top_keys"][0]["image_count"] == 0

    @pytest.mark.asyncio
    async def test_summary_with_usage(
        self,
        client: AsyncClient,
        auth_headers: dict,
        api_key_id: str,
        db_session: AsyncSession,
    ) -> None:
        """Summary correctly aggregates usage across keys."""
        # Create usage for today
        today = date.today()
        await create_usage_record(db_session, api_key_id, today, 10)

        response = await client.get("/v1/usage/summary", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["total_images"] == 10
        assert data["total_keys"] == 1
        assert data["active_keys"] == 1
        assert len(data["top_keys"]) == 1
        assert data["top_keys"][0]["image_count"] == 10

    @pytest.mark.asyncio
    async def test_summary_multiple_keys(
        self,
        client: AsyncClient,
        auth_headers: dict,
        api_key_id: str,
        second_api_key_id: str,
        db_session: AsyncSession,
    ) -> None:
        """Summary aggregates across multiple keys and sorts by usage."""
        today = date.today()
        await create_usage_record(db_session, api_key_id, today, 5)
        await create_usage_record(db_session, second_api_key_id, today, 15)

        response = await client.get("/v1/usage/summary", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["total_images"] == 20
        assert data["total_keys"] == 2
        assert data["active_keys"] == 2
        assert len(data["top_keys"]) == 2

        # Check that keys are sorted by usage (descending)
        assert data["top_keys"][0]["image_count"] == 15
        assert data["top_keys"][1]["image_count"] == 5

    @pytest.mark.asyncio
    async def test_summary_unauthorized(self, client: AsyncClient) -> None:
        """Summary without auth returns 401."""
        response = await client.get("/v1/usage/summary")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_summary_top_keys_limit(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db_session: AsyncSession,
    ) -> None:
        """Summary returns max 5 top keys."""
        # Create 7 keys with different usage
        today = date.today()
        for i in range(7):
            key_response = await client.post(
                "/v1/keys",
                json={"name": f"Key {i}"},
                headers=auth_headers,
            )
            key_id = key_response.json()["id"]
            await create_usage_record(db_session, key_id, today, i * 10)

        response = await client.get("/v1/usage/summary", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Should only return top 5
        assert len(data["top_keys"]) == 5
        assert data["total_keys"] == 7


class TestGetDaily:
    """Tests for GET /v1/usage/daily."""

    @pytest.mark.asyncio
    async def test_daily_no_usage(
        self, client: AsyncClient, auth_headers: dict, api_key_id: str
    ) -> None:
        """Daily usage with no records returns empty list."""
        response = await client.get("/v1/usage/daily", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["days"] == []

    @pytest.mark.asyncio
    async def test_daily_with_usage(
        self,
        client: AsyncClient,
        auth_headers: dict,
        api_key_id: str,
        db_session: AsyncSession,
    ) -> None:
        """Daily usage returns correct breakdown."""
        today = date.today()
        yesterday = today - timedelta(days=1)

        await create_usage_record(db_session, api_key_id, today, 10)
        await create_usage_record(db_session, api_key_id, yesterday, 5)

        response = await client.get("/v1/usage/daily", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert len(data["days"]) == 2

        # Should be sorted by date descending
        assert data["days"][0]["usage_date"] == str(today)
        assert data["days"][0]["image_count"] == 10
        assert data["days"][1]["usage_date"] == str(yesterday)
        assert data["days"][1]["image_count"] == 5

    @pytest.mark.asyncio
    async def test_daily_custom_days(
        self,
        client: AsyncClient,
        auth_headers: dict,
        api_key_id: str,
        db_session: AsyncSession,
    ) -> None:
        """Daily usage respects days parameter."""
        today = date.today()

        # Create usage for last 10 days
        for i in range(10):
            usage_date = today - timedelta(days=i)
            await create_usage_record(db_session, api_key_id, usage_date, i + 1)

        # Request only last 5 days
        response = await client.get(
            "/v1/usage/daily?days=5", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Should only return 5 days
        assert len(data["days"]) == 5

    @pytest.mark.asyncio
    async def test_daily_aggregates_multiple_keys(
        self,
        client: AsyncClient,
        auth_headers: dict,
        api_key_id: str,
        second_api_key_id: str,
        db_session: AsyncSession,
    ) -> None:
        """Daily usage aggregates across all user's keys."""
        today = date.today()

        await create_usage_record(db_session, api_key_id, today, 10)
        await create_usage_record(db_session, second_api_key_id, today, 5)

        response = await client.get("/v1/usage/daily", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert len(data["days"]) == 1
        assert data["days"][0]["image_count"] == 15

    @pytest.mark.asyncio
    async def test_daily_invalid_days_param(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Daily usage rejects invalid days parameter."""
        # Test days < 1
        response = await client.get("/v1/usage/daily?days=0", headers=auth_headers)
        assert response.status_code == 422

        # Test days > 365
        response = await client.get("/v1/usage/daily?days=366", headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_daily_unauthorized(self, client: AsyncClient) -> None:
        """Daily usage without auth returns 401."""
        response = await client.get("/v1/usage/daily")
        assert response.status_code == 401


class TestGetKeyUsage:
    """Tests for GET /v1/usage/key/{key_id}."""

    @pytest.mark.asyncio
    async def test_key_usage_no_usage(
        self, client: AsyncClient, auth_headers: dict, api_key_id: str
    ) -> None:
        """Key usage with no records returns zero total."""
        response = await client.get(
            f"/v1/usage/key/{api_key_id}", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["key_id"] == api_key_id
        assert data["total_images"] == 0
        assert data["daily_usage"] == []

    @pytest.mark.asyncio
    async def test_key_usage_with_usage(
        self,
        client: AsyncClient,
        auth_headers: dict,
        api_key_id: str,
        db_session: AsyncSession,
    ) -> None:
        """Key usage returns correct statistics."""
        today = date.today()
        yesterday = today - timedelta(days=1)

        await create_usage_record(db_session, api_key_id, today, 10)
        await create_usage_record(db_session, api_key_id, yesterday, 5)

        response = await client.get(
            f"/v1/usage/key/{api_key_id}", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["key_id"] == api_key_id
        assert data["total_images"] == 15
        assert len(data["daily_usage"]) == 2

        # Should be sorted by date descending
        assert data["daily_usage"][0]["usage_date"] == str(today)
        assert data["daily_usage"][0]["image_count"] == 10

    @pytest.mark.asyncio
    async def test_key_usage_not_found(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Key usage for non-existent key returns 404."""
        response = await client.get(
            "/v1/usage/key/nonexistent-id", headers=auth_headers
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_key_usage_not_owner(
        self, client: AsyncClient, auth_headers: dict, api_key_id: str
    ) -> None:
        """Key usage for another user's key returns 404."""
        # Create second user
        second_user = await client.post(
            "/v1/auth/register",
            json={"email": "user2@example.com", "password": "password123"},
        )
        second_token = second_user.json()["access_token"]

        # Try to view first user's key usage with second user's token
        response = await client.get(
            f"/v1/usage/key/{api_key_id}",
            headers={"Authorization": f"Bearer {second_token}"},
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_key_usage_includes_key_details(
        self, client: AsyncClient, auth_headers: dict, api_key_id: str
    ) -> None:
        """Key usage includes key name and prefix."""
        response = await client.get(
            f"/v1/usage/key/{api_key_id}", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["key_name"] == "Test Key"
        assert data["key_prefix"] == "nb_live_"

    @pytest.mark.asyncio
    async def test_key_usage_unauthorized(
        self, client: AsyncClient, api_key_id: str
    ) -> None:
        """Key usage without auth returns 401."""
        response = await client.get(f"/v1/usage/key/{api_key_id}")
        assert response.status_code == 401
