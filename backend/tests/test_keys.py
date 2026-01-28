"""Tests for API key management endpoints."""

import pytest
import pytest_asyncio
from httpx import AsyncClient


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


class TestCreateKey:
    """Tests for POST /v1/keys."""

    @pytest.mark.asyncio
    async def test_create_key_success(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Creating a key returns the full key string."""
        response = await client.post(
            "/v1/keys",
            json={"name": "My Test Key"},
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()

        assert "id" in data
        assert "key" in data
        assert "name" in data
        assert "prefix" in data
        assert "created_at" in data

        # Verify key format
        assert data["key"].startswith("nb_live_")
        assert len(data["key"]) == 40
        assert data["name"] == "My Test Key"
        assert data["prefix"] == "nb_live_"

    @pytest.mark.asyncio
    async def test_create_key_default_name(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Creating a key without a name uses default."""
        response = await client.post(
            "/v1/keys",
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 201
        assert response.json()["name"] == "Default Key"

    @pytest.mark.asyncio
    async def test_create_key_unauthorized(self, client: AsyncClient) -> None:
        """Creating a key without JWT returns 401."""
        response = await client.post(
            "/v1/keys",
            json={"name": "Test Key"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_key_invalid_token(self, client: AsyncClient) -> None:
        """Creating a key with invalid JWT returns 401."""
        response = await client.post(
            "/v1/keys",
            json={"name": "Test Key"},
            headers={"Authorization": "Bearer invalid_token"},
        )

        assert response.status_code == 401


class TestListKeys:
    """Tests for GET /v1/keys."""

    @pytest.mark.asyncio
    async def test_list_keys_empty(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Listing keys when none exist returns empty list."""
        response = await client.get("/v1/keys", headers=auth_headers)

        assert response.status_code == 200
        assert response.json()["keys"] == []

    @pytest.mark.asyncio
    async def test_list_keys_returns_prefix_not_full_key(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Listed keys show prefix only, not full key."""
        # Create a key first
        create_response = await client.post(
            "/v1/keys",
            json={"name": "Test Key"},
            headers=auth_headers,
        )
        full_key = create_response.json()["key"]

        # List keys
        response = await client.get("/v1/keys", headers=auth_headers)

        assert response.status_code == 200
        keys = response.json()["keys"]
        assert len(keys) == 1

        key = keys[0]
        assert "prefix" in key
        assert "key" not in key  # Full key should NOT be present
        assert key["prefix"] == "nb_live_"
        assert full_key not in str(key)  # Full key not in response

    @pytest.mark.asyncio
    async def test_list_keys_shows_active_status(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Listed keys include is_active status."""
        # Create a key
        await client.post(
            "/v1/keys",
            json={"name": "Test Key"},
            headers=auth_headers,
        )

        response = await client.get("/v1/keys", headers=auth_headers)
        key = response.json()["keys"][0]

        assert key["is_active"] is True


class TestDeleteKey:
    """Tests for DELETE /v1/keys/{key_id}."""

    @pytest.mark.asyncio
    async def test_delete_key_success(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Deleting a key sets is_active to False."""
        # Create a key
        create_response = await client.post(
            "/v1/keys",
            json={"name": "Test Key"},
            headers=auth_headers,
        )
        key_id = create_response.json()["id"]

        # Delete the key
        response = await client.delete(f"/v1/keys/{key_id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify it's now inactive
        list_response = await client.get("/v1/keys", headers=auth_headers)
        keys = list_response.json()["keys"]
        assert len(keys) == 1
        assert keys[0]["is_active"] is False

    @pytest.mark.asyncio
    async def test_delete_key_not_found(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Deleting a non-existent key returns 404."""
        response = await client.delete(
            "/v1/keys/nonexistent-id",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_key_not_owner(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Deleting another user's key returns 404."""
        # Create a key with first user
        create_response = await client.post(
            "/v1/keys",
            json={"name": "User 1 Key"},
            headers=auth_headers,
        )
        key_id = create_response.json()["id"]

        # Create second user
        second_user = await client.post(
            "/v1/auth/register",
            json={"email": "user2@example.com", "password": "password123"},
        )
        second_token = second_user.json()["access_token"]

        # Try to delete first user's key with second user's token
        response = await client.delete(
            f"/v1/keys/{key_id}",
            headers={"Authorization": f"Bearer {second_token}"},
        )

        assert response.status_code == 404


class TestKeyFormat:
    """Tests for API key format."""

    @pytest.mark.asyncio
    async def test_key_format_correct(
        self, client: AsyncClient, auth_headers: dict
    ) -> None:
        """Keys follow the format nb_live_<32 hex chars>."""
        response = await client.post(
            "/v1/keys",
            json={},
            headers=auth_headers,
        )

        key = response.json()["key"]

        # Verify format
        assert key.startswith("nb_live_")
        assert len(key) == 40  # 8 (prefix) + 32 (hex)

        # Verify hex part
        hex_part = key[8:]  # After "nb_live_"
        assert len(hex_part) == 32
        # Should only contain hex characters
        assert all(c in "0123456789abcdef" for c in hex_part)
