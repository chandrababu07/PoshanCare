from unittest.mock import patch
import pytest
from httpx import AsyncClient
from app.services.auth import get_user_by_email, get_user_by_google_sub


@pytest.mark.asyncio
async def test_google_auth_new_user(client: AsyncClient, db_session):
    """Test authenticating a new Google user creates user account and returns HttpOnly cookies."""
    mock_claims = {
        "sub": "google-user-sub-12345",
        "email": "new.google.user@example.com",
        "name": "Google User",
        "email_verified": True,
        "iss": "https://accounts.google.com",
    }

    with patch("app.api.v1.endpoints.auth.verify_google_id_token", return_value=mock_claims):
        response = await client.post(
            "/api/v1/auth/google",
            json={"id_token": "fake-google-id-token"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["user"]["email"] == "new.google.user@example.com"
    assert data["user"]["full_name"] == "Google User"
    assert data["user"]["auth_provider"] == "google"
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies

    # Verify user in database
    user = await get_user_by_google_sub(db_session, "google-user-sub-12345")
    assert user is not None
    assert user.email == "new.google.user@example.com"
    assert user.password_hash is None
    assert user.is_verified is True


@pytest.mark.asyncio
async def test_google_auth_account_linking(client: AsyncClient, db_session):
    """Test linking Google sub to an existing email password user account."""
    # 1. Register normal email user
    reg_payload = {
        "email": "existing.user@example.com",
        "password": "Password123!",
        "full_name": "Existing User",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201

    # 2. Login with Google using same email
    mock_claims = {
        "sub": "google-sub-linked-9999",
        "email": "existing.user@example.com",
        "name": "Existing User Google",
        "email_verified": True,
        "iss": "https://accounts.google.com",
    }

    with patch("app.api.v1.endpoints.auth.verify_google_id_token", return_value=mock_claims):
        response = await client.post(
            "/api/v1/auth/google",
            json={"id_token": "fake-google-id-token"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "existing.user@example.com"
    assert data["user"]["auth_provider"] == "hybrid"
    assert "access_token" in response.cookies

    # Check DB update
    user = await get_user_by_email(db_session, "existing.user@example.com")
    assert user is not None
    assert user.google_sub == "google-sub-linked-9999"
    assert user.auth_provider == "hybrid"
