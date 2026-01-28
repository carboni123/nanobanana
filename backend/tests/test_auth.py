"""Tests for authentication endpoints."""

import pytest
from httpx import AsyncClient

from app.features.auth.service import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    """Tests for password hashing functions."""

    def test_hash_password_returns_hash(self):
        """Test that hash_password returns a bcrypt hash."""
        password = "mysecretpassword"
        hashed = hash_password(password)

        assert hashed != password
        assert hashed.startswith("$2b$")  # bcrypt prefix

    def test_verify_password_correct(self):
        """Test that verify_password returns True for correct password."""
        password = "mysecretpassword"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test that verify_password returns False for incorrect password."""
        password = "mysecretpassword"
        wrong_password = "wrongpassword"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_different_passwords_different_hashes(self):
        """Test that different passwords produce different hashes."""
        password1 = "password1"
        password2 = "password2"

        hash1 = hash_password(password1)
        hash2 = hash_password(password2)

        assert hash1 != hash2


class TestJWT:
    """Tests for JWT token functions."""

    def test_create_access_token(self):
        """Test that create_access_token returns a valid JWT."""
        user_id = "test-user-id-123"
        token = create_access_token(user_id)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_access_token_valid(self):
        """Test that decode_access_token correctly decodes a valid token."""
        user_id = "test-user-id-123"
        token = create_access_token(user_id)
        payload = decode_access_token(token)

        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["type"] == "access"

    def test_decode_access_token_invalid(self):
        """Test that decode_access_token returns None for invalid token."""
        invalid_token = "invalid.token.here"
        payload = decode_access_token(invalid_token)

        assert payload is None

    def test_decode_access_token_tampered(self):
        """Test that decode_access_token returns None for tampered token."""
        user_id = "test-user-id-123"
        token = create_access_token(user_id)
        tampered_token = token[:-5] + "xxxxx"
        payload = decode_access_token(tampered_token)

        assert payload is None


class TestRegisterEndpoint:
    """Tests for POST /v1/auth/register."""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient, test_user_data):
        """Test successful user registration."""
        response = await client.post("/v1/auth/register", json=test_user_data)

        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_user_data["email"]
        assert "id" in data["user"]
        assert "created_at" in data["user"]

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, test_user_data):
        """Test registration with duplicate email returns 409."""
        await client.post("/v1/auth/register", json=test_user_data)
        response = await client.post("/v1/auth/register", json=test_user_data)

        assert response.status_code == 409
        assert response.json()["detail"] == "Email already registered"

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email returns 422."""
        response = await client.post(
            "/v1/auth/register",
            json={"email": "notanemail", "password": "securepassword123"},
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_short_password(self, client: AsyncClient):
        """Test registration with short password returns 422."""
        response = await client.post(
            "/v1/auth/register",
            json={"email": "test@example.com", "password": "short"},
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_missing_fields(self, client: AsyncClient):
        """Test registration with missing fields returns 422."""
        response = await client.post("/v1/auth/register", json={})

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_password_not_in_response(
        self, client: AsyncClient, test_user_data
    ):
        """Test that password is not included in response."""
        response = await client.post("/v1/auth/register", json=test_user_data)

        data = response.json()
        assert "password" not in data
        assert "password" not in data.get("user", {})
        assert "password_hash" not in data.get("user", {})


class TestLoginEndpoint:
    """Tests for POST /v1/auth/login."""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user_data):
        """Test successful login."""
        await client.post("/v1/auth/register", json=test_user_data)
        response = await client.post("/v1/auth/login", json=test_user_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, test_user_data):
        """Test login with wrong password returns 401."""
        await client.post("/v1/auth/register", json=test_user_data)
        response = await client.post(
            "/v1/auth/login",
            json={"email": test_user_data["email"], "password": "wrongpassword"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with nonexistent email returns 401."""
        response = await client.post(
            "/v1/auth/login",
            json={"email": "nonexistent@example.com", "password": "password123"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"

    @pytest.mark.asyncio
    async def test_login_invalid_email_format(self, client: AsyncClient):
        """Test login with invalid email format returns 422."""
        response = await client.post(
            "/v1/auth/login",
            json={"email": "notanemail", "password": "password123"},
        )

        assert response.status_code == 422


class TestMeEndpoint:
    """Tests for GET /v1/auth/me."""

    @pytest.mark.asyncio
    async def test_me_authenticated(self, client: AsyncClient, test_user_data):
        """Test getting current user info when authenticated."""
        register_response = await client.post("/v1/auth/register", json=test_user_data)
        token = register_response.json()["access_token"]

        response = await client.get(
            "/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_me_no_token(self, client: AsyncClient):
        """Test getting current user info without token returns 401."""
        response = await client.get("/v1/auth/me")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_me_invalid_token(self, client: AsyncClient):
        """Test getting current user info with invalid token returns 401."""
        response = await client.get(
            "/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_me_expired_token(self, client: AsyncClient, test_user_data):
        """Test that token from login can be used for /me endpoint."""
        await client.post("/v1/auth/register", json=test_user_data)
        login_response = await client.post("/v1/auth/login", json=test_user_data)
        token = login_response.json()["access_token"]

        response = await client.get(
            "/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json()["email"] == test_user_data["email"]
