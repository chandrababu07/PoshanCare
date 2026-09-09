import pytest
from httpx import AsyncClient
from app.core.security import verify_password
from app.services.auth import get_user_by_email


@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient, db_session):
    """Test successful user registration with HttpOnly auth cookies."""
    payload = {
        "email": "test.user@example.com",
        "password": "SecurePassword123!",
        "full_name": "Test User",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["user"]["email"] == "test.user@example.com"
    assert data["user"]["full_name"] == "Test User"
    assert "password_hash" not in data["user"]

    # Verify cookies set in response
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies

    # Verify user in database
    user = await get_user_by_email(db_session, "test.user@example.com")
    assert user is not None
    assert verify_password("SecurePassword123!", user.password_hash)


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test registering with an existing email returns 400 Bad Request."""
    payload = {
        "email": "duplicate@example.com",
        "password": "SecurePassword123!",
        "full_name": "Original User",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    data = res2.json()
    assert data["error"]["code"] == "EMAIL_EXISTS"


@pytest.mark.asyncio
async def test_register_invalid_payload(client: AsyncClient):
    """Test registration with weak password returns 422 Unprocessable Entity."""
    payload = {
        "email": "weak@example.com",
        "password": "short",
        "full_name": "Weak User",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login returns user profile and sets auth cookies."""
    reg_payload = {
        "email": "login.user@example.com",
        "password": "SecurePassword123!",
        "full_name": "Login User",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "login.user@example.com",
        "password": "SecurePassword123!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "login.user@example.com"
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with wrong password returns 401 Unauthorized."""
    reg_payload = {
        "email": "wrongpass@example.com",
        "password": "SecurePassword123!",
        "full_name": "Wrong Pass User",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "wrongpass@example.com",
        "password": "WrongPassword999!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_get_me_protected_endpoint(client: AsyncClient):
    """Test GET /api/v1/auth/me returns current user profile when authenticated."""
    reg_payload = {
        "email": "me.user@example.com",
        "password": "SecurePassword123!",
        "full_name": "Me User",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    access_token = reg_res.cookies.get("access_token")

    # Call /me with cookie
    response = await client.get("/api/v1/auth/me", cookies={"access_token": access_token})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me.user@example.com"
    assert data["full_name"] == "Me User"


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    """Test GET /api/v1/auth/me without cookies returns 401 Unauthorized."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    """Test POST /api/v1/auth/refresh rotates refresh session and issues new tokens."""
    reg_payload = {
        "email": "refresh.user@example.com",
        "password": "SecurePassword123!",
        "full_name": "Refresh User",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    old_refresh_token = reg_res.cookies.get("refresh_token")

    # Perform refresh call
    refresh_res = await client.post(
        "/api/v1/auth/refresh", cookies={"refresh_token": old_refresh_token}
    )
    assert refresh_res.status_code == 200
    new_refresh_token = refresh_res.cookies.get("refresh_token")
    assert new_refresh_token is not None
    assert new_refresh_token != old_refresh_token

    # Attempting to reuse old refresh token should fail (Revoked session)
    reuse_res = await client.post(
        "/api/v1/auth/refresh", cookies={"refresh_token": old_refresh_token}
    )
    assert reuse_res.status_code == 401


@pytest.mark.asyncio
async def test_logout_clears_cookies(client: AsyncClient):
    """Test POST /api/v1/auth/logout revokes session and returns cleared cookie headers."""
    reg_payload = {
        "email": "logout.user@example.com",
        "password": "SecurePassword123!",
        "full_name": "Logout User",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    refresh_token = reg_res.cookies.get("refresh_token")

    logout_res = await client.post(
        "/api/v1/auth/logout", cookies={"refresh_token": refresh_token}
    )
    assert logout_res.status_code == 200

    # Verify session is revoked (refreshing with old token fails)
    after_logout_ref = await client.post(
        "/api/v1/auth/refresh", cookies={"refresh_token": refresh_token}
    )
    assert after_logout_ref.status_code == 401
